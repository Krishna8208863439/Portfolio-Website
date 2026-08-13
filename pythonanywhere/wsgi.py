"""
PythonAnywhere WSGI Entry Point
================================
This file is pointed to by PythonAnywhere's WSGI configuration.

In PythonAnywhere Web tab → WSGI configuration file,
replace all content with:

    import sys
    sys.path.insert(0, '/home/KrishnaPortfolio/Portfolio-Website/pythonanywhere')
    from wsgi import application

Or just point the WSGI file path directly to this file.
"""

import sys
import os

# Add the pythonanywhere folder to Python path
sys.path.insert(0, '/home/KrishnaPortfolio/Portfolio-Website/pythonanywhere')

# ─── Set environment variables ───────────────────────────
# IMPORTANT: Replace all placeholder values below!
os.environ.setdefault('ADMIN_EMAIL', 'admin@portfolio.com')
os.environ.setdefault('ADMIN_PASSWORD', 'admin123')
os.environ.setdefault('JWT_SECRET', 'super-secret-jwt-key-portfolio-2026')

os.environ.setdefault('SMTP_HOST', 'smtp.gmail.com')
os.environ.setdefault('SMTP_PORT', '587')
os.environ.setdefault('SMTP_USER', 'krishnadevadkar@gmail.com')
os.environ.setdefault('SMTP_PASS', 'your-gmail-app-password-here')  # <-- CHANGE THIS
os.environ.setdefault('CONTACT_RECEIVER_EMAIL', 'krishnadevadkar@gmail.com')

os.environ.setdefault('DB_HOST', 'KrishnaPortfolio.mysql.pythonanywhere-services.com')
os.environ.setdefault('DB_USER', 'KrishnaPortfolio')
os.environ.setdefault('DB_PASS', 'your-mysql-password-here')        # <-- CHANGE THIS
os.environ.setdefault('DB_NAME', 'KrishnaPortfolio$portfolio')

# ─── Import Flask app ─────────────────────────────────────
from flask_app import application  # noqa: E402
