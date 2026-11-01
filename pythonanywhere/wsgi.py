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
import zipfile

# Auto-extract out.zip if newer than static out directory
_home = os.path.expanduser('~')
for _root in [os.path.join(_home, 'Portfolio-Website'), '/home/KrishnaPortfolio/Portfolio-Website', '/home/krishnaportfolio/Portfolio-Website']:
    _zip = os.path.join(_root, 'out.zip')
    _out = os.path.join(_root, 'out')
    if os.path.exists(_zip):
        try:
            _marker = os.path.join(_out, '.last_extracted_mtime')
            _current_mtime = str(os.path.getmtime(_zip))
            _last_mtime = ''
            if os.path.exists(_marker):
                with open(_marker, 'r') as _f:
                    _last_mtime = _f.read().strip()
            if _current_mtime != _last_mtime or not os.path.exists(os.path.join(_out, 'index.html')):
                os.makedirs(_out, exist_ok=True)
                with zipfile.ZipFile(_zip, 'r') as _zf:
                    _zf.extractall(_out)
                with open(_marker, 'w') as _f:
                    _f.write(_current_mtime)
        except Exception as _e:
            print(f"[WSGI] out.zip extraction error: {_e}")

# Add pythonanywhere folder to Python path (handles both upper/lowercase usernames)
sys.path.insert(0, os.path.join(_home, 'Portfolio-Website', 'pythonanywhere'))
sys.path.insert(0, '/home/KrishnaPortfolio/Portfolio-Website/pythonanywhere')
sys.path.insert(0, '/home/krishnaportfolio/Portfolio-Website/pythonanywhere')

# ─── Set environment variables ───────────────────────────
# IMPORTANT: Replace all placeholder values below!
os.environ['ADMIN_EMAIL'] = 'krishna@gmail.com'
os.environ['ADMIN_PASSWORD'] = 'Sgi@5555'
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
