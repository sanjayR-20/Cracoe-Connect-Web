-- ============================================
-- CRACOE CONNECT - COMPLETE SUPABASE SETUP
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: DROP EXISTING TABLES (Clean Slate)
-- ============================================
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.meetings CASCADE;
DROP TABLE IF EXISTS public.schedule_items CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================
-- STEP 2: CREATE USERS TABLE
-- ============================================
CREATE TABLE public.users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  email TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{}',
  points INTEGER DEFAULT 0,
  
  -- Profile fields (for first-login setup)
  profile_completed BOOLEAN DEFAULT FALSE,
  profile_photo TEXT,
  location TEXT,
  gender TEXT,
  nationality TEXT,
  known_languages TEXT[],
  short_bio TEXT,
  education TEXT,
  phone TEXT,
  github TEXT,
  linkedin TEXT,
  skills TEXT[],
  projects_done TEXT[],
  interests TEXT[],
  experience TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 3: CREATE TASKS TABLE
-- ============================================
CREATE TABLE public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL,
  deadline TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  assigned_to_id TEXT[] NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  difficulty TEXT DEFAULT 'medium', -- easy (10pts), medium (15pts), hard (30pts)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 4: CREATE ANNOUNCEMENTS TABLE
-- ============================================
CREATE TABLE public.announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_by TEXT NOT NULL,
  timestamp TEXT NOT NULL
);

-- ============================================
-- STEP 5: CREATE SCHEDULE_ITEMS TABLE
-- ============================================
CREATE TABLE public.schedule_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  time TEXT NOT NULL,
  type TEXT NOT NULL
);

-- ============================================
-- STEP 6: CREATE MESSAGES TABLE
-- ============================================
CREATE TABLE public.messages (
  id TEXT PRIMARY KEY,
  from_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  message TEXT,
  payload JSONB,
  timestamp TEXT NOT NULL
);

-- ============================================
-- STEP 7: CREATE MEETINGS TABLE
-- ============================================
CREATE TABLE public.meetings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  attendees TEXT[] NOT NULL DEFAULT '{}',
  minutes TEXT
);

-- ============================================
-- STEP 8: ENABLE ROW LEVEL SECURITY (Optional)
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anonymous users (for development)
CREATE POLICY "Allow all for users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for announcements" ON public.announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for schedule_items" ON public.schedule_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for meetings" ON public.meetings FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- STEP 9: ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;

-- ============================================
-- STEP 10: SEED ADMIN USER (Sharvesh)
-- ============================================
INSERT INTO public.users (
  id,
  username,
  password,
  name,
  designation,
  email,
  permissions,
  points,
  profile_completed
) VALUES (
  'u1',
  'sharvesh',
  'S@rvesh*&^2026',
  'Sharvesh S',
  'CEO',
  'sharvesh@cracoeconnect.com',
  '{
    "canAssignTasks": true,
    "canAnnounce": true,
    "canSchedule": true,
    "canViewMeetingMinutes": true,
    "canManageMeetingMinutes": true,
    "canViewAllTasks": true,
    "canEditAllTasks": true,
    "canAddUser": true,
    "canRemoveUser": true,
    "canViewAdmin": true,
    "canManageTeam": true
  }'::jsonb,
  0,
  true
);

-- ============================================
-- VERIFICATION: Check tables and admin user
-- ============================================
SELECT 'Tables created successfully!' AS status;
SELECT * FROM public.users;

-- ============================================
-- POINTS SYSTEM REFERENCE:
-- ============================================
-- Task Difficulty | Points Awarded/Deducted
-- ----------------|------------------------    
-- Easy            | 10 points
-- Medium          | 15 points
-- Hard            | 30 points
--
-- Points are ADDED when task is completed ON TIME
-- Points are DEDUCTED when task is marked "Not Completed"
-- ============================================

-- ============================================
-- LOGIN CREDENTIALS:
-- ============================================
-- Username: sharvesh
-- Password: S@rvesh*&^2026
-- Role: CEO (Admin)
-- ============================================
