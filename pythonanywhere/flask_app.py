"""
Portfolio Backend - Flask WSGI Application
Replaces all Next.js API routes for PythonAnywhere free plan deployment.

Endpoints:
  POST /api/contact              - Contact form submission (email + MySQL)
  POST /api/admin/login          - Admin JWT authentication
  GET  /api/admin/messages       - Fetch all contact messages (JWT required)
  DELETE /api/admin/messages     - Delete a message by ID (JWT required)
  GET  /api/admin/stats          - Dashboard stats (JWT required)
  GET  /api/admin/role-distribution - Role stats (JWT required)
  GET  /api/projects             - Return all portfolio projects JSON
  GET  /api/status               - Health check
"""

import os
import json
import smtplib
import hashlib
import hmac
import base64
import struct
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone
from functools import wraps

try:
    import pymysql
    import pymysql.cursors
    HAS_PYMYSQL = True
except ImportError:
    HAS_PYMYSQL = False

import sqlite3
import bcrypt
import jwt as pyjwt
from flask import Flask, request, jsonify, make_response, send_from_directory, send_file

try:
    from flask_cors import CORS
    HAS_CORS = True
except ImportError:
    HAS_CORS = False

# ─────────────────────────────────────────────
# App Setup
# ─────────────────────────────────────────────
app = Flask(__name__)

if HAS_CORS:
    CORS(app, origins=[
        "https://krishnaportfolio.pythonanywhere.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ], supports_credentials=True)

# ─────────────────────────────────────────────
# Configuration (from environment variables)
# ─────────────────────────────────────────────
JWT_SECRET = os.environ.get('JWT_SECRET', 'super-secret-jwt-key-portfolio-2026')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@portfolio.com')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')

SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASS = os.environ.get('SMTP_PASS', '')
CONTACT_RECEIVER_EMAIL = os.environ.get('CONTACT_RECEIVER_EMAIL', SMTP_USER)

# Database config
DB_HOST = os.environ.get('DB_HOST', 'KrishnaPortfolio.mysql.pythonanywhere-services.com')
DB_USER = os.environ.get('DB_USER', 'KrishnaPortfolio')
DB_PASS = os.environ.get('DB_PASS', '')
DB_NAME = os.environ.get('DB_NAME', 'KrishnaPortfolio$portfolio')
SQLITE_DB_PATH = os.environ.get('SQLITE_DB_PATH', '/home/KrishnaPortfolio/portfolio.db')
if not os.path.exists(os.path.dirname(SQLITE_DB_PATH)) and not os.path.isabs(SQLITE_DB_PATH):
    SQLITE_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'portfolio.db')

# ─────────────────────────────────────────────
# Database Wrapper & Helper (MySQL + SQLite)
# ─────────────────────────────────────────────
class DBCursor:
    def __init__(self, is_sqlite, cur):
        self.is_sqlite = is_sqlite
        self.cur = cur

    def execute(self, sql, params=()):
        if self.is_sqlite:
            # Convert %s placeholders to ? for SQLite
            sql = sql.replace('%s', '?')
            sql = sql.replace('AUTO_INCREMENT', 'AUTOINCREMENT')
            sql = sql.replace('INT AUTOINCREMENT', 'INTEGER AUTOINCREMENT')
            sql = sql.replace('ENGINE=InnoDB DEFAULT CHARSET=utf8mb4', '')
        return self.cur.execute(sql, params)

    def fetchone(self):
        row = self.cur.fetchone()
        if row is None:
            return None
        return dict(row) if self.is_sqlite else row

    def fetchall(self):
        rows = self.cur.fetchall()
        if self.is_sqlite:
            return [dict(r) for r in rows]
        return rows

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        try:
            self.cur.close()
        except Exception:
            pass


class DBWrapper:
    def __init__(self, is_sqlite, conn):
        self.is_sqlite = is_sqlite
        self.conn = conn

    def cursor(self):
        return DBCursor(self.is_sqlite, self.conn.cursor())

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()


def get_db():
    """Get DB connection: tries MySQL first if configured, falls back to SQLite."""
    if HAS_PYMYSQL and DB_PASS:
        try:
            conn = pymysql.connect(
                host=DB_HOST,
                user=DB_USER,
                password=DB_PASS,
                database=DB_NAME,
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=3,
            )
            return DBWrapper(False, conn)
        except Exception as e:
            print(f"[DB] MySQL unavailable ({e}), using SQLite fallback.")

    try:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        conn.row_factory = sqlite3.Row
        return DBWrapper(True, conn)
    except Exception as e:
        print(f"[DB] SQLite connection failed: {e}")
        return None


def ensure_tables():
    """Create tables if they don't exist."""
    conn = get_db()
    if not conn:
        return
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS contact_messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    phone VARCHAR(50),
                    subject VARCHAR(500),
                    message TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS visitors (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(255),
                    role VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'identified',
                    ip_address VARCHAR(100),
                    user_agent TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
        conn.commit()
    except Exception as e:
        print(f"[DB] Table creation error: {e}")
    finally:
        conn.close()


# Run on startup
ensure_tables()


# ─────────────────────────────────────────────
# JWT Auth Helper
# ─────────────────────────────────────────────
def verify_admin_token():
    """Verify Bearer JWT token from Authorization header or cookie."""
    # Try Authorization header first
    auth_header = request.headers.get('Authorization', '')
    token = None
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
    # Fallback to cookie
    if not token:
        token = request.cookies.get('admin_token')
    if not token:
        return False
    try:
        pyjwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return True
    except pyjwt.ExpiredSignatureError:
        return False
    except pyjwt.InvalidTokenError:
        return False


def require_auth(f):
    """Decorator that requires valid JWT token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not verify_admin_token():
            return jsonify({'message': 'Unauthorized access'}), 401
        return f(*args, **kwargs)
    return decorated


# ─────────────────────────────────────────────
# Email Helper
# ─────────────────────────────────────────────
def send_contact_email(name, email, phone, subject, message):
    """Send contact form email via SMTP. Returns True on success."""
    if not SMTP_USER or not SMTP_PASS or SMTP_PASS == 'app-password-here':
        return False
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"Portfolio Inquiry: {subject}" if subject else f"New Portfolio Inquiry from {name}"
        msg['From'] = SMTP_USER
        msg['To'] = CONTACT_RECEIVER_EMAIL
        msg['Reply-To'] = email

        html_body = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;
                    max-width: 600px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">New Portfolio Contact Request</h2>
          <p><strong>Name:</strong> {name}</p>
          <p><strong>Email:</strong> {email}</p>
          <p><strong>Phone:</strong> {phone or 'N/A'}</p>
          <p><strong>Subject:</strong> {subject or 'N/A'}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <h3 style="color: #1e293b;">Message:</h3>
          <p style="white-space: pre-wrap; background: #f8fafc;
                    padding: 15px; border-radius: 8px;">{message}</p>
        </div>
        """
        msg.attach(MIMEText(html_body, 'html'))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, CONTACT_RECEIVER_EMAIL, msg.as_string())
        return True
    except Exception as e:
        print(f"[EMAIL] Send failed: {e}")
        return False


# ─────────────────────────────────────────────
# Projects Data (hardcoded — same as your constants.ts)
# ─────────────────────────────────────────────
PROJECTS = [
    {"id": "proj-administration-automation-platform", "title": "Administration Automation Platform", "subtitle": "Automated office workflow & digital sign-offs", "description": "Automated administrative workflow system digitizing leave approvals, asset allocation, payroll vouchers, and document sign-offs.", "longDescription": "Office administrative automation tool standardizing employee leave requests and internal resource approvals.", "category": "Full Stack", "technologies": ["Node.js", "Express", "MongoDB", "React", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Administration-Automation-Platform", "liveUrl": "https://github.com/Krishna8208863439/Administration-Automation-Platform", "featured": True},
    {"id": "proj-advance-mall", "title": "Advance Mall", "subtitle": "Modern Web project built with TypeScript", "description": "Advance Mall is a comprehensive Web solution engineered with modern TypeScript architecture, robust responsive design, and intuitive user workflows.", "longDescription": "Enterprise-grade web application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "Web", "technologies": ["TypeScript", "Next.js", "React", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Advance-Mall", "liveUrl": "https://github.com/Krishna8208863439/Advance-Mall", "featured": True},
    {"id": "proj-agro-vision-analytics", "title": "Agro Vision Analytics", "subtitle": "Multispectral computer vision crop health monitoring", "description": "Satellite & drone crop health monitoring using computer vision multispectral indices to detect plant disease and predict harvest yield.", "longDescription": "Precision agriculture suite processing aerial multispectral imagery to evaluate soil hydration, pest threats, and yield targets.", "category": "AI", "technologies": ["Python", "PyTorch", "OpenCV", "FastAPI", "React"], "image": "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Agro-Vision-Analytics", "liveUrl": "https://github.com/Krishna8208863439/Agro-Vision-Analytics", "featured": True},
    {"id": "proj-ai", "title": "Smart Kisan AI \u2013 Agritech Platform", "subtitle": "AI crop yield recommendation, plant disease diagnosis & live market prices", "description": "AI-driven smart agriculture platform providing crop recommendation, plant leaf disease detection using computer vision, real-time market price predictions, soil telemetry, and an AI farming assistant.", "longDescription": "Comprehensive agritech ecosystem helping farmers optimize crop yields, detect crop diseases using deep neural networks, monitor soil metrics, track live mandi prices, and consult an AI agronomist.", "category": "AI", "technologies": ["Python", "Flask", "FastAPI", "TensorFlow", "OpenCV", "React", "Node.js", "Tailwind CSS", "MongoDB"], "image": "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Ai", "liveUrl": "https://github.com/Krishna8208863439/Ai", "featured": True},
    {"id": "proj-ai-agent-", "title": "Autonomous Multi-Agent Workspace", "subtitle": "Multi-agent collaboration engine & browser automation", "description": "Autonomous task execution framework where specialized planner, browser researcher, code builder, and reviewer AI agents collaborate to fulfill complex developer goals.", "longDescription": "Autonomous multi-agent system coordinating specialized AI subagents with tool execution, browser automation, web search, and code synthesis.", "category": "AI", "technologies": ["Python", "LangChain", "CrewAI", "FastAPI", "React", "Next.js"], "image": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/AI-Agent-", "liveUrl": "https://github.com/Krishna8208863439/AI-Agent-", "featured": True},
    {"id": "proj-ai-gravity-escape", "title": "AI Gravity Escape", "subtitle": "AI-powered physics puzzle game where players manipulate gravity, solve challenging escape puzzles, and experience adaptive difficulty, intelligent hints, and AI-validated level generation.", "description": "AI-powered physics puzzle game where players manipulate gravity, solve challenging escape puzzles, and experience adaptive difficulty, intelligent hints, and AI-validated level generation.", "longDescription": "Enterprise-grade ai application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "AI", "technologies": ["TypeScript", "Next.js", "React", "Tailwind CSS", "Machine Learning"], "image": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/AI-Gravity-Escape", "liveUrl": "https://github.com/Krishna8208863439/AI-Gravity-Escape", "featured": True},
    {"id": "proj-ai-subscription-leak-detector", "title": "AI Subscription Leak Detector", "subtitle": "Automated bank statement SaaS charge analyzer", "description": "Automated bank statement analyzer identifying hidden recurring SaaS charges, price increases, and unused subscriptions.", "longDescription": "Smart financial tool analyzing connected bank accounts to flag recurring subscriptions and hidden trial fees.", "category": "AI", "technologies": ["React", "Node.js", "OpenAI API", "Plaid API", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/AI-Subscription-Leak-Detector", "liveUrl": "https://github.com/Krishna8208863439/AI-Subscription-Leak-Detector", "featured": True},
    {"id": "proj-autonomous-multi-agent", "title": "Autonomous Multi-Agent Workspace", "subtitle": "Multi-agent collaboration engine & browser automation", "description": "Autonomous task execution framework where specialized planner, browser researcher, code builder, and reviewer AI agents collaborate to fulfill complex developer goals.", "longDescription": "Autonomous multi-agent system coordinating specialized AI subagents with tool execution, browser automation, web search, and code synthesis.", "category": "AI", "technologies": ["Python", "LangChain", "CrewAI", "FastAPI", "React", "Next.js"], "image": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Autonomous-Multi-Agent", "liveUrl": "https://github.com/Krishna8208863439/Autonomous-Multi-Agent", "featured": True},
    {"id": "proj-book-exchange-platform", "title": "Book Exchange Platform", "subtitle": "Community book trading & parcel tracker", "description": "Community book swapping platform allowing readers to list books, send trade requests, rate traders, and track parcel deliveries.", "longDescription": "Peer-to-peer book swapping service encouraging reader exchanges and catalog sharing.", "category": "Web", "technologies": ["React", "Node.js", "Express", "MongoDB", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Book-Exchange-Platform", "liveUrl": "https://github.com/Krishna8208863439/Book-Exchange-Platform", "featured": True},
    {"id": "proj-car-rental-management", "title": "Car Rental Management System", "subtitle": "Vehicle fleet management & rental contracts", "description": "Fleet management and rental booking application handling vehicle availability, driver ID checks, and rental contracts.", "longDescription": "Vehicle rental management suite tracking fleet status, reservation schedules, and customer contracts.", "category": "Full Stack", "technologies": ["React", "TypeScript", "Node.js", "MongoDB", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Car-Rental-Management", "liveUrl": "https://github.com/Krishna8208863439/Car-Rental-Management", "featured": True},
    {"id": "proj-chatbot", "title": "End-to-End AI Medical Chatbot", "subtitle": "RAG-powered health assistant for medical triage & symptom diagnosis", "description": "RAG-powered conversational medical chatbot trained on healthcare datasets for symptom evaluation, medical triage guidance, and prescription information.", "longDescription": "AI healthcare assistant utilizing Retrieval-Augmented Generation (RAG) and vector databases to parse clinical medical manuals, provide instant symptom advice, and answer medical queries.", "category": "AI", "technologies": ["Python", "LangChain", "Pinecone", "OpenAI API", "Flask", "React", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Chatbot", "liveUrl": "https://github.com/Krishna8208863439/Chatbot", "featured": True},
    {"id": "proj-chatgpt", "title": "ChatGPT Assistant Clone", "subtitle": "Conversational LLM workspace with code rendering", "description": "High-performance AI chat interface supporting code syntax highlighting, markdown rendering, thread history, and system prompts.", "longDescription": "Conversational AI workspace providing streaming responses, multi-model selection, and session history management.", "category": "AI", "technologies": ["Next.js", "TypeScript", "OpenAI API", "Tailwind CSS", "Framer Motion"], "image": "https://images.unsplash.com/photo-1676299081847-824916de030a?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/chatgpt", "liveUrl": "https://github.com/Krishna8208863439/chatgpt", "featured": True},
    {"id": "proj-civic-redressal-planner", "title": "Civic Redressal Planner", "subtitle": "AI-powered civic grievance management platform for automated complaint routing, prioritization, and SLA tracking.", "description": "AI-powered civic grievance management platform for automated complaint routing, prioritization, and SLA tracking.", "longDescription": "Enterprise-grade ai application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "AI", "technologies": ["TypeScript", "Next.js", "React", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/civic-redressal-planner", "liveUrl": "https://github.com/Krishna8208863439/civic-redressal-planner", "featured": True},
    {"id": "proj-coderush2-0-codewarriors", "title": "Coderush2.0 Codewarriors", "subtitle": "AI-powered civic complaint platform where citizens report local issues via text and image, in English or Hindi. AI auto-classifies complaints, detects duplicates, and routes them to the right department. Includes SLA tracking, a live GIS map, and dashboards for citizens, officers, and admins.", "description": "AI-powered civic complaint platform where citizens report local issues via text and image, in English or Hindi. AI auto-classifies complaints, detects duplicates, and routes them to the right department. Includes SLA tracking, a live GIS map, and dashboards for citizens, officers, and admins.", "longDescription": "Enterprise-grade ai application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "AI", "technologies": ["TypeScript", "Next.js", "React", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/CodeRush2.0_CodeWarriors", "liveUrl": "https://github.com/Krishna8208863439/CodeRush2.0_CodeWarriors", "featured": True},
    {"id": "proj-college-management-system", "title": "College Management System", "subtitle": "Faculty, enrollment & marks portal", "description": "Comprehensive college portal managing faculty rosters, department courses, student enrollment, and examination marks.", "longDescription": "Higher education ERP managing student registrations, course schedules, faculty assignments, and transcripts.", "category": "Full Stack", "technologies": ["React", "TypeScript", "Node.js", "MySQL", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/college-management-system", "liveUrl": "https://github.com/Krishna8208863439/college-management-system", "featured": True},
    {"id": "proj-crisis-response-center", "title": "Crisis Response Center", "subtitle": "Emergency disaster response coordination platform", "description": "Emergency disaster response coordination platform mapping incidents, resource distribution, and real-time survivor SOS alerts.", "longDescription": "Disaster management hub connecting first responders, relief centers, and affected citizens with live map routing.", "category": "Full Stack", "technologies": ["Next.js", "Leaflet", "Node.js", "WebSockets", "MongoDB"], "image": "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Crisis-Response-Center", "liveUrl": "https://github.com/Krishna8208863439/Crisis-Response-Center", "featured": True},
    {"id": "proj-decision-studio", "title": "Decision Studio", "subtitle": "Multi-criteria decision science & risk engine", "description": "Multi-criteria decision analysis engine leveraging weighted matrix modeling and AI risk simulation for strategic choices.", "longDescription": "Decision science application helping leadership teams rank business strategies through automated risk scenarios.", "category": "AI", "technologies": ["Python", "FastAPI", "React", "TypeScript", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Decision-Studio", "liveUrl": "https://github.com/Krishna8208863439/Decision-Studio", "featured": True},
    {"id": "proj-digital-banking-", "title": "Digital Banking Platform", "subtitle": "Online banking & fund transfer portal", "description": "Modern online banking experience with account statements, fund transfers, virtual debit cards, and loan applications.", "longDescription": "Fintech online banking interface supporting account history, interbank transfers, and card management.", "category": "Full Stack", "technologies": ["React", "TypeScript", "Node.js", "PostgreSQL", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Digital-Banking-", "liveUrl": "https://github.com/Krishna8208863439/Digital-Banking-", "featured": True},
    {"id": "proj-digital-health-identity-", "title": "Digital Health Identity Vault", "subtitle": "Encrypted medical records & prescription vault", "description": "Encrypted personal medical record locker supporting doctor access sharing, prescription storage, and lab report history.", "longDescription": "Patient health locker ensuring private medical records can be securely shared with healthcare providers.", "category": "Full Stack", "technologies": ["React", "Node.js", "CryptoJS", "MongoDB", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Digital-Health-Identity-", "liveUrl": "https://github.com/Krishna8208863439/Digital-Health-Identity-", "featured": True},
    {"id": "proj-digital-safety", "title": "Digital Safety System", "subtitle": "Personal emergency SOS & live GPS alert app", "description": "Personal safety SOS application triggerable via quick shortcut, sending live GPS telemetry and audio alerts to trusted contacts.", "longDescription": "Mobile safety portal offering quick shortcut emergency alerts, live GPS streaming, and panic notifications.", "category": "Web", "technologies": ["React", "TypeScript", "Geolocation API", "Twilio", "Node.js"], "image": "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Digital-Safety", "liveUrl": "https://github.com/Krishna8208863439/Digital-Safety", "featured": True},
    {"id": "proj-doctor-appointment", "title": "Doctor Appointment Booking", "subtitle": "Clinical time slot & doctor consultation app", "description": "Healthcare portal allowing patients to search specialists, book clinic time slots, upload medical records, and pay online.", "longDescription": "Medical portal allowing patients to find specialists, schedule consultations, and manage digital health records.", "category": "Web", "technologies": ["React", "Node.js", "Express", "MongoDB", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Doctor-Appointment", "liveUrl": "https://github.com/Krishna8208863439/Doctor-Appointment", "featured": True},
    {"id": "proj-document-assistant", "title": "Document Assistant AI", "subtitle": "RAG semantic search & Q&A over PDF manuals", "description": "RAG-powered PDF document search and chat system enabling instant semantic query answering over 500+ page manuals.", "longDescription": "Vector search assistant indexing large technical documents for instant conversational Q&A.", "category": "AI", "technologies": ["Python", "LangChain", "OpenAI API", "FAISS", "Next.js"], "image": "https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Document-Assistant", "liveUrl": "https://github.com/Krishna8208863439/Document-Assistant", "featured": True},
    {"id": "proj-e-commerce-analytics", "title": "E-Commerce Analytics Hub", "subtitle": "Real-time sales performance & customer LTV forecasting", "description": "Real-time sales performance, customer LTV forecasting, conversion funnel tracking, and inventory telemetry dashboard.", "longDescription": "High-conversion analytics engine analyzing sales funnels, cart abandonment rates, and revenue projections.", "category": "Web", "technologies": ["React", "Next.js", "Tailwind CSS", "PostgreSQL", "Chart.js"], "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/E-commerce-analytics", "liveUrl": "https://github.com/Krishna8208863439/E-commerce-analytics", "featured": True},
    {"id": "proj-education-learning", "title": "Education & Learning Portal", "subtitle": "Interactive LMS platform with course tracking", "description": "Interactive e-learning LMS featuring video courses, quiz assignments, progress tracking, and peer discussion forums.", "longDescription": "Comprehensive learning management system supporting video streaming, interactive quizzes, and student gradebooks.", "category": "Web", "technologies": ["React", "Next.js", "Tailwind CSS", "Node.js", "MongoDB"], "image": "https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Education-Learning", "liveUrl": "https://github.com/Krishna8208863439/Education-Learning", "featured": True},
    {"id": "proj-edumentor-ai", "title": "Edumentor AI", "subtitle": "Adaptive AI teacher for personalized, interactive, multilingual learning.", "description": "Adaptive AI teacher for personalized, interactive, multilingual learning.", "longDescription": "Enterprise-grade ai application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "AI", "technologies": ["TypeScript", "Next.js", "React", "Tailwind CSS", "Machine Learning"], "image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/EduMentor-AI", "liveUrl": "https://github.com/Krishna8208863439/EduMentor-AI", "featured": False},
    {"id": "proj-emergency-hospital-finder", "title": "Emergency Hospital Finder", "subtitle": "Real-time ICU bed & trauma center locator", "description": "Real-time ICU bed availability, blood bank stock levels, ambulance dispatch, and nearest trauma center locator.", "longDescription": "Medical emergency app providing real-time ICU bed updates, blood availability, and instant ambulance dispatching.", "category": "Web", "technologies": ["React", "Leaflet", "Node.js", "MongoDB", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Emergency-Hospital-Finder", "liveUrl": "https://github.com/Krishna8208863439/Emergency-Hospital-Finder", "featured": True},
    {"id": "proj-fake-news-detection", "title": "Fake News Detection System", "subtitle": "BERT transformer news credibility scorer", "description": "NLP classifier scoring news articles for credibility, bias, and clickbait indicators using BERT transformers.", "longDescription": "Natural language processing classifier rating news reliability and identifying sensationalist bias.", "category": "AI", "technologies": ["Python", "PyTorch", "Transformers", "FastAPI", "React"], "image": "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Fake-News-Detection", "liveUrl": "https://github.com/Krishna8208863439/Fake-News-Detection", "featured": True},
    {"id": "proj-file-transfer-system", "title": "File Transfer System", "subtitle": "Peer-to-peer WebRTC encrypted browser file transfer", "description": "Peer-to-peer WebRTC file transfer utility enabling instant browser-to-browser encrypted file transfers without cloud limits.", "longDescription": "Direct P2P file sender transferring files directly between client browsers with end-to-end encryption.", "category": "Web", "technologies": ["React", "WebRTC", "Socket.io", "Tailwind CSS", "TypeScript"], "image": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/File-Transfer-System", "liveUrl": "https://github.com/Krishna8208863439/File-Transfer-System", "featured": True},
    {"id": "proj-finreach-ai", "title": "FinReach AI", "subtitle": "Microfinance credit risk scoring model", "description": "AI-driven microfinance credit scoring engine evaluating alternative data points for underbanked entrepreneurs.", "longDescription": "Financial inclusion AI scoring creditworthiness through alternative mobile and business activity data.", "category": "AI", "technologies": ["Python", "XGBoost", "Scikit-learn", "FastAPI", "React"], "image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/FinReach-AI", "liveUrl": "https://github.com/Krishna8208863439/FinReach-AI", "featured": True},
    {"id": "proj-first-python-program-ml", "title": "First Python Program ML", "subtitle": "Modern AI project built with Jupyter Notebook", "description": "First Python Program ML is a comprehensive AI solution engineered with modern Jupyter Notebook architecture, robust responsive design, and intuitive user workflows.", "longDescription": "Enterprise-grade ai application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "AI", "technologies": ["Jupyter Notebook", "Machine Learning", "TensorFlow", "Scikit-learn"], "image": "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/First-Python-Program-ML", "liveUrl": "https://github.com/Krishna8208863439/First-Python-Program-ML", "featured": False},
    {"id": "proj-flight-booking", "title": "Flight Booking Portal", "subtitle": "Airline flight comparison & boarding pass generator", "description": "Airline flight search comparison, fare class selection, seat map reservation, baggage add-ons, and boarding passes.", "longDescription": "Travel booking system enabling multi-city flight searches, fare class options, and digital boarding passes.", "category": "Full Stack", "technologies": ["Next.js", "TypeScript", "Node.js", "PostgreSQL", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Flight-Booking", "liveUrl": "https://github.com/Krishna8208863439/Flight-Booking", "featured": True},
    {"id": "proj-flood-prediction-emergency-platform", "title": "Flood Prediction Emergency Platform", "subtitle": "AI-powered flood prediction and emergency management platform for real-time risk assessment, flood alerts, GIS-based risk mapping, safe-route recommendations, and emergency response coordination.", "description": "AI-powered flood prediction and emergency management platform for real-time risk assessment, flood alerts, GIS-based risk mapping, safe-route recommendations, and emergency response coordination.", "longDescription": "Enterprise-grade ai application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "AI", "technologies": ["TypeScript", "Next.js", "React", "Tailwind CSS", "Machine Learning"], "image": "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/FLOOD-PREDICTION-EMERGENCY-PLATFORM", "liveUrl": "https://github.com/Krishna8208863439/FLOOD-PREDICTION-EMERGENCY-PLATFORM", "featured": False},
    {"id": "proj-food-delivery", "title": "Zomato Food Delivery Clone", "subtitle": "Hyperlocal food ordering & live delivery tracker", "description": "Hyperlocal food ordering platform featuring restaurant discovery, menu customization, live GPS order tracking, and review system.", "longDescription": "On-demand food delivery portal connecting users with local restaurants, real-time map tracking, and reviews.", "category": "Full Stack", "technologies": ["React", "Next.js", "Node.js", "MongoDB", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Food-Delivery", "liveUrl": "https://github.com/Krishna8208863439/Food-Delivery", "featured": True},
    {"id": "proj-founder-operating-system", "title": "Founder Operating System", "subtitle": "All-in-one workspace for startup founders", "description": "All-in-one founder workspace managing investor CRM, runway calculation, KPI metrics, task execution, and team delegation.", "longDescription": "Central command portal for startup founders tracking burn rates, cap tables, key metrics, and team milestones.", "category": "Web", "technologies": ["Next.js", "React", "Tailwind CSS", "Supabase", "Framer Motion"], "image": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Founder-operating-system", "liveUrl": "https://github.com/Krishna8208863439/Founder-operating-system", "featured": True},
    {"id": "proj-full-stack", "title": "Full Stack App Suite", "subtitle": "Modular enterprise web application boilerplate", "description": "Modular enterprise codebase boilerplate with RBAC authentication, dark/light theme, API rate limiting, and Stripe billing.", "longDescription": "Production-ready full stack architecture with multi-tenant auth, role permissions, and integrated payments.", "category": "Full Stack", "technologies": ["Next.js", "TypeScript", "Node.js", "MongoDB", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Full-Stack", "liveUrl": "https://github.com/Krishna8208863439/Full-Stack", "featured": True},
    {"id": "proj-gallery-app", "title": "Gallery App", "subtitle": "Cloud image vault with automated AI tagging", "description": "High-speed cloud image vault with automated AI auto-tagging, face grouping, spatial search, and seamless drag-and-drop uploads.", "longDescription": "Personal photo management suite using deep neural networks to automatically index and search photo collections.", "category": "Web", "technologies": ["React", "Next.js", "Cloudinary", "Tailwind CSS", "Framer Motion"], "image": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Gallery-App", "liveUrl": "https://github.com/Krishna8208863439/Gallery-App", "featured": True},
    {"id": "proj-gaming-platform", "title": "Gaming Platform Hub", "subtitle": "Browser games portal with global leaderboards", "description": "Online web gaming hub hosting browser games, global score leaderboards, player profiles, and tournament brackets.", "longDescription": "Online arcade portal offering browser games, score leaderboards, and multiplayer room codes.", "category": "Web", "technologies": ["React", "PhaserJS", "Socket.io", "Tailwind CSS", "Node.js"], "image": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Gaming-Platform", "liveUrl": "https://github.com/Krishna8208863439/Gaming-Platform", "featured": True},
    {"id": "proj-grocery-delivery-platform", "title": "Grocery Delivery Platform", "subtitle": "Hyperlocal grocery ordering & rider tracker", "description": "Instant grocery store delivery platform featuring inventory stock tracking, delivery slots, and real-time rider tracking.", "longDescription": "On-demand grocery app facilitating quick delivery of fresh produce and household essentials.", "category": "Full Stack", "technologies": ["React", "Next.js", "Node.js", "MongoDB", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Grocery-Delivery-Platform", "liveUrl": "https://github.com/Krishna8208863439/Grocery-Delivery-Platform", "featured": True},
    {"id": "proj-health-opd", "title": "Health OPD", "subtitle": "Modern Web project built with JavaScript", "description": "Health OPD is a comprehensive Web solution engineered with modern JavaScript architecture, robust responsive design, and intuitive user workflows.", "longDescription": "Enterprise-grade web application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "Web", "technologies": ["JavaScript", "React", "Node.js", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Health-OPD", "liveUrl": "https://github.com/Krishna8208863439/Health-OPD", "featured": False},
    {"id": "proj-hotel-booking", "title": "Hotel Booking Management System", "subtitle": "Property reservation platform with dynamic pricing", "description": "Comprehensive property reservation platform with dynamic room pricing, seasonal availability calendars, and payment gateway.", "longDescription": "Full hotel operations management tool handling online bookings, room cleaning status, guest check-ins, and billing.", "category": "Full Stack", "technologies": ["Next.js", "TypeScript", "Stripe", "PostgreSQL", "Prisma"], "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Hotel-Booking", "liveUrl": "https://github.com/Krishna8208863439/Hotel-Booking", "featured": True},
    {"id": "proj-hotel-booking-management-system", "title": "Hotel Booking Management System", "subtitle": "Property reservation platform with dynamic pricing", "description": "Comprehensive property reservation platform with dynamic room pricing, seasonal availability calendars, and payment gateway.", "longDescription": "Full hotel operations management tool handling online bookings, room cleaning status, guest check-ins, and billing.", "category": "Full Stack", "technologies": ["Next.js", "TypeScript", "Stripe", "PostgreSQL", "Prisma"], "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Hotel-Booking-Management-System", "liveUrl": "https://github.com/Krishna8208863439/Hotel-Booking-Management-System", "featured": True},
    {"id": "proj-house-price-prediction", "title": "House Price Prediction", "subtitle": "AI-powered House Price Prediction system using Machine Learning, Linear Regression, EDA, and Flask to estimate property prices based on housing features.", "description": "AI-powered House Price Prediction system using Machine Learning, Linear Regression, EDA, and Flask to estimate property prices based on housing features.", "longDescription": "Enterprise-grade ai application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "AI", "technologies": ["HTML", "Machine Learning", "TensorFlow", "Scikit-learn"], "image": "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/House-Price-Prediction", "liveUrl": "https://github.com/Krishna8208863439/House-Price-Prediction", "featured": False},
    {"id": "proj-house-rental-property-system", "title": "House Rental Property System", "subtitle": "Modern Full Stack project built with TypeScript", "description": "House Rental Property System is a comprehensive Full Stack solution engineered with modern TypeScript architecture, robust responsive design, and intuitive user workflows.", "longDescription": "Enterprise-grade full stack application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "Full Stack", "technologies": ["TypeScript", "Next.js", "React", "Tailwind CSS", "PostgreSQL"], "image": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/House-Rental-Property-System", "liveUrl": "https://github.com/Krishna8208863439/House-Rental-Property-System", "featured": False},
    {"id": "proj-instagram", "title": "Instagram Social Media Clone", "subtitle": "Photo/video feed social platform with stories", "description": "Photo & video sharing social platform featuring stories, posts, likes, comment threads, direct messages, and filters.", "longDescription": "Media-first social app equipped with image filters, interactive stories, and real-time chat.", "category": "Full Stack", "technologies": ["React", "Next.js", "Firebase", "Tailwind CSS", "Framer Motion"], "image": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Instagram", "liveUrl": "https://github.com/Krishna8208863439/Instagram", "featured": True},
    {"id": "proj-intelligence-investigation-board", "title": "Intelligence Investigation Board", "subtitle": "Interactive node graph visualization board", "description": "Interactive node graph visualization board for law enforcement data link analysis, suspect connections, and timeline evidence.", "longDescription": "Graph network analytics application connecting complex case evidence, financial transactions, and suspect communication channels.", "category": "AI", "technologies": ["React", "Cytoscape.js", "Python", "FastAPI", "Neo4j"], "image": "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/intelligence-investigation-board", "liveUrl": "https://github.com/Krishna8208863439/intelligence-investigation-board", "featured": True},
    {"id": "proj-iris-species-prediction-system", "title": "Iris Species Prediction System", "subtitle": "\ud83c\udf38 Machine learning-based Iris flower species prediction using sepal and petal measurements with Python and Scikit-learn.", "description": "\ud83c\udf38 Machine learning-based Iris flower species prediction using sepal and petal measurements with Python and Scikit-learn.", "longDescription": "Enterprise-grade ai application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "AI", "technologies": ["Python", "Flask", "FastAPI", "Machine Learning", "TensorFlow"], "image": "https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Iris-Species-Prediction-System", "liveUrl": "https://github.com/Krishna8208863439/Iris-Species-Prediction-System", "featured": False},
    {"id": "proj-kisan-website", "title": "Kisan Website", "subtitle": "Modern AI project built with HTML", "description": "Kisan Website is a comprehensive AI solution engineered with modern HTML architecture, robust responsive design, and intuitive user workflows.", "longDescription": "Enterprise-grade ai application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "AI", "technologies": ["HTML"], "image": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Kisan-Website", "liveUrl": "https://github.com/Krishna8208863439/Kisan-Website", "featured": False},
    {"id": "proj-kisanchat-bot", "title": "Kisanchat Bot", "subtitle": "Modern AI project built with HTML", "description": "Kisanchat Bot is a comprehensive AI solution engineered with modern HTML architecture, robust responsive design, and intuitive user workflows.", "longDescription": "Enterprise-grade ai application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "AI", "technologies": ["HTML"], "image": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/kisanchat_bot", "liveUrl": "https://github.com/Krishna8208863439/kisanchat_bot", "featured": False},
    {"id": "proj-library-management-system", "title": "Library Management System", "subtitle": "Digital cataloging & RFID borrowing administration", "description": "Digital cataloging, RFID book issuance, fine tracking, automated reminder dispatch, and reader borrowing telemetry.", "longDescription": "Automated library administration portal tracking physical books, digital loans, reader memberships, and return schedules.", "category": "Full Stack", "technologies": ["Node.js", "Express", "MySQL", "React", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Library-Management-System", "liveUrl": "https://github.com/Krishna8208863439/Library-Management-System", "featured": True},
    {"id": "proj-linkedin", "title": "LinkedIn Network Clone", "subtitle": "Professional social network & job portal", "description": "Professional networking platform clone supporting connection requests, feed posts, job listings, and message threads.", "longDescription": "Professional networking platform featuring career updates, connection feeds, and recruitment portals.", "category": "Full Stack", "technologies": ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1611944212129-29977ae1398c?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Linkedin", "liveUrl": "https://github.com/Krishna8208863439/Linkedin", "featured": True},
    {"id": "proj-market-intelligence-price-prediction", "title": "Market Intelligence & Price Prediction", "subtitle": "LSTM time series forecasting for commodity prices", "description": "Commodity & stock price trend forecasting platform utilizing historical time series data and LSTM neural networks.", "longDescription": "Neural network time series forecasting platform analyzing market trends to predict commodity prices.", "category": "AI", "technologies": ["Python", "TensorFlow", "Pandas", "Flask", "Chart.js"], "image": "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Market-Intelligence-Price-Prediction", "liveUrl": "https://github.com/Krishna8208863439/Market-Intelligence-Price-Prediction", "featured": True},
    {"id": "proj-medical-chatbot", "title": "End-to-End AI Medical Chatbot", "subtitle": "RAG-powered health assistant for medical triage & symptom diagnosis", "description": "RAG-powered conversational medical chatbot trained on healthcare datasets for symptom evaluation, medical triage guidance, and prescription information.", "longDescription": "AI healthcare assistant utilizing Retrieval-Augmented Generation (RAG) and vector databases to parse clinical medical manuals, provide instant symptom advice, and answer medical queries.", "category": "AI", "technologies": ["Python", "LangChain", "Pinecone", "OpenAI API", "Flask", "React", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Medical-Chatbot", "liveUrl": "https://github.com/Krishna8208863439/Medical-Chatbot", "featured": True},
    {"id": "proj-meesho", "title": "Meesho E-Commerce Platform", "subtitle": "Social reseller marketplace & order manager", "description": "Social e-commerce marketplace clone enabling seller storefront creation, product sharing, order management, and commission tracking.", "longDescription": "Social e-commerce storefront allowing independent sellers to catalog products and process customer orders.", "category": "Web", "technologies": ["React", "Next.js", "Node.js", "MongoDB", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Meesho", "liveUrl": "https://github.com/Krishna8208863439/Meesho", "featured": True},
    {"id": "proj-movie-recommendation", "title": "Movie Recommendation Engine", "subtitle": "Collaborative filtering & content preference engine", "description": "Collaborative filtering and content-based recommendation system parsing user preferences to suggest tailored film lists.", "longDescription": "Recommendation engine scoring user taste profiles to serve personalized movie lists.", "category": "AI", "technologies": ["Python", "Scikit-learn", "TMDB API", "React", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Movie-Recommendation", "liveUrl": "https://github.com/Krishna8208863439/Movie-Recommendation", "featured": True},
    {"id": "proj-movie-ticket-booking", "title": "Movie Ticket Booking System", "subtitle": "Cinema seat map & showtime booking app", "description": "Cinema seat selection layout, showtime schedule browser, food counter pre-orders, and e-ticket QR generation.", "longDescription": "Entertainment booking portal featuring interactive seat maps, snack concessions, and QR entry passes.", "category": "Web", "technologies": ["React", "Node.js", "Express", "MongoDB", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Movie-Ticket-Booking", "liveUrl": "https://github.com/Krishna8208863439/Movie-Ticket-Booking", "featured": True},
    {"id": "proj-multiplayer-quiz-game", "title": "Multiplayer Quiz Game", "subtitle": "Real-time WebSockets trivia game", "description": "Real-time competitive multiplayer trivia game with WebSockets lobbies, live scores, countdown timers, and streak bonuses.", "longDescription": "Real-time trivia game where players join live room codes to compete in timed question rounds.", "category": "Web", "technologies": ["React", "Socket.io", "Node.js", "Tailwind CSS", "Framer Motion"], "image": "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Multiplayer-Quiz-Game", "liveUrl": "https://github.com/Krishna8208863439/Multiplayer-Quiz-Game", "featured": True},
    {"id": "proj-museum-guide-application", "title": "Museum Guide Application", "subtitle": "AR exhibit scanner & audio narrative tour guide", "description": "Interactive exhibit guide featuring AR artifact scanning, audio narrative playback, and exhibit map routing.", "longDescription": "Digital museum companion giving visitors interactive 3D exhibit scans and guided audio tours.", "category": "Web", "technologies": ["React", "Three.js", "Tailwind CSS", "Framer Motion", "PWA"], "image": "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Museum-Guide-Application", "liveUrl": "https://github.com/Krishna8208863439/Museum-Guide-Application", "featured": True},
    {"id": "proj-netflix", "title": "Netflix Advance Platform", "subtitle": "Video streaming suite with trailer auto-play", "description": "Feature-rich movie streaming platform with trailer auto-play, category carousels, watchlists, and user profiles.", "longDescription": "Video streaming platform featuring responsive hero video previews, custom playlists, and title search.", "category": "Web", "technologies": ["React", "Next.js", "TMDB API", "Tailwind CSS", "Firebase"], "image": "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Netflix", "liveUrl": "https://github.com/Krishna8208863439/Netflix", "featured": True},
    {"id": "proj-netflix-advance", "title": "Netflix Advance Platform", "subtitle": "Video streaming suite with trailer auto-play", "description": "Feature-rich movie streaming platform with trailer auto-play, category carousels, watchlists, and user profiles.", "longDescription": "Video streaming platform featuring responsive hero video previews, custom playlists, and title search.", "category": "Web", "technologies": ["React", "Next.js", "TMDB API", "Tailwind CSS", "Firebase"], "image": "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Netflix-Advance", "liveUrl": "https://github.com/Krishna8208863439/Netflix-Advance", "featured": True},
    {"id": "proj-online-book-store", "title": "Online Book Store", "subtitle": "Digital bookstore & e-reader web app", "description": "Digital bookstore with instant book previews, e-reader mode, genre browsing, cart checkout, and reader reviews.", "longDescription": "E-commerce book store offering digital sample previews, instant checkout, and reader reviews.", "category": "Web", "technologies": ["React", "Node.js", "Express", "MongoDB", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Online-Book-Store", "liveUrl": "https://github.com/Krishna8208863439/Online-Book-Store", "featured": True},
    {"id": "proj-online-chess-game", "title": "Online Chess Game", "subtitle": "WebSockets chess with AI Stockfish engine", "description": "Interactive web chess application supporting player vs player WebSockets matches, AI bot difficulty levels, and move history.", "longDescription": "Web chess game offering PvP matchmaking, move validation, and Stockfish AI opponent levels.", "category": "Web", "technologies": ["React", "Chess.js", "Stockfish API", "Socket.io", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Online-Chess-Game", "liveUrl": "https://github.com/Krishna8208863439/Online-Chess-Game", "featured": True},
    {"id": "proj-online-examination-system-", "title": "Online Examination System", "subtitle": "Modern Full Stack project built with JavaScript", "description": "Online Examination System is a comprehensive Full Stack solution engineered with modern JavaScript architecture, robust responsive design, and intuitive user workflows.", "longDescription": "Enterprise-grade full stack application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "Full Stack", "technologies": ["JavaScript", "React", "Node.js", "Tailwind CSS", "PostgreSQL"], "image": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Online-Examination-System-", "liveUrl": "https://github.com/Krishna8208863439/Online-Examination-System-", "featured": False},
    {"id": "proj-online-file-storage", "title": "Online File Storage Platform", "subtitle": "Cloud drive with secure link sharing & preview", "description": "Cloud storage drive supporting file uploading, folder creation, link sharing, preview rendering, and storage metrics.", "longDescription": "Cloud file locker featuring drag-and-drop uploads, access permissions, and document previews.", "category": "Full Stack", "technologies": ["React", "Node.js", "AWS S3", "Express", "MongoDB"], "image": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Online-File-Storage", "liveUrl": "https://github.com/Krishna8208863439/Online-File-Storage", "featured": True},
    {"id": "proj-online-voting-system", "title": "Online Voting System", "subtitle": "Cryptographically verified election portal", "description": "Cryptographically verified online election portal ensuring voter anonymity, tamper-proof ballot counting, and audit logs.", "longDescription": "Secure digital voting system utilizing cryptographic hashing to prevent vote manipulation and guarantee transparency.", "category": "Full Stack", "technologies": ["Node.js", "Express", "CryptoJS", "MongoDB", "React"], "image": "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Online-Voting-System", "liveUrl": "https://github.com/Krishna8208863439/Online-Voting-System", "featured": True},
    {"id": "proj-openlake", "title": "Openlake", "subtitle": "OpenLake is a high performance storage engine for efficient LLM inference and GPU Training", "description": "OpenLake is a high performance storage engine for efficient LLM inference and GPU Training", "longDescription": "Enterprise-grade ai application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "AI", "technologies": ["React", "JavaScript", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/openlake", "liveUrl": "https://theopenlake.com", "featured": False},
    {"id": "proj-password-manager", "title": "Password Manager Vault", "subtitle": "Zero-knowledge AES-256 encrypted credential vault", "description": "Zero-knowledge AES-256 encrypted credential vault with master key derivative hashing, breach alerts, and 2FA generator.", "longDescription": "Secure password locker utilizing local client encryption before sync, preventing unauthorized data breaches.", "category": "Web", "technologies": ["React", "TypeScript", "CryptoJS", "Node.js", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Password-Manager", "liveUrl": "https://github.com/Krishna8208863439/Password-Manager", "featured": True},
    {"id": "proj-personal-finance-visual-budget-splitter", "title": "Personal Finance & Visual Budget Splitter", "subtitle": "Visual envelope budgeting & cash flow splitter", "description": "Interactive visual monthly expense breakdown tool with envelope budgeting, subscription tracking, and saving goal progress bars.", "longDescription": "Personal budget optimizer helping users visualize monthly cash flows and automate savings allocations.", "category": "Web", "technologies": ["React", "Tailwind CSS", "Framer Motion", "Chart.js", "LocalStorage"], "image": "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Personal-Finance-Visual-Budget-Splitter", "liveUrl": "https://github.com/Krishna8208863439/Personal-Finance-Visual-Budget-Splitter", "featured": True},
    {"id": "proj-phishing-detection", "title": "Phishing Detection", "subtitle": "Modern AI project built with TypeScript", "description": "Phishing Detection is a comprehensive AI solution engineered with modern TypeScript architecture, robust responsive design, and intuitive user workflows.", "longDescription": "Enterprise-grade ai application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "AI", "technologies": ["TypeScript", "Next.js", "React", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Phishing-Detection", "liveUrl": "https://github.com/Krishna8208863439/Phishing-Detection", "featured": False},
    {"id": "proj-phishing-website-detection", "title": "Phishing Website Detection", "subtitle": "Browser extension scam site blocker", "description": "Browser extension and backend API analyzing DOM elements, SSL certificate data, and URL patterns to block scam sites.", "longDescription": "Security extension shielding users from credential harvesting websites through real-time heuristic checks.", "category": "AI", "technologies": ["Python", "FastAPI", "Chrome Extension API", "Scikit-learn"], "image": "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Phishing-Website-Detection", "liveUrl": "https://github.com/Krishna8208863439/Phishing-Website-Detection", "featured": True},
    {"id": "proj-phonepe", "title": "PhonePe Payment Gateway Clone", "subtitle": "UPI payment gateway & digital wallet clone", "description": "Full-featured fintech app clone supporting instant UPI payments, QR scanning, wallet transfers, transaction history, and bill pay.", "longDescription": "High-performance fintech portal providing seamless digital payment processing, wallet recharges, and bill settlements.", "category": "Full Stack", "technologies": ["React", "Node.js", "Express", "MongoDB", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Phonepe", "liveUrl": "https://github.com/Krishna8208863439/Phonepe", "featured": True},
    {"id": "proj-portfolio-builder", "title": "Portfolio Builder Studio", "subtitle": "No-code portfolio editor with Vercel deployment", "description": "No-code web portfolio editor allowing developers to customize themes, import GitHub repositories, and publish live sites.", "longDescription": "Developer portfolio publishing tool converting project links into polished glassmorphic websites.", "category": "Web", "technologies": ["Next.js", "TypeScript", "Tailwind CSS", "Monaco Editor", "Vercel API"], "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Portfolio-Builder", "liveUrl": "https://github.com/Krishna8208863439/Portfolio-Builder", "featured": True},
    {"id": "proj-portfolio-website", "title": "Portfolio Website", "subtitle": "Responsive personal portfolio website with modern UI, SVG animations, projects, skills, and certifications.", "description": "Responsive personal portfolio website with modern UI, SVG animations, projects, skills, and certifications.", "longDescription": "Enterprise-grade web application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "Web", "technologies": ["TypeScript", "Next.js", "React", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Portfolio-Website", "liveUrl": "https://github.com/Krishna8208863439/Portfolio-Website", "featured": False},
    {"id": "proj-property-management", "title": "Property Management System", "subtitle": "Lease tracking & tenant maintenance portal", "description": "Real estate portfolio management system tracking tenant leases, maintenance maintenance tickets, and rental income.", "longDescription": "Property manager dashboard handling tenant contracts, rent collection logs, and repair tickets.", "category": "Full Stack", "technologies": ["React", "TypeScript", "Node.js", "PostgreSQL", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Property-Management", "liveUrl": "https://github.com/Krishna8208863439/Property-Management", "featured": True},
    {"id": "proj-python-basics-task", "title": "Python Basics Task", "subtitle": "Modern Web project built with Python", "description": "Python Basics Task is a comprehensive Web solution engineered with modern Python architecture, robust responsive design, and intuitive user workflows.", "longDescription": "Enterprise-grade web application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "Web", "technologies": ["Python", "Flask", "FastAPI"], "image": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Python-Basics-Task", "liveUrl": "https://github.com/Krishna8208863439/Python-Basics-Task", "featured": False},
    {"id": "proj-regional-language-ai", "title": "Regional Language AI Engine", "subtitle": "Neural translation & TTS model for Indic languages", "description": "Multilingual neural translation and text-to-speech model supporting Indic regional languages for digital accessibility.", "longDescription": "Multilingual AI translation service bringing voice synth capabilities to regional languages.", "category": "AI", "technologies": ["Python", "PyTorch", "Transformers", "FastAPI", "React"], "image": "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Regional-Language-AI", "liveUrl": "https://github.com/Krishna8208863439/Regional-Language-AI", "featured": True},
    {"id": "proj-relationship-intelligence-crm", "title": "Relationship Intelligence CRM", "subtitle": "AI customer relationship & outreach predictor", "description": "AI-assisted customer contact relationship manager predicting outreach timing, sentiment analysis, and relationship health scores.", "longDescription": "Smart CRM analyzing interaction frequency and conversation tone to score customer satisfaction and retention likelihood.", "category": "AI", "technologies": ["React", "Node.js", "OpenAI API", "MongoDB", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Relationship-Intelligence-CRM", "liveUrl": "https://github.com/Krishna8208863439/Relationship-Intelligence-CRM", "featured": True},
    {"id": "proj-rental-pg-verification", "title": "Rental & PG Verification Platform", "subtitle": "Tenant background verification & PG discovery", "description": "Tenant background verification, owner agreement generation, PG room discovery, and rent payment escrow platform.", "longDescription": "Housing rental ecosystem enabling verified PG listings, digital lease agreements, and secure rent transfers.", "category": "Full Stack", "technologies": ["Next.js", "TypeScript", "PostgreSQL", "Tailwind CSS", "AWS S3"], "image": "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Rental-PG-Verification", "liveUrl": "https://github.com/Krishna8208863439/Rental-PG-Verification", "featured": True},
    {"id": "proj-restaurant-billing-system", "title": "Restaurant Billing System", "subtitle": "Touch POS & kitchen display system", "description": "POS point-of-sale touch system featuring kitchen display routing, table QR ordering, digital receipts, and inventory deductions.", "longDescription": "High-speed restaurant billing software streamlining kitchen communication, customer table orders, and daily revenue reports.", "category": "Full Stack", "technologies": ["React", "Electron", "Node.js", "MongoDB", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Restaurant-Billing-System", "liveUrl": "https://github.com/Krishna8208863439/Restaurant-Billing-System", "featured": True},
    {"id": "proj-resume-generater", "title": "Resume Generater", "subtitle": "Modern Web project built with TypeScript", "description": "Resume Generater is a comprehensive Web solution engineered with modern TypeScript architecture, robust responsive design, and intuitive user workflows.", "longDescription": "Enterprise-grade web application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "Web", "technologies": ["TypeScript", "Next.js", "React", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Resume-Generater", "liveUrl": "https://github.com/Krishna8208863439/Resume-Generater", "featured": False},
    {"id": "proj-safety-parent-collaboration-platform", "title": "Safety & Parent Collaboration Platform", "subtitle": "School bus tracking & parent notification app", "description": "School bus tracking, student attendance notifications, parent-teacher messaging, and emergency broadcast channel.", "longDescription": "Parent-school communication platform offering real-time bus location tracking and attendance notifications.", "category": "Full Stack", "technologies": ["Next.js", "TypeScript", "Firebase", "Tailwind CSS", "Twilio"], "image": "https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Safety-Parent-Collaboration-Platform", "liveUrl": "https://github.com/Krishna8208863439/Safety-Parent-Collaboration-Platform", "featured": True},
    {"id": "proj-scam-detection-", "title": "Scam Detection Engine", "subtitle": "AI fraudulent SMS & spam link identifier", "description": "AI model identifying fraudulent SMS messages, phishing links, and deceptive caller patterns in real time.", "longDescription": "Machine learning security model scoring incoming messages for fraud signals and known phishing patterns.", "category": "AI", "technologies": ["Python", "Scikit-learn", "FastAPI", "React", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Scam-Detection-", "liveUrl": "https://github.com/Krishna8208863439/Scam-Detection-", "featured": True},
    {"id": "proj-school-fee-management-", "title": "School Fee Management System", "subtitle": "Automated tuition fee collection & receipt portal", "description": "Automated student fee collection portal with online payment gateways, installment receipts, late fee rules, and accounting ledger.", "longDescription": "School payment portal simplifying tuition collection, generating receipts, and tracking unpaid fees.", "category": "Web", "technologies": ["React", "Node.js", "Express", "MySQL", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/School-Fee-Management-", "liveUrl": "https://github.com/Krishna8208863439/School-Fee-Management-", "featured": True},
    {"id": "proj-shade-match-studio", "title": "Shade Match Studio", "subtitle": "AI computer vision cosmetic foundation analyzer", "description": "AI computer vision application analyzing user facial photos under ambient light to recommend exact cosmetic foundation shades.", "longDescription": "Computer vision shade analyzer fine-tuned on diverse skin tone datasets to deliver accurate cosmetic color matching.", "category": "AI", "technologies": ["Python", "OpenCV", "TensorFlow", "React", "FastAPI"], "image": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Shade-Match-Studio", "liveUrl": "https://github.com/Krishna8208863439/Shade-Match-Studio", "featured": True},
    {"id": "proj-smart-campus", "title": "Smart Campus Operating Platform", "subtitle": "Digital university ecosystem & student portal", "description": "Digital university ecosystem managing student attendance, library access, classroom scheduling, and campus event feeds.", "longDescription": "Unified higher education platform connecting students, faculty, and administrative staff across campus facilities.", "category": "Full Stack", "technologies": ["Next.js", "TypeScript", "MongoDB", "Tailwind CSS", "Express"], "image": "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Smart-Campus", "liveUrl": "https://github.com/Krishna8208863439/Smart-Campus", "featured": True},
    {"id": "proj-smart-city-civic-complaint-management", "title": "Smart City Civic Complaint Management", "subtitle": "Geo-tagged citizen grievance portal", "description": "Citizen grievance portal with geo-tagged photo uploads, automated department routing, and SLA escalation tracking.", "longDescription": "Public grievance portal connecting citizens with municipal departments to resolve infrastructure issues.", "category": "Full Stack", "technologies": ["React", "Node.js", "Express", "MongoDB", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Smart-City-Civic-Complaint-Management", "liveUrl": "https://github.com/Krishna8208863439/Smart-City-Civic-Complaint-Management", "featured": True},
    {"id": "proj-smart-city-operating", "title": "Smart City Operating System", "subtitle": "Centralized urban management platform", "description": "Centralized urban management platform visualizing traffic telemetry, energy grid status, emergency dispatch, and environmental sensor data.", "longDescription": "Interactive command dashboard giving city controllers real-time metrics across public transit, power grids, emergency services, and air quality.", "category": "Full Stack", "technologies": ["Next.js", "TypeScript", "WebSockets", "Tailwind CSS", "Recharts"], "image": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Smart-city-operating", "liveUrl": "https://github.com/Krishna8208863439/Smart-city-operating", "featured": True},
    {"id": "proj-smart-digital-business-", "title": "Smart Digital Business Suite", "subtitle": "SME invoicing, GST tax & inventory suite", "description": "SME operational suite combining digital invoicing, GST tax compliance, customer analytics, and inventory management.", "longDescription": "All-in-one business software handling GST invoicing, inventory tracking, and sales reporting for small enterprises.", "category": "Web", "technologies": ["Next.js", "TypeScript", "Tailwind CSS", "Prisma", "PostgreSQL"], "image": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Smart-Digital-Business-", "liveUrl": "https://github.com/Krishna8208863439/Smart-Digital-Business-", "featured": True},
    {"id": "proj-smart-government-welfare-assistant", "title": "Smart Government Welfare Assistant", "subtitle": "AI scheme eligibility checker in regional languages", "description": "AI portal checking citizen eligibility for government welfare schemes, pension programs, and grant applications in regional languages.", "longDescription": "Multilingual government assistant guiding citizens through welfare program requirements and document submissions.", "category": "AI", "technologies": ["Next.js", "Python", "OpenAI API", "Tailwind CSS", "FastAPI"], "image": "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Smart-Government-Welfare-Assistant", "liveUrl": "https://github.com/Krishna8208863439/Smart-Government-Welfare-Assistant", "featured": True},
    {"id": "proj-smart-kisan-final", "title": "Smart Kisan Final", "subtitle": "Modern Web project built with JavaScript", "description": "Smart Kisan Final is a comprehensive Web solution engineered with modern JavaScript architecture, robust responsive design, and intuitive user workflows.", "longDescription": "Enterprise-grade web application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "Web", "technologies": ["JavaScript", "React", "Node.js", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Smart-Kisan-FInal", "liveUrl": "https://github.com/Krishna8208863439/Smart-Kisan-FInal", "featured": False},
    {"id": "proj-smart-navigation-accessibility", "title": "Smart Navigation & Accessibility Hub", "subtitle": "Voice-guided navigation for visually impaired", "description": "Voice-guided indoor & outdoor navigation app specifically designed to assist visually impaired individuals.", "longDescription": "Accessible navigation assistant leveraging audio cues and haptic feedback for spatial guidance.", "category": "AI", "technologies": ["React", "TypeScript", "Web Speech API", "Mapbox", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Smart-Navigation-Accessibility", "liveUrl": "https://github.com/Krishna8208863439/Smart-Navigation-Accessibility", "featured": True},
    {"id": "proj-smart-public-transport", "title": "Smart Public Transport System", "subtitle": "Live bus/metro tracker & QR ticketing", "description": "Real-time city bus & metro location tracking, arrival estimations, ticketing QR codes, and crowding statistics.", "longDescription": "Public transit app providing real-time bus locations, passenger crowding indicators, and digital passes.", "category": "Full Stack", "technologies": ["React", "Leaflet", "Node.js", "WebSockets", "MongoDB"], "image": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Smart-Public-Transport", "liveUrl": "https://github.com/Krishna8208863439/Smart-Public-Transport", "featured": True},
    {"id": "proj-smart-rural-civic-intelligence-system", "title": "Smart Rural Civic Intelligence System", "subtitle": "AI-powered Smart Rural Civic Intelligence System for intelligent grievance management, automated issue classification, priority-based routing, transparent tracking, and data-driven governance for rural communities.", "description": "AI-powered Smart Rural Civic Intelligence System for intelligent grievance management, automated issue classification, priority-based routing, transparent tracking, and data-driven governance for rural communities.", "longDescription": "Enterprise-grade ai application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "AI", "technologies": ["JavaScript", "React", "Node.js", "Tailwind CSS", "Machine Learning"], "image": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/smart-rural-civic-intelligence-system", "liveUrl": "https://github.com/Krishna8208863439/smart-rural-civic-intelligence-system", "featured": False},
    {"id": "proj-smart-rural-education-platform", "title": "Smart Rural Education Platform", "subtitle": "Low-bandwidth offline digital learning platform", "description": "Low-bandwidth digital learning hub enabling offline content caching, localized audio lessons, and rural school tracking.", "longDescription": "PWA educational tool engineered for low connectivity areas with offline caching and audio lessons.", "category": "Web", "technologies": ["React", "PWA", "Workbox", "Tailwind CSS", "IndexedDB"], "image": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Smart-Rural-Education-Platform", "liveUrl": "https://github.com/Krishna8208863439/Smart-Rural-Education-Platform", "featured": True},
    {"id": "proj-smart-school-operating-system", "title": "Smart School Operating System", "subtitle": "Complete K-12 school ERP & gradebook", "description": "Complete K-12 school administration platform covering timetable creation, gradebooks, exam results, and parent communication.", "longDescription": "School ERP system combining timetable scheduling, grade entry, attendance, and administrative oversight.", "category": "Full Stack", "technologies": ["Next.js", "TypeScript", "MongoDB", "Tailwind CSS", "Node.js"], "image": "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Smart-School-Operating-System", "liveUrl": "https://github.com/Krishna8208863439/Smart-School-Operating-System", "featured": True},
    {"id": "proj-snake-game", "title": "Snake Game with AI Twist", "subtitle": "Reinforcement Learning & AI-powered arcade game", "description": "Interactive modern arcade Snake game enhanced with Reinforcement Learning (Q-learning AI mode), adaptive difficulty obstacles, and dynamic visual themes.", "longDescription": "Browser arcade game combining classic gameplay with autonomous AI bot mode powered by Q-learning algorithms and dynamic pathfinding.", "category": "AI", "technologies": ["JavaScript", "TypeScript", "Python", "Pygame", "HTML5 Canvas", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Snake-Game", "liveUrl": "https://github.com/Krishna8208863439/Snake-Game", "featured": True},
    {"id": "proj-spam-mail-detector", "title": "Spam Mail Detector", "subtitle": "SpamShield AI \u2013 An NLP-powered machine learning system for detecting spam messages using text classification, TF-IDF, and Multinomial Naive Bayes.", "description": "SpamShield AI \u2013 An NLP-powered machine learning system for detecting spam messages using text classification, TF-IDF, and Multinomial Naive Bayes.", "longDescription": "Enterprise-grade ai application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "AI", "technologies": ["Python", "Flask", "FastAPI", "Machine Learning", "TensorFlow"], "image": "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Spam-Mail-Detector", "liveUrl": "https://github.com/Krishna8208863439/Spam-Mail-Detector", "featured": False},
    {"id": "proj-spotify", "title": "Spotify Music Player Clone", "subtitle": "Web audio player with equalizer & synchronized lyrics", "description": "Web audio player with custom playlists, interactive audio equalizer, lyrics sync, artist search, and volume controls.", "longDescription": "Web music player featuring interactive audio equalizer visualization, custom playlists, and synchronized lyrics.", "category": "Web", "technologies": ["React", "Next.js", "Web Audio API", "Tailwind CSS", "Framer Motion"], "image": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Spotify", "liveUrl": "https://github.com/Krishna8208863439/Spotify", "featured": True},
    {"id": "proj-startup-empire-simulator", "title": "Startup Empire Simulator", "subtitle": "Gamified startup economics & strategy simulator", "description": "Gamified business simulation web app modeling venture capital funding, product development cycles, and customer acquisition curves.", "longDescription": "Interactive strategy web game modeling startup economics, engineering hires, marketing campaigns, and investor pitches.", "category": "Web", "technologies": ["React", "TypeScript", "Canvas API", "Tailwind CSS", "Zustand"], "image": "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Startup-Empire-Simulator", "liveUrl": "https://github.com/Krishna8208863439/Startup-Empire-Simulator", "featured": True},
    {"id": "proj-street-light-system", "title": "Street Light System", "subtitle": "Modern Full Stack project built with JavaScript", "description": "Street Light System is a comprehensive Full Stack solution engineered with modern JavaScript architecture, robust responsive design, and intuitive user workflows.", "longDescription": "Enterprise-grade full stack application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "Full Stack", "technologies": ["JavaScript", "React", "Node.js", "Tailwind CSS", "PostgreSQL"], "image": "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Street-Light-System", "liveUrl": "https://github.com/Krishna8208863439/Street-Light-System", "featured": False},
    {"id": "proj-student-portal-", "title": "Student Portal", "subtitle": "Academic dashboard & fee payment records", "description": "Academic student hub for tracking course schedules, exam grades, attendance percentages, and fee payment receipts.", "longDescription": "Student academic dashboard displaying class timetables, semester report cards, and attendance tracking.", "category": "Web", "technologies": ["React", "TypeScript", "Node.js", "MySQL", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Student-Portal-", "liveUrl": "https://github.com/Krishna8208863439/Student-Portal-", "featured": True},
    {"id": "proj-syntecxhub-sales-performance-dashboard", "title": "Syntecxhub Sales Performance Dashboard", "subtitle": "Modern Full Stack project built with Python", "description": "Syntecxhub Sales Performance Dashboard is a comprehensive Full Stack solution engineered with modern Python architecture, robust responsive design, and intuitive user workflows.", "longDescription": "Enterprise-grade full stack application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "Full Stack", "technologies": ["Python", "Flask", "FastAPI"], "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Syntecxhub-Sales-Performance-Dashboard", "liveUrl": "https://github.com/Krishna8208863439/Syntecxhub-Sales-Performance-Dashboard", "featured": False},
    {"id": "proj-syntecxhub-student-performance-analysis", "title": "Syntecxhub Student Performance Analysis", "subtitle": "Modern Web project built with Python", "description": "Syntecxhub Student Performance Analysis is a comprehensive Web solution engineered with modern Python architecture, robust responsive design, and intuitive user workflows.", "longDescription": "Enterprise-grade web application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "Web", "technologies": ["Python", "Flask", "FastAPI"], "image": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Syntecxhub-Student-Performance-Analysis", "liveUrl": "https://github.com/Krishna8208863439/Syntecxhub-Student-Performance-Analysis", "featured": False},
    {"id": "proj-temperature", "title": "Temperature", "subtitle": "Modern Web project built with JavaScript", "description": "Temperature is a comprehensive Web solution engineered with modern JavaScript architecture, robust responsive design, and intuitive user workflows.", "longDescription": "Enterprise-grade web application developed by Krishna Devadkar. Features full responsive UI, automated workflows, and production-ready code structure.", "category": "Web", "technologies": ["JavaScript", "React", "Node.js", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Temperature", "liveUrl": "https://github.com/Krishna8208863439/Temperature", "featured": False},
    {"id": "proj-threat-console", "title": "Threat Console Security Dashboard", "subtitle": "Cybersecurity incident & network threat console", "description": "Cybersecurity incident response console monitoring network logs, intrusion attempts, malware signatures, and IP threat scores.", "longDescription": "Real-time SOC security dashboard capturing network anomalies, unauthorized logins, and firewall events.", "category": "Full Stack", "technologies": ["React", "Node.js", "Elasticsearch", "Docker", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Threat-Console", "liveUrl": "https://github.com/Krishna8208863439/Threat-Console", "featured": True},
    {"id": "proj-train-booking", "title": "Train Booking System", "subtitle": "Railway PNR & seat reservation portal", "description": "Railway seat availability check, PNR status verification, route map inspection, and automated e-ticket issuance booking portal.", "longDescription": "Railway ticketing platform supporting live seat selection, route timetables, PNR checking, and instant e-tickets.", "category": "Web", "technologies": ["React", "TypeScript", "Node.js", "Express", "MySQL"], "image": "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Train-booking", "liveUrl": "https://github.com/Krishna8208863439/Train-booking", "featured": True},
    {"id": "proj-travel-planner-smart-tourism-platform", "title": "Travel Planner & Smart Tourism Platform", "subtitle": "AI trip itinerary generator & budget estimator", "description": "AI-assisted itinerary planner generating custom travel routes, hotel suggestions, attraction bookings, and budget estimates.", "longDescription": "AI travel companion creating day-by-day vacation itineraries based on user preferences and budget.", "category": "AI", "technologies": ["Next.js", "TypeScript", "OpenAI API", "Tailwind CSS", "Mapbox"], "image": "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Travel-Planner-Smart-Tourism-Platform", "liveUrl": "https://github.com/Krishna8208863439/Travel-Planner-Smart-Tourism-Platform", "featured": True},
    {"id": "proj-warehouse-management-system", "title": "Warehouse Management System", "subtitle": "Barcode tracking & logistics inventory hub", "description": "Inventory tracking, barcode scanning integration, bin allocation, stock replenishment alerts, and logistics dispatch management.", "longDescription": "Industrial inventory manager tracking SKU locations, incoming shipments, and automated reorder points.", "category": "Full Stack", "technologies": ["React", "Node.js", "Express", "PostgreSQL", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Warehouse-Management-System", "liveUrl": "https://github.com/Krishna8208863439/Warehouse-Management-System", "featured": True},
    {"id": "proj-waste-management-system", "title": "Waste Management System", "subtitle": "Smart IoT & AI-driven municipal waste tracking", "description": "Smart IoT & AI-driven municipal waste tracking, bin capacity sensor monitoring, and automated garbage collection route optimization.", "longDescription": "End-to-end municipal waste tracking system using sensor telemetry and AI route planning to minimize fuel usage and eliminate overflow bins.", "category": "Full Stack", "technologies": ["React", "Node.js", "IoT Sensors", "MongoDB", "Express"], "image": "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Waste-Management-System", "liveUrl": "https://github.com/Krishna8208863439/Waste-Management-System", "featured": True},
    {"id": "proj-water-management", "title": "Water Management System", "subtitle": "IoT telemetry & pipeline leak detection hub", "description": "IoT telemetry portal tracking reservoir water levels, pipeline leakage detection, flow rate analysis, and consumption quotas.", "longDescription": "IoT monitoring system providing water utility operators with real-time pressure, flow, and leak alerts.", "category": "Full Stack", "technologies": ["Node.js", "Express", "MongoDB", "IoT Sensors", "React"], "image": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Water-Management", "liveUrl": "https://github.com/Krishna8208863439/Water-Management", "featured": True},
    {"id": "proj-wealth-dna", "title": "Wealth DNA Financial Hub", "subtitle": "Personalized multi-asset wealth building platform", "description": "Personalized wealth building platform aggregating investments, crypto portfolios, tax optimization strategies, and passive income analytics.", "longDescription": "Comprehensive wealth dashboard connecting multi-asset accounts, dividend tracking, and net worth forecasting tools.", "category": "Full Stack", "technologies": ["Next.js", "TypeScript", "Plaid API", "Recharts", "PostgreSQL"], "image": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Wealth-DNA", "liveUrl": "https://github.com/Krishna8208863439/Wealth-DNA", "featured": True},
    {"id": "proj-weather-app", "title": "Weather App & Forecast Hub", "subtitle": "7-day forecast & UV radar weather platform", "description": "Interactive weather web app rendering 7-day hourly forecasts, UV index, radar maps, and weather alerts via OpenWeather API.", "longDescription": "Live weather application delivering detailed meteorological forecasts, radar overlays, and severe storm alerts.", "category": "Web", "technologies": ["React", "TypeScript", "OpenWeather API", "Tailwind CSS", "Framer Motion"], "image": "https://images.unsplash.com/photo-1592210454359-9043f067919b?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Weather-App", "liveUrl": "https://github.com/Krishna8208863439/Weather-App", "featured": True},
    {"id": "proj-whatsapp", "title": "WhatsApp Chat Clone", "subtitle": "Encrypted real-time messaging & media sharing", "description": "Real-time end-to-end encrypted chat web app with status updates, voice notes, media sharing, and group chats.", "longDescription": "Real-time messaging platform supporting instant typing indicators, media uploads, and group channels.", "category": "Full Stack", "technologies": ["React", "Socket.io", "Node.js", "MongoDB", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/WhatsApp", "liveUrl": "https://github.com/Krishna8208863439/WhatsApp", "featured": True},
    {"id": "proj-zomato-", "title": "Zomato Food Delivery Clone", "subtitle": "Hyperlocal food ordering & live delivery tracker", "description": "Hyperlocal food ordering platform featuring restaurant discovery, menu customization, live GPS order tracking, and review system.", "longDescription": "On-demand food delivery portal connecting users with local restaurants, real-time map tracking, and reviews.", "category": "Full Stack", "technologies": ["React", "Next.js", "Node.js", "MongoDB", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Zomato-", "liveUrl": "https://github.com/Krishna8208863439/Zomato-", "featured": True},
]

# ─────────────────────────────────────────────
# API Routes
# ─────────────────────────────────────────────

@app.after_request
def add_cors_headers(response):
    """Add CORS headers to every response."""
    origin = request.headers.get('Origin', '')
    allowed = [
        'https://krishnaportfolio.pythonanywhere.com',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ]
    if origin in allowed:
        response.headers['Access-Control-Allow-Origin'] = origin
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, DELETE, OPTIONS'
    return response


@app.route('/api/status', methods=['GET', 'OPTIONS'])
def status():
    """Health check & availability status."""
    if request.method == 'OPTIONS':
        return '', 204
    conn = get_db()
    db_ok = conn is not None
    if conn:
        conn.close()
    return jsonify({
        'availableForHire': True,
        'status': 'online',
        'database': 'connected' if db_ok else 'disconnected',
    })


@app.route('/api/projects', methods=['GET', 'OPTIONS'])
def get_projects():
    """Return all portfolio projects."""
    if request.method == 'OPTIONS':
        return '', 204
    return jsonify({'projects': PROJECTS, 'total': len(PROJECTS)})


@app.route('/api/contact', methods=['POST', 'OPTIONS'])
def contact():
    """Handle contact form submission."""
    if request.method == 'OPTIONS':
        return '', 204

    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip()
    phone = (data.get('phone') or '').strip()
    subject = (data.get('subject') or '').strip()
    message = (data.get('message') or '').strip()

    # Validation
    if not name or not email or not message:
        return jsonify({'message': 'Missing required fields (name, email, message).'}), 400

    import re
    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        return jsonify({'message': 'Invalid email address format.'}), 400

    # Save to MySQL
    try:
        conn = get_db()
        if conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (%s, %s, %s, %s, %s)",
                    (name, email, phone or None, subject or None, message)
                )
            conn.commit()
            conn.close()
    except Exception as e:
        print(f"[DB] Contact save error: {e}")

    # Send email
    email_sent = send_contact_email(name, email, phone, subject, message)
    if not email_sent:
        print(f"[CONTACT] From: {name} ({email}) | Subject: {subject} | Message: {message}")

    return jsonify({'success': True, 'message': 'Message received successfully!'}), 200


@app.route('/api/admin/login', methods=['POST', 'OPTIONS'])
def admin_login():
    """Authenticate admin and return JWT token."""
    if request.method == 'OPTIONS':
        return '', 204

    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({'message': 'Email and password are required.'}), 400

    if email != ADMIN_EMAIL.lower():
        return jsonify({'message': 'Invalid admin credentials.'}), 401

    # Check password
    if password != ADMIN_PASSWORD:
        return jsonify({'message': 'Invalid admin credentials.'}), 401

    token = pyjwt.encode(
        {
            'email': ADMIN_EMAIL,
            'role': 'admin',
            'exp': int(time.time()) + 86400,  # 24h
        },
        JWT_SECRET,
        algorithm='HS256'
    )

    resp = make_response(jsonify({
        'success': True,
        'message': 'Admin authentication successful.',
        'token': token,
    }))
    resp.set_cookie(
        'admin_token', token,
        httponly=True, samesite='Lax',
        max_age=86400, path='/'
    )
    return resp, 200


@app.route('/api/admin/messages', methods=['GET', 'DELETE', 'OPTIONS'])
@require_auth
def admin_messages():
    """GET: list messages. DELETE: delete by ?id=<id>."""
    if request.method == 'OPTIONS':
        return '', 204

    if request.method == 'GET':
        try:
            conn = get_db()
            if not conn:
                return jsonify({'messages': []}), 200
            with conn.cursor() as cur:
                cur.execute("SELECT id, name, email, phone, subject, message, created_at FROM contact_messages ORDER BY created_at DESC")
                rows = cur.fetchall()
            conn.close()
            messages = []
            for r in rows:
                c_at = r.get('created_at')
                c_str = c_at.isoformat() if hasattr(c_at, 'isoformat') else (str(c_at) if c_at else '')
                messages.append({
                    'id': str(r['id']),
                    'name': r['name'],
                    'email': r['email'],
                    'phone': r.get('phone'),
                    'subject': r.get('subject'),
                    'message': r['message'],
                    'createdAt': c_str,
                })
            return jsonify({'messages': messages}), 200
        except Exception as e:
            print(f"[DB] Messages fetch error: {e}")
            return jsonify({'messages': []}), 200

    if request.method == 'DELETE':
        msg_id = request.args.get('id')
        if not msg_id:
            return jsonify({'message': 'Missing message ID'}), 400
        try:
            conn = get_db()
            if conn:
                with conn.cursor() as cur:
                    cur.execute("DELETE FROM contact_messages WHERE id = %s", (msg_id,))
                conn.commit()
                conn.close()
        except Exception as e:
            print(f"[DB] Delete error: {e}")
        return jsonify({'success': True, 'message': 'Message deleted'}), 200


@app.route('/api/admin/stats', methods=['GET', 'OPTIONS'])
@require_auth
def admin_stats():
    """Return dashboard statistics."""
    if request.method == 'OPTIONS':
        return '', 204

    try:
        conn = get_db()
        if not conn:
            return jsonify({
                'totalVisitors': 0,
                'identifiedVisitors': 0,
                'skippedVisitors': 0,
                'totalMessages': 0,
                'totalProjects': len(PROJECTS),
                'databaseStatus': 'Disconnected',
            }), 200

        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) as cnt FROM visitors")
            total_visitors = cur.fetchone()['cnt']

            cur.execute("SELECT COUNT(*) as cnt FROM visitors WHERE status='identified'")
            identified = cur.fetchone()['cnt']

            cur.execute("SELECT COUNT(*) as cnt FROM visitors WHERE status='skipped'")
            skipped = cur.fetchone()['cnt']

            cur.execute("SELECT COUNT(*) as cnt FROM contact_messages")
            total_messages = cur.fetchone()['cnt']

        conn.close()
        return jsonify({
            'totalVisitors': total_visitors,
            'identifiedVisitors': identified,
            'skippedVisitors': skipped,
            'totalMessages': total_messages,
            'totalProjects': len(PROJECTS),
            'databaseStatus': 'Connected',
        }), 200
    except Exception as e:
        print(f"[DB] Stats error: {e}")
        return jsonify({
            'totalVisitors': 0, 'identifiedVisitors': 0,
            'skippedVisitors': 0, 'totalMessages': 0,
            'totalProjects': len(PROJECTS), 'databaseStatus': 'Error',
        }), 200


@app.route('/api/admin/role-distribution', methods=['GET', 'OPTIONS'])
@require_auth
def role_distribution():
    """Return visitor role distribution."""
    if request.method == 'OPTIONS':
        return '', 204
    try:
        conn = get_db()
        if not conn:
            return jsonify([]), 200
        with conn.cursor() as cur:
            cur.execute("SELECT role, COUNT(*) as count FROM visitors WHERE role IS NOT NULL AND role != '' GROUP BY role ORDER BY count DESC")
            rows = cur.fetchall()
        conn.close()
        distribution = [{'role': r['role'], 'count': r['count']} for r in rows]
        return jsonify(distribution), 200
    except Exception as e:
        print(f"[DB] Role distribution error: {e}")
        return jsonify([]), 200


@app.route('/api/visitors', methods=['POST', 'OPTIONS'])
def log_visitor():
    """Log a visitor entry."""
    if request.method == 'OPTIONS':
        return '', 204

    data = request.get_json(silent=True) or {}
    name = data.get('name')
    role = data.get('role')
    status = data.get('status', 'identified')
    ip_address = request.remote_addr or ''
    user_agent = request.headers.get('User-Agent', '')

    try:
        conn = get_db()
        if conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO visitors (name, role, status, ip_address, user_agent) VALUES (%s, %s, %s, %s, %s)",
                    (name, role, status, ip_address, user_agent)
                )
            conn.commit()
            conn.close()
    except Exception as e:
        print(f"[DB] Visitor log error: {e}")

    return jsonify({'success': True}), 200


# ─────────────────────────────────────────────
# Resume Endpoint
# ─────────────────────────────────────────────
@app.route('/api/resume', methods=['GET', 'OPTIONS'])
def resume_endpoint():
    """Serve resume PDF."""
    if request.method == 'OPTIONS':
        return '', 204

    candidates = [
        os.path.join(STATIC_DIR, 'Krishna_Resume.pdf'),
        os.path.join(STATIC_DIR, 'resume.pdf'),
        os.path.join(os.path.dirname(STATIC_DIR), 'Krishna_Resume.pdf'),
        os.path.join(os.path.dirname(STATIC_DIR), 'public', 'Krishna_Resume.pdf'),
        os.path.join(os.path.dirname(STATIC_DIR), 'public', 'resume.pdf'),
        os.path.join(STATIC_DIR, 'Final_Resume.pdf'),
    ]
    for p in candidates:
        if os.path.exists(p):
            return send_file(p, mimetype='application/pdf', as_attachment=False, download_name='Krishna_Resume.pdf')
    return jsonify({'message': 'Resume file not found.'}), 404


# ─────────────────────────────────────────────
# Static Frontend Serving (Next.js export)
# ─────────────────────────────────────────────
STATIC_DIR = os.environ.get('STATIC_DIR')
if not STATIC_DIR:
    candidates = [
        '/home/KrishnaPortfolio/Portfolio-Website/out',
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'out'),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out'),
    ]
    for c in candidates:
        if os.path.exists(c):
            STATIC_DIR = c
            break
    if not STATIC_DIR:
        STATIC_DIR = candidates[0]


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Serve exported Next.js static files and fallback gracefully."""
    # Never intercept API routes
    if path.startswith('api/'):
        return jsonify({'error': f'API endpoint /{path} not found'}), 404

    target = os.path.join(STATIC_DIR, path)

    # 1. Exact static file match (JS, CSS, images, pdf, favicon, etc.)
    if path and os.path.isfile(target):
        return send_from_directory(STATIC_DIR, path)

    # 2. Directory with index.html (e.g. /admin -> /admin/index.html)
    if os.path.isdir(target) and os.path.isfile(os.path.join(target, 'index.html')):
        return send_from_directory(target, 'index.html')

    # 3. Path + .html (e.g. /admin -> admin.html)
    if os.path.isfile(target + '.html'):
        return send_from_directory(STATIC_DIR, path + '.html')

    # 4. Fallback to root index.html (SPA client routing)
    root_index = os.path.join(STATIC_DIR, 'index.html')
    if os.path.isfile(root_index):
        return send_from_directory(STATIC_DIR, 'index.html')

    return "Frontend build not found.", 404


# ─────────────────────────────────────────────
# PythonAnywhere WSGI Entry Point
# ─────────────────────────────────────────────
application = app

if __name__ == '__main__':
    app.run(debug=True, port=5000)
