-- 🛡️ Enhanced Security Database Schema
-- Run this to add security-related columns

USE blog_db;

-- Add security columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(32) NULL,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255) NULL;

-- Add security columns to articles table
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS cover VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS status ENUM('draft', 'published', 'archived') DEFAULT 'published',
ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;

-- Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id INT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  details JSON NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_timestamp (user_id, timestamp),
  INDEX idx_action_timestamp (action, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create rate limiting table (alternative to Redis)
CREATE TABLE IF NOT EXISTS rate_limits (
  id VARCHAR(255) PRIMARY KEY,
  attempts INT DEFAULT 1,
  reset_time TIMESTAMP NOT NULL,
  INDEX idx_reset_time (reset_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create sessions table for enhanced session management
CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INT NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add indexes for better performance and security queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
