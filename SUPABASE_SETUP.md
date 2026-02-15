# Environment Configuration

## Supabase Connection

The project is configured to connect to:
- **Project URL**: `https://jybjhdzippgpbqtksjkr.supabase.co`
- **Project ID**: `jybjhdzippgpbqtksjkr`

## Setup Instructions

### 1. Create `.env` file in web directory

```bash
cd web
cp .env.example .env
```

### 2. Update `.env` with Supabase credentials

```env
REACT_APP_SUPABASE_URL=https://jybjhdzippgpbqtksjkr.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5YmpoZHppcHBncGJxdGtzamtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTkwMjIsImV4cCI6MjA4NTg3NTAyMn0.2_pO5bVY-PjN9J6NVP5Z49VSk69ADnemH_2hHyBsrCI
REACT_APP_SIGNALING_URL=ws://localhost:3000/ws
```

### 3. Run Database Migration

Go to Supabase SQL Editor and run:

```sql
-- Add points column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Update existing users to have 0 points
UPDATE users SET points = 0 WHERE points IS NULL;

-- Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
```

### 4. Restart Development Server

```bash
npm start
```

## Verification

1. Open browser console (F12)
2. Check for Supabase connection warnings
3. Verify data loads from Supabase
4. Test leaderboard functionality

## Security Notes

- ✅ `.env` file is in `.gitignore` (not committed to git)
- ✅ Anon key is safe for client-side use
- ✅ Row Level Security (RLS) should be enabled in Supabase
- ⚠️ Never commit service role keys to git

## Deployment

For production deployment, set environment variables in your hosting platform:
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Build & Deploy → Environment
- AWS/Azure: Application Configuration
