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

import pymysql
import bcrypt
import jwt as pyjwt
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS

# ─────────────────────────────────────────────
# App Setup
# ─────────────────────────────────────────────
app = Flask(__name__)

# Allow requests from your static frontend
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

# PythonAnywhere MySQL config
DB_HOST = os.environ.get('DB_HOST', 'KrishnaPortfolio.mysql.pythonanywhere-services.com')
DB_USER = os.environ.get('DB_USER', 'KrishnaPortfolio')
DB_PASS = os.environ.get('DB_PASS', '')
DB_NAME = os.environ.get('DB_NAME', 'KrishnaPortfolio$portfolio')


# ─────────────────────────────────────────────
# Database Helper
# ─────────────────────────────────────────────
def get_db():
    """Get a MySQL connection. Returns None if DB is unavailable."""
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASS,
            database=DB_NAME,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor,
            connect_timeout=5,
        )
        return conn
    except Exception as e:
        print(f"[DB] Connection failed: {e}")
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
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    phone VARCHAR(50),
                    subject VARCHAR(500),
                    message TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS visitors (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255),
                    role VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'identified',
                    ip_address VARCHAR(100),
                    user_agent TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
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
    {"id": "proj-smart-kisan", "title": "Smart Kisan AI – Agritech Platform", "subtitle": "AI crop yield recommendation, plant disease diagnosis & live market prices", "description": "AI-driven smart agriculture platform providing crop recommendation, plant leaf disease detection using computer vision, real-time market price predictions, soil telemetry, and an AI farming assistant.", "longDescription": "Comprehensive agritech ecosystem helping farmers optimize crop yields, detect crop diseases using deep neural networks, monitor soil metrics, track live mandi prices, and consult an AI agronomist.", "category": "AI", "technologies": ["Python", "Flask", "FastAPI", "TensorFlow", "OpenCV", "React", "Node.js", "Tailwind CSS", "MongoDB"], "image": "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439/Smart-Kisan-Final", "liveUrl": "https://github.com/Krishna8208863439/Smart-Kisan-Final", "featured": True},
    {"id": "proj-coderush", "title": "CodeRush 2.0 – Competitive Coding Platform", "subtitle": "Real-time coding contest & isolated execution sandbox", "description": "Real-time competitive programming platform built for CodeWarriors hackathon, featuring instant code execution sandbox, algorithmic problem sets, automated scoring, and live leaderboards.", "category": "Full Stack", "technologies": ["Next.js", "TypeScript", "Node.js", "Docker Sandbox", "WebSockets", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-medical-chatbot", "title": "End-to-End AI Medical Chatbot", "subtitle": "RAG-powered health assistant for medical triage & symptom diagnosis", "description": "RAG-powered conversational medical chatbot trained on healthcare datasets for symptom evaluation, medical triage guidance, and prescription information.", "category": "AI", "technologies": ["Python", "LangChain", "Pinecone", "OpenAI API", "Flask", "React", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-smart-healthcare", "title": "Smart Healthcare Diagnostics System", "subtitle": "Unified digital medical portal & patient telemetry", "description": "Comprehensive medical diagnostics and hospital portal connecting patient EMR records, virtual doctor consultations, lab report analysis, and disease risk scoring.", "category": "Full Stack", "technologies": ["React", "Node.js", "Express", "MongoDB", "Python", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-snake-ai", "title": "Snake Game with AI Twist", "subtitle": "Reinforcement Learning & AI-powered arcade game", "description": "Interactive modern arcade Snake game enhanced with Reinforcement Learning (Q-learning AI mode), adaptive difficulty obstacles, and dynamic visual themes.", "category": "AI", "technologies": ["JavaScript", "TypeScript", "Python", "Pygame", "HTML5 Canvas", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-sagecommand", "title": "SageCommand AI Production Hub", "subtitle": "Autonomous AI command console & workflow orchestrator", "description": "Enterprise-grade autonomous AI command console orchestrating LLM agent workflows, automated prompt chains, script execution, and cloud telemetry monitoring.", "category": "AI", "technologies": ["Python", "FastAPI", "React", "Docker", "Tailwind CSS", "LangChain"], "image": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-ai-agent", "title": "Autonomous Multi-Agent Workspace", "subtitle": "Multi-agent collaboration engine & browser automation", "description": "Autonomous task execution framework where specialized planner, browser researcher, code builder, and reviewer AI agents collaborate to fulfill complex developer goals.", "category": "AI", "technologies": ["Python", "LangChain", "CrewAI", "FastAPI", "React", "Next.js"], "image": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-online-exam", "title": "Online Examination & Assessment Portal", "subtitle": "Proctored online exam platform with anti-cheat detection", "description": "Proctored digital examination portal featuring tab-switch anti-cheating alerts, timed question sets, automated instant grading, and detailed performance analytics.", "category": "Full Stack", "technologies": ["React", "Node.js", "Express", "MongoDB", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-bangalore-transport", "title": "Bangalore Smart Transport Network", "subtitle": "Metropolitan bus/metro live tracking & QR ticketing", "description": "Intelligent urban transport platform for metropolitan route planning, live bus and metro GPS telemetry, digital QR ticketing, and transit crowding analytics.", "category": "Full Stack", "technologies": ["React", "Node.js", "Leaflet", "WebSockets", "MongoDB", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-pune-civic", "title": "Pune Civic & Grievance Portal", "subtitle": "Geo-tagged municipal complaint & public service hub", "description": "Smart city civic application for citizen grievance reporting, geo-tagged photo uploads, department SLA tracking, emergency alerts, and municipal updates.", "category": "Full Stack", "technologies": ["Next.js", "TypeScript", "Node.js", "PostgreSQL", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-smart-mall", "title": "Smart Mall Management Portal", "subtitle": "Store directory kiosk & parking reservation hub", "description": "Shopping mall directory platform featuring interactive store maps, promotional deals showcase, customer feedback, and automated parking spot reservations.", "category": "Web", "technologies": ["React", "Node.js", "Express", "MongoDB", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-1", "title": "Waste Management System", "subtitle": "Smart IoT & AI-driven municipal waste tracking", "description": "Smart IoT & AI-driven municipal waste tracking, bin capacity sensor monitoring, and automated garbage collection route optimization.", "category": "Full Stack", "technologies": ["React", "Node.js", "IoT Sensors", "MongoDB", "Express"], "image": "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-2", "title": "Smart City Operating System", "subtitle": "Centralized urban management platform", "description": "Centralized urban management platform visualizing traffic telemetry, energy grid status, emergency dispatch, and environmental sensor data.", "category": "Full Stack", "technologies": ["Next.js", "TypeScript", "WebSockets", "Tailwind CSS", "Recharts"], "image": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-3", "title": "E-Commerce Analytics Hub", "subtitle": "Real-time sales performance & customer LTV forecasting", "description": "Real-time sales performance, customer LTV forecasting, conversion funnel tracking, and inventory telemetry dashboard.", "category": "Web", "technologies": ["React", "Next.js", "Tailwind CSS", "PostgreSQL", "Chart.js"], "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-4", "title": "Shade Match Studio", "subtitle": "AI computer vision cosmetic foundation analyzer", "description": "AI computer vision application analyzing user facial photos under ambient light to recommend exact cosmetic foundation shades.", "category": "AI", "technologies": ["Python", "OpenCV", "TensorFlow", "React", "FastAPI"], "image": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-5", "title": "Crisis Response Center", "subtitle": "Emergency disaster response coordination platform", "description": "Emergency disaster response coordination platform mapping incidents, resource distribution, and real-time survivor SOS alerts.", "category": "Full Stack", "technologies": ["Next.js", "Leaflet", "Node.js", "WebSockets", "MongoDB"], "image": "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-6", "title": "Gallery App", "subtitle": "Cloud image vault with automated AI tagging", "description": "High-speed cloud image vault with automated AI auto-tagging, face grouping, spatial search, and seamless drag-and-drop uploads.", "category": "Web", "technologies": ["React", "Next.js", "Cloudinary", "Tailwind CSS", "Framer Motion"], "image": "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-7", "title": "Library Management System", "subtitle": "Digital cataloging & RFID borrowing administration", "description": "Digital cataloging, RFID book issuance, fine tracking, automated reminder dispatch, and reader borrowing telemetry.", "category": "Full Stack", "technologies": ["Node.js", "Express", "MySQL", "React", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-8", "title": "Restaurant Billing System", "subtitle": "Touch POS & kitchen display system", "description": "POS point-of-sale touch system featuring kitchen display routing, table QR ordering, digital receipts, and inventory deductions.", "category": "Full Stack", "technologies": ["React", "Electron", "Node.js", "MongoDB", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-9", "title": "Password Manager Vault", "subtitle": "Zero-knowledge AES-256 encrypted credential vault", "description": "Zero-knowledge AES-256 encrypted credential vault with master key derivative hashing, breach alerts, and 2FA generator.", "category": "Web", "technologies": ["React", "TypeScript", "CryptoJS", "Node.js", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-10", "title": "Hotel Booking Management System", "subtitle": "Property reservation platform with dynamic pricing", "description": "Comprehensive property reservation platform with dynamic room pricing, seasonal availability calendars, and payment gateway.", "category": "Full Stack", "technologies": ["Next.js", "TypeScript", "Stripe", "PostgreSQL", "Prisma"], "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-25", "title": "PhonePe Payment Gateway Clone", "subtitle": "UPI payment gateway & digital wallet clone", "description": "Full-featured fintech app clone supporting instant UPI payments, QR scanning, wallet transfers, transaction history, and bill pay.", "category": "Full Stack", "technologies": ["React", "Node.js", "Express", "MongoDB", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1556742049-0a6745585b9b?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-26", "title": "ChatGPT Assistant Clone", "subtitle": "Conversational LLM workspace with code rendering", "description": "High-performance AI chat interface supporting code syntax highlighting, markdown rendering, thread history, and system prompts.", "category": "AI", "technologies": ["Next.js", "TypeScript", "OpenAI API", "Tailwind CSS", "Framer Motion"], "image": "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-27", "title": "Meesho E-Commerce Platform", "subtitle": "Social reseller marketplace & order manager", "description": "Social e-commerce marketplace clone enabling seller storefront creation, product sharing, order management, and commission tracking.", "category": "Web", "technologies": ["React", "Next.js", "Node.js", "MongoDB", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-28", "title": "Zomato Food Delivery Clone", "subtitle": "Hyperlocal food ordering & live delivery tracker", "description": "Hyperlocal food ordering platform featuring restaurant discovery, menu customization, live GPS order tracking, and review system.", "category": "Full Stack", "technologies": ["React", "Next.js", "Node.js", "MongoDB", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-36", "title": "Education & Learning Portal", "subtitle": "Interactive LMS platform with course tracking", "description": "Interactive e-learning LMS featuring video courses, quiz assignments, progress tracking, and peer discussion forums.", "category": "Web", "technologies": ["React", "Next.js", "Tailwind CSS", "Node.js", "MongoDB"], "image": "https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-40", "title": "Scam Detection Engine", "subtitle": "AI fraudulent SMS & spam link identifier", "description": "AI model identifying fraudulent SMS messages, phishing links, and deceptive caller patterns in real time.", "category": "AI", "technologies": ["Python", "Scikit-learn", "FastAPI", "React", "Tailwind CSS"], "image": "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-41", "title": "Document Assistant AI", "subtitle": "RAG-powered PDF semantic search & chat", "description": "RAG-powered PDF document search and chat system enabling instant semantic query answering over 500+ page manuals.", "category": "AI", "technologies": ["Python", "LangChain", "OpenAI API", "FAISS", "Next.js"], "image": "https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-42", "title": "Stock Market Price Prediction", "subtitle": "LSTM neural network stock trend forecaster", "description": "Financial indicator analytics app utilizing ARIMA and LSTM models to predict stock price movements and moving averages.", "category": "AI", "technologies": ["Python", "TensorFlow", "Pandas", "Yahoo Finance API", "React"], "image": "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-43", "title": "Resume Generator Pro", "subtitle": "ATS resume builder with PDF export", "description": "Interactive resume builder with live ATS formatting check, PDF export, multi-template selector, and section reordering.", "category": "Web", "technologies": ["React", "Next.js", "Tailwind CSS", "jsPDF", "Framer Motion"], "image": "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
    {"id": "proj-44", "title": "Fake News Detection System", "subtitle": "BERT NLP classifier for news credibility scoring", "description": "NLP classifier scoring news articles for credibility, bias, and clickbait indicators using BERT transformers.", "category": "AI", "technologies": ["Python", "PyTorch", "Transformers", "FastAPI", "React"], "image": "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80", "githubUrl": "https://github.com/Krishna8208863439", "liveUrl": "https://github.com/Krishna8208863439", "featured": True},
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
            messages = [
                {
                    'id': str(r['id']),
                    'name': r['name'],
                    'email': r['email'],
                    'phone': r.get('phone'),
                    'subject': r.get('subject'),
                    'message': r['message'],
                    'createdAt': r['created_at'].isoformat() if r['created_at'] else '',
                }
                for r in rows
            ]
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
    return jsonify({'distribution': []}), 200


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
# PythonAnywhere WSGI Entry Point
# ─────────────────────────────────────────────
application = app

if __name__ == '__main__':
    app.run(debug=True, port=5000)
