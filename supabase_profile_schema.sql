-- Updated schema with user profile fields and task difficulty/points
-- Run this in Supabase SQL Editor after clearing users

-- Add new columns to users table for profile information
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_photo text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nationality text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS known_languages text[];
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS short_bio text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS education text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS github text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS linkedin text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS skills text[];
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS projects_done text[];
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS interests text[];
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS experience text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS points integer DEFAULT 0;

-- Add difficulty field to tasks table for points calculation
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'medium';

-- Update sharvesh to have profile_completed = true (admin doesn't need profile setup)
UPDATE public.users SET profile_completed = true WHERE username = 'sharvesh';

-- Points system reference:
-- Easy tasks: 10 points
-- Medium tasks: 15 points
-- Hard tasks: 30 points
-- Points added when completed on time
-- Points deducted when not completed by deadline

-- Verify schema changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;
