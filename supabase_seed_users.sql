-- Seed Cracoe Connect users
-- Run this in Supabase SQL Editor after creating tables

-- Only seed the admin user (sharvesh)
insert into public.users (id, username, password, name, designation, email, permissions, profile_completed, points)
values
  ('u1', 'sharvesh', 'S@rvesh*&^2026', 'Sharvesh S', 'CEO', 'sharvesh@cracoeconnect.com', '{"canAssignTasks": true, "canAnnounce": true, "canSchedule": true, "canViewMeetingMinutes": true, "canManageMeetingMinutes": true, "canViewAllTasks": true, "canEditAllTasks": true, "canAddUser": true, "canRemoveUser": true, "canViewAdmin": true, "canManageTeam": true}', true, 0)
on conflict (id) do update set
  username = excluded.username,
  password = excluded.password,
  name = excluded.name,
  designation = excluded.designation,
  email = excluded.email,
  permissions = excluded.permissions,
  profile_completed = excluded.profile_completed,
  points = excluded.points;
