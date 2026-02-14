# Point System & Leaderboard Feature

## Overview
Added a gamification point system where users earn points for completing tasks. A leaderboard displays team members ranked by their points.

## Key Features

### 1. Point System
- Users earn **10 points** for each completed task
- Points are automatically added when a task status is changed to "Completed"
- Points are displayed on employee cards and in the leaderboard

### 2. Task Completion Authority
Only the following users can mark tasks as completed:
- **Shri Dharshini**
- **Siva Dharana**
- **Sharvesh**

Any other user attempting to update task status will receive an error message.

### 3. Leaderboard Tab
- New "Leaderboard" tab in the dashboard
- Shows all team members ranked by points (highest to lowest)
- Top 3 positions display medal emojis (🥇🥈🥉)
- Displays user name, designation, and total points

## Implementation Details

### Backend Changes

#### 1. Database Schema (`schema.prisma`)
```prisma
model User {
  points Int @default(0)
  // ... other fields
}
```

#### 2. Task Service (`tasks.service.ts`)
- Added `TASK_COMPLETION_AUTHORITIES` constant
- Modified `updateStatus()` to check user authority
- Automatically increments user points by 10 when task is completed

#### 3. Users Service (`users.service.ts`)
- Added `getLeaderboard()` method
- Modified `getAll()` to sort by points

#### 4. Users Controller (`users.controller.ts`)
- Added `/users/leaderboard` endpoint

### Frontend Changes

#### 1. Data Store (`dataStore.js`)
- Added `points` field to user serialization
- Modified `updateTaskStatus()` to check authority
- Automatically updates user points in local state

#### 2. Dashboard Screen (`DashboardScreen.js`)
- Added "Leaderboard" tab
- Displays ranked list of users with points
- Shows medals for top 3 positions

#### 3. Employee Card (`EmployeeCard.js`)
- Added points badge display in card header

#### 4. Styling
- Added leaderboard-specific CSS styles
- Added points badge styling for employee cards

## Database Migration

Run the following SQL in your Supabase SQL editor:

```sql
-- Add points column
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Update existing users
UPDATE users SET points = 0 WHERE points IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
```

## Usage

### For Authorized Users (Shri Dharshini, Siva Dharana, Sharvesh)
1. Navigate to any employee's task list
2. Click on a task to update its status
3. Change status to "Completed"
4. The assigned user automatically receives 10 points
5. View the leaderboard to see updated rankings

### For All Users
1. Click on the "Leaderboard" tab in the dashboard
2. View team rankings and points
3. See your own points on your employee card

## Security Notes
- Task completion authority is enforced both on frontend (UX) and backend (security)
- User names are normalized (lowercase, trimmed) for comparison
- Backend throws `ForbiddenException` for unauthorized attempts

## Future Enhancements
- Configurable point values per task priority
- Point deduction for missed deadlines
- Monthly/weekly leaderboard resets
- Achievement badges
- Point history tracking
