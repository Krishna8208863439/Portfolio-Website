# 🚀 PythonAnywhere Deployment Guide — Krishna's Portfolio

Complete step-by-step guide to deploy your Next.js Portfolio to PythonAnywhere **free plan**.

---

## Architecture Overview

```
PythonAnywhere (KrishnaPortfolio)
│
├── Static Files → krishnaportfolio.pythonanywhere.com
│   └── /home/KrishnaPortfolio/Portfolio-Website/out/  (Next.js static build)
│
└── Flask WSGI App → krishnaportfolio.pythonanywhere.com/api/*
    └── /home/KrishnaPortfolio/Portfolio-Website/pythonanywhere/flask_app.py
```

---

## STEP 1 — Setup MySQL Database

1. Go to **PythonAnywhere Dashboard → Databases** tab
2. Set a MySQL password (remember it!)
3. Create a database named: `portfolio`
   - Your full DB name will be: `KrishnaPortfolio$portfolio`
4. Click on your database and run these SQL commands in the console:

```sql
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(500),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS visitors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    role VARCHAR(255),
    status ENUM('identified','skipped') DEFAULT 'identified',
    ip_address VARCHAR(100),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## STEP 2 — Install Node.js (for static build only)

Open a **Bash console** on PythonAnywhere and run:

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Install Node 20
nvm install 20
nvm use 20
node -v   # should show v20.x.x
```

If nvm fails, try the direct binary method:
```bash
mkdir -p ~/nodejs && cd ~/nodejs
wget https://nodejs.org/dist/v20.17.0/node-v20.17.0-linux-x64.tar.xz
tar -xf node-v20.17.0-linux-x64.tar.xz
echo 'export PATH=$HOME/nodejs/node-v20.17.0-linux-x64/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
node -v
```

---

## STEP 3 — Clone and Build the Project

```bash
# Clone repo
git clone https://github.com/Krishna8208863439/Portfolio-Website.git
cd ~/Portfolio-Website

# Install and build (creates /out directory)
npm install
NEXT_PUBLIC_API_URL=https://krishnaportfolio.pythonanywhere.com npm run build
```

> This creates the `/out` folder with all static HTML/CSS/JS files.

---

## STEP 4 — Install Python Dependencies

```bash
pip3 install --user flask flask-cors PyMySQL PyJWT bcrypt
```

---

## STEP 5 — Configure the WSGI File

1. Go to **PythonAnywhere → Web tab** → **Add a new web app**
2. Choose: **Manual configuration** → **Python 3.10**
3. Click **WSGI configuration file** link — it opens an editor
4. Replace the entire file content with:

```python
import sys
import os

sys.path.insert(0, '/home/KrishnaPortfolio/Portfolio-Website/pythonanywhere')

# ─── Your credentials — EDIT THESE ───────────────
os.environ['ADMIN_EMAIL'] = 'admin@portfolio.com'
os.environ['ADMIN_PASSWORD'] = 'admin123'
os.environ['JWT_SECRET'] = 'super-secret-jwt-key-portfolio-2026'

os.environ['SMTP_HOST'] = 'smtp.gmail.com'
os.environ['SMTP_PORT'] = '587'
os.environ['SMTP_USER'] = 'krishnadevadkar@gmail.com'
os.environ['SMTP_PASS'] = 'YOUR_GMAIL_APP_PASSWORD_HERE'   # ← CHANGE THIS
os.environ['CONTACT_RECEIVER_EMAIL'] = 'krishnadevadkar@gmail.com'

os.environ['DB_HOST'] = 'KrishnaPortfolio.mysql.pythonanywhere-services.com'
os.environ['DB_USER'] = 'KrishnaPortfolio'
os.environ['DB_PASS'] = 'YOUR_MYSQL_PASSWORD_HERE'         # ← CHANGE THIS
os.environ['DB_NAME'] = 'KrishnaPortfolio$portfolio'
# ─────────────────────────────────────────────────

from flask_app import application
```

---

## STEP 6 — Configure Static Files

In **PythonAnywhere → Web tab → Static files** section, add:

| URL | Directory |
|-----|-----------|
| `/` | `/home/KrishnaPortfolio/Portfolio-Website/out` |
| `/api/` | *(leave empty — handled by Flask WSGI)* |

---

## STEP 7 — Configure the WSGI Source Code

In the Web tab, set:
- **Source code**: `/home/KrishnaPortfolio/Portfolio-Website/pythonanywhere`
- **Working directory**: `/home/KrishnaPortfolio/Portfolio-Website/pythonanywhere`

---

## STEP 8 — Reload Web App

Click the green **"Reload"** button in the Web tab.

Your site is now live at:
- **Portfolio**: `https://krishnaportfolio.pythonanywhere.com`
- **Admin Panel**: `https://krishnaportfolio.pythonanywhere.com/admin`
- **API**: `https://krishnaportfolio.pythonanywhere.com/api/projects`

---

## STEP 9 — Get Gmail App Password (for email)

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → 2-Step Verification → App Passwords
3. Select app: "Mail", device: "Other" → type "Portfolio"
4. Copy the 16-digit password
5. Paste it as `SMTP_PASS` in the WSGI file

---

## Future Updates (Pull Command)

Whenever you push changes from local, run on PythonAnywhere:

```bash
cd ~/Portfolio-Website
git pull origin main
NEXT_PUBLIC_API_URL=https://krishnaportfolio.pythonanywhere.com npm run build
```

Then click **Reload** in the Web tab.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Error log shows `ModuleNotFoundError` | Run `pip3 install --user flask flask-cors PyMySQL PyJWT bcrypt` |
| Static files not loading | Check URL/directory mapping in Web tab static files |
| API returns 500 | Check error log in Web tab → Log files |
| Email not sending | Check Gmail App Password is correct in WSGI file |
| MySQL connection failed | Verify DB password in WSGI file matches Databases tab |

**View error logs**: Web tab → Log files → `error.log`
