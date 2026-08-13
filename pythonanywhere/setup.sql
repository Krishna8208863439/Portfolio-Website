-- ============================================================
-- Portfolio MySQL Setup Script
-- Run this in PythonAnywhere MySQL console:
--   mysql -u KrishnaPortfolio -h KrishnaPortfolio.mysql.pythonanywhere-services.com -p KrishnaPortfolio\$portfolio < setup.sql
-- ============================================================

-- Contact Messages Table
CREATE TABLE IF NOT EXISTS contact_messages (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    phone       VARCHAR(50),
    subject     VARCHAR(500),
    message     TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Visitors Table
CREATE TABLE IF NOT EXISTS visitors (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255),
    role        VARCHAR(255),
    status      ENUM('identified', 'skipped') DEFAULT 'identified',
    ip_address  VARCHAR(100),
    user_agent  TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify tables were created
SHOW TABLES;
