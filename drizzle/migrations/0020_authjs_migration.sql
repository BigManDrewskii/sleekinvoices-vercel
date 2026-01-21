-- Auth.js Migration for SleekInvoices
-- This migration adds Auth.js tables and modifies the users table to support Auth.js
-- Run this after updating drizzle/schema.ts

-- Add Auth.js columns to users table
ALTER TABLE users
ADD COLUMN uuid CHAR(36) UNIQUE AFTER id,
ADD COLUMN emailVerified TIMESTAMP NULL AFTER email,
ADD COLUMN image TEXT NULL AFTER avatarUrl;

-- Add index on uuid for faster lookups
CREATE INDEX idx_users_uuid ON users(uuid);

-- Make openId nullable (already unique, now allowing migration to new auth)
ALTER TABLE users MODIFY COLUMN openId VARCHAR(64) UNIQUE NULL;

-- Create accounts table (OAuth provider linkage)
CREATE TABLE IF NOT EXISTS accounts (
  id CHAR(36) PRIMARY KEY,
  userId INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  providerAccountId VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INT,
  token_type VARCHAR(50),
  scope VARCHAR(255),
  id_token TEXT,
  session_state VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_provider_account (provider, providerAccountId)
);

-- Create sessions table (JWT tracking)
CREATE TABLE IF NOT EXISTS sessions (
  id CHAR(36) PRIMARY KEY,
  userId INT NOT NULL,
  expires TIMESTAMP NOT NULL,
  sessionToken VARCHAR(255) NOT NULL UNIQUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Migrate avatarUrl to image for existing users
UPDATE users SET image = avatarUrl WHERE avatarUrl IS NOT NULL;

-- Generate UUIDs for existing users (this will be done by migration script)
-- Run: node scripts/migrate-user-ids.ts
