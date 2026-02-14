# DEPLOYMENT STEPS - Task Authorization Fix

## ✅ Step 1: Code Deployed
- Commit: `abf0f5b`
- Branch: `main`
- Status: **PUSHED TO GITHUB**

## ⏳ Step 2: Database Migration (REQUIRED)

### Go to Supabase Dashboard
1. Open: https://supabase.com/dashboard
2. Select your project: `jybjhdzippgpbqtksjkr`
3. Click "SQL Editor" in left sidebar
4. Click "New Query"

### Run This SQL:
```sql
-- Add points column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Update existing users to have 0 points
UPDATE users SET points = 0 WHERE points IS NULL;

-- Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
```

5. Click "Run" button
6. Verify success message

## ⏳ Step 3: Verify Deployment

### Test Authorization
1. Login as **Sharvesh**, **Shri Dharshini**, or **Siva Dharana**
   - ✅ Should see task update buttons (Start, Complete, Reset)
   
2. Login as any other user
   - ✅ Should NOT see task update buttons
   - ✅ Should only see task details

### Test Points System
1. Login as authorized user
2. Mark a task as "Completed"
3. Check leaderboard tab
4. Verify assigned user gained 10 points

## ⏳ Step 4: Backend Restart (If Needed)

If using a hosted backend service:
- Restart the NestJS backend service
- This ensures Prisma schema changes are loaded

## Troubleshooting

### If buttons still show for unauthorized users:
- Clear browser cache
- Hard refresh (Ctrl + Shift + R)
- Check browser console for errors

### If points don't update:
- Verify database migration ran successfully
- Check Supabase logs for errors
- Verify user IDs match between tasks and users tables

### If backend returns 403 errors:
- Check backend logs
- Verify user names match exactly:
  - "Shri Dharshini" (case-insensitive)
  - "Siva Dharana" (case-insensitive)
  - "Sharvesh" (case-insensitive)

## Support

If issues persist, check:
1. Browser console (F12) for frontend errors
2. Supabase logs for database errors
3. Backend logs for API errors
