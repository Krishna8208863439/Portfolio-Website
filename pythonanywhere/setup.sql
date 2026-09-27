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

-- Custom Projects Table
CREATE TABLE IF NOT EXISTS custom_projects (
    id                VARCHAR(100) PRIMARY KEY,
    title             VARCHAR(255) NOT NULL,
    subtitle          VARCHAR(255) DEFAULT '',
    description       TEXT NOT NULL,
    long_description  TEXT,
    category          VARCHAR(100) DEFAULT 'Full Stack',
    image             TEXT NOT NULL,
    tags              TEXT,
    live_url          VARCHAR(500) DEFAULT '#',
    github_url        VARCHAR(500) DEFAULT '#',
    featured          TINYINT(1) DEFAULT 0,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify tables were created
SHOW TABLES;
