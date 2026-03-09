-- Clear all users except admin sharvesh
-- Run this in Supabase SQL Editor

-- First, remove all tasks assignments for users being deleted
UPDATE public.tasks 
SET assigned_to_id = ARRAY(
  SELECT unnest(assigned_to_id) 
  WHERE unnest = 'u1'
)
WHERE 'u1' = ANY(assigned_to_id);

-- Delete tasks that have no assignees after cleanup
DELETE FROM public.tasks 
WHERE array_length(assigned_to_id, 1) IS NULL OR assigned_to_id = '{}';

-- Delete messages from users being removed
DELETE FROM public.messages 
WHERE from_id NOT IN (SELECT id FROM public.users WHERE username = 'sharvesh');

-- Delete all users except sharvesh
DELETE FROM public.users WHERE username != 'sharvesh';

-- Update sharvesh's permissions to include all admin capabilities and add isAdmin flag
UPDATE public.users 
SET permissions = '{
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
}'::jsonb
WHERE username = 'sharvesh';

-- Verify remaining user
SELECT * FROM public.users;
