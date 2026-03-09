# Cracoe Connect - Update Summary

## Changes Made

### 1. User Management
- **Removed all users except admin "sharvesh"**
  - Run `supabase_clear_users.sql` in Supabase SQL Editor to clear existing users
  - Only the admin (sharvesh) will remain with full permissions

- **Permission Selection on User Creation**
  - Admin can now choose specific permissions when adding a new user
  - Expandable permission panel in the Add Employee form
  - 9 configurable permissions available:
    - Can Assign Tasks
    - Can View Admin
    - Can Manage Team
    - Can View All Tasks
    - Can Edit All Tasks
    - Can Announce
    - Can Schedule
    - Can View Meeting Minutes
    - Can Manage Meeting Minutes

### 2. First-Login Profile Setup
New users must complete their profile on first login. Profile includes:

**Basic Information:**
- Profile Photo (upload)
- Full Name
- Location
- Gender
- Nationality
- Known Languages
- Short Bio
- Education

**Contact Information:**
- Email
- Phone
- GitHub
- LinkedIn

**Professional Information:**
- Skills
- Projects Done
- Interests
- Experience

### 3. Points System Based on Task Difficulty

**Task Difficulty Levels:**
- Easy: 10 points
- Medium: 15 points  
- Hard: 30 points

**Points Rules:**
- Points are **awarded** when a task is completed **on time** (before or on deadline)
- Points are **deducted** if a task is marked as "Not Completed" (past deadline)
- Points cannot go below 0

**New Task Status:**
- Added "Not Completed" status for tasks past their deadline
- Only appears for tasks that are past their deadline and not yet completed

### 4. Files Modified

**New Files:**
- `src/screens/ProfileSetupScreen.js` - Profile setup screen for first-time login
- `src/styles/ProfileSetup.css` - Styling for profile setup
- `supabase_clear_users.sql` - SQL to clear all users except sharvesh
- `supabase_profile_schema.sql` - SQL to add new profile columns

**Modified Files:**
- `src/App.js` - Added profile setup route and profile completion check
- `src/screens/LoginScreen.js` - Navigate to profile setup if not completed
- `src/screens/AdminPanelScreen.js` - Permission selection when adding users
- `src/screens/CreateTaskScreen.js` - Added difficulty selector
- `src/components/TaskItem.js` - Display difficulty, "Not Completed" status button
- `src/store/dataStore.js` - Profile fields, difficulty-based points, updateUserProfile
- `src/styles/AdminPanel.css` - Permission selection styles
- `src/styles/CreateTask.css` - Difficulty selector styles
- `src/styles/TaskItem.css` - Difficulty badge and not-completed button styles
- `supabase_schema.sql` - Updated with new columns
- `supabase_seed_users.sql` - Updated to only seed admin user

---

## Setup Instructions

### For Existing Database:

1. **Clear existing users:**
   ```sql
   -- Run supabase_clear_users.sql in Supabase SQL Editor
   ```

2. **Add new columns:**
   ```sql
   -- Run supabase_profile_schema.sql in Supabase SQL Editor
   ```

### For Fresh Database:

1. Run `supabase_schema.sql` to create tables with all new columns
2. Run `supabase_seed_users.sql` to add admin user

---

## Login Credentials

**Admin User:**
- Username: `sharvesh`
- Password: `S@rvesh*&^2026`
- Role: CEO (Admin)

All other users will be added by the admin through the Admin Panel.
