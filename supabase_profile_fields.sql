-- Add profile fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS short_bio TEXT,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS github TEXT,
ADD COLUMN IF NOT EXISTS linkedin TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS experience TEXT;

-- Add password field if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'password123';

-- Update existing users with default password if needed
UPDATE users SET password = 'password123' WHERE password IS NULL;

-- Make password NOT NULL
ALTER TABLE users ALTER COLUMN password SET NOT NULL;