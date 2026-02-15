# Step-by-Step Testing Guide

## Step 1: Run SQL Migration in Supabase

### A. Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Login to your account
3. Click on your project (jybjhdzippgpbqtksjkr)

### B. Open SQL Editor
1. Look at the left sidebar
2. Click on "SQL Editor" icon (looks like </> symbol)
3. Click the "+ New query" button at the top

### C. Run the Migration
1. Copy this SQL code:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
UPDATE users SET points = 0 WHERE points IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
```

2. Paste it into the SQL editor
3. Click the "Run" button (or press Ctrl+Enter)
4. You should see "Success. No rows returned" message

✅ Database migration complete!

---

## Step 2: Restart Development Server

### A. Stop Current Server (if running)
1. Go to your terminal/command prompt where the server is running
2. Press `Ctrl + C` to stop it

### B. Start Fresh Server
1. Open terminal/command prompt
2. Navigate to web folder:
```bash
cd "e:\Cracoe connect\web"
```

3. Start the server:
```bash
npm start
```

4. Wait for "Compiled successfully!" message
5. Browser should open automatically at http://localhost:3000

✅ Server restarted!

---

## Step 3: Test with Different User Logins

### A. Test Authorized User (Sharvesh)
1. Open http://localhost:3000 in browser
2. Login with Sharvesh's credentials
3. Go to Tasks section
4. Look at any task card
5. ✅ You SHOULD see buttons: "Start", "Complete", "Reset"

### B. Test Authorized User (Shri Dharshini)
1. Logout (if there's a logout button)
2. Login with Shri Dharshini's credentials
3. Go to Tasks section
4. ✅ You SHOULD see task update buttons

### C. Test Authorized User (Siva Dharana)
1. Logout
2. Login with Siva Dharana's credentials
3. Go to Tasks section
4. ✅ You SHOULD see task update buttons

### D. Test Unauthorized User (Any Other User)
1. Logout
2. Login with any other user's credentials
3. Go to Tasks section
4. ✅ You should NOT see task update buttons
5. ✅ You should only see task details

---

## Step 4: Verify Points Increment on Task Completion

### A. Check Initial Points
1. Login as Sharvesh (or Shri Dharshini or Siva Dharana)
2. Click on "Leaderboard" tab in Dashboard
3. Note the current points for a user who has a task assigned

### B. Complete a Task
1. Go to Tasks section
2. Find a task assigned to a specific user
3. Click "Complete" button on that task
4. Task status should change to "Completed"

### C. Verify Points Increased
1. Go back to "Leaderboard" tab
2. Find the user who was assigned that task
3. ✅ Their points should have increased by 10
4. ✅ The leaderboard should re-sort automatically

### D. Check Employee Card
1. Go to "Employees" tab
2. Find the employee who completed the task
3. ✅ You should see a points badge on their card showing updated points

---

## Quick Troubleshooting

### If buttons still show for unauthorized users:
- Clear browser cache (Ctrl + Shift + Delete)
- Hard refresh page (Ctrl + Shift + R)
- Close and reopen browser

### If points don't update:
- Check browser console (F12) for errors
- Verify SQL migration ran successfully in Supabase
- Restart the development server again

### If Supabase connection fails:
- Check if .env file exists in web folder
- Verify .env has correct Supabase URL and key
- Restart development server

---

## Expected Results Summary

| User Type | Can See Update Buttons? | Can Update Tasks? | Earns Points? |
|-----------|------------------------|-------------------|---------------|
| Sharvesh | ✅ Yes | ✅ Yes | ✅ Yes (when task completed) |
| Shri Dharshini | ✅ Yes | ✅ Yes | ✅ Yes (when task completed) |
| Siva Dharana | ✅ Yes | ✅ Yes | ✅ Yes (when task completed) |
| Other Users | ❌ No | ❌ No | ✅ Yes (when task completed) |

Note: All users earn points when their assigned tasks are completed, but only the 3 authorized users can mark tasks as complete.
