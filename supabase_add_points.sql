-- Migration: Add points system to users table
-- Run this in your Supabase SQL editor

-- Add points column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Update existing users to have 0 points
UPDATE users SET points = 0 WHERE points IS NULL;

-- Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
