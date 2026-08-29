-- ============================================================
-- KISAN SETU — MySQL Database Setup Script
-- Problem Statement ID: 26032
-- ============================================================

CREATE DATABASE IF NOT EXISTS kisan_setu
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Create dedicated application database user (using mysql_native_password for maximum Node/Prisma compatibility)
CREATE USER IF NOT EXISTS 'kisan_setu_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'KisanSetu@2026';
ALTER USER 'kisan_setu_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'KisanSetu@2026';

-- Grant required permissions on kisan_setu database
GRANT ALL PRIVILEGES ON kisan_setu.* TO 'kisan_setu_user'@'localhost';

FLUSH PRIVILEGES;

-- Verification
SELECT 'Kisan Setu database and user configured successfully!' AS Status;
