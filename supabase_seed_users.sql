-- Seed Cracoe Connect users
-- Run this in Supabase SQL Editor after creating tables

insert into public.users (id, username, password, name, designation, email, permissions)
values
  ('u1', 'sharvesh', 'S@rvesh*&^2026', 'Sharvesh S', 'CEO', 'sharvesh@cracoeconnect.com', '{"canAssignTasks": true, "canAnnounce": true, "canSchedule": true, "canViewMeetingMinutes": true, "canManageMeetingMinutes": true, "canViewAllTasks": true, "canEditAllTasks": true}'),
  ('u2', 'sivadharana', 'Siv@dh@r@na$^2026', 'Sivadharana', 'COO', 'sivadharana@cracoeconnect.com', '{"canAssignTasks": true, "canAnnounce": true, "canSchedule": true, "canViewMeetingMinutes": true, "canManageMeetingMinutes": true, "canViewAllTasks": true, "canEditAllTasks": true}'),
  ('u3', 'shridharshini', 'Shr!Dh@r$hini&2026', 'Shri Dharshini', 'CTO', 'shridharshini@cracoeconnect.com', '{"canAssignTasks": true, "canAnnounce": true, "canSchedule": true, "canViewMeetingMinutes": true, "canManageMeetingMinutes": true, "canViewAllTasks": true, "canEditAllTasks": true}'),
  ('u5', 'sanjay', 'S@nJ@y*^&2026', 'Sanjay R', 'CFO', 'sanjay@cracoeconnect.com', '{"canAssignTasks": true, "canAnnounce": true, "canSchedule": true, "canViewMeetingMinutes": true, "canManageMeetingMinutes": true, "canViewAllTasks": true, "canEditAllTasks": true}'),
  ('u6', 'sakthivel', 'S@kth!v3l$^2026', 'Sakthivel', 'Manager', 'sakthivel@cracoeconnect.com', '{"canAssignTasks": true, "canAnnounce": true, "canSchedule": true, "canViewMeetingMinutes": true, "canManageMeetingMinutes": true, "canViewAllTasks": true, "canEditAllTasks": true}'),
  ('u7', 'shanmugavel', 'Sh@nMug@vel*&2026', 'Shanmugavel', 'Developer', 'shanmugavel@cracoeconnect.com', '{"canAssignTasks": true, "canAnnounce": true, "canSchedule": true, "canViewMeetingMinutes": true, "canManageMeetingMinutes": true, "canViewAllTasks": true, "canEditAllTasks": true}'),
  ('u8', 'shreevardhann', 'Shr33V@rdh@nn$2026', 'Shree Vardhann', 'Developer', 'shreevardhann@cracoeconnect.com', '{"canAssignTasks": true, "canAnnounce": true, "canSchedule": true, "canViewMeetingMinutes": true, "canManageMeetingMinutes": true, "canViewAllTasks": true, "canEditAllTasks": true}'),
  ('u9', 'shalini', 'Sh@l!n!^&2026', 'Shalini', 'Developer', 'shalini@cracoeconnect.com', '{"canAssignTasks": true, "canAnnounce": true, "canSchedule": true, "canViewMeetingMinutes": true, "canManageMeetingMinutes": true, "canViewAllTasks": true, "canEditAllTasks": true}'),
  ('u10', 'sreejith', 'Sre3j!th@*2026', 'Sreejith', 'Manager', 'sreejith@cracoeconnect.com', '{"canAssignTasks": true, "canAnnounce": true, "canSchedule": true, "canViewMeetingMinutes": true, "canManageMeetingMinutes": true, "canViewAllTasks": true, "canEditAllTasks": true}'),
  ('u11', 'sujithra', 'Suj!thr@*&2026', 'Sujithra', 'Developer', 'sujithra@cracoeconnect.com', '{"canAssignTasks": true, "canAnnounce": true, "canSchedule": true, "canViewMeetingMinutes": true, "canManageMeetingMinutes": true, "canViewAllTasks": true, "canEditAllTasks": true}')
on conflict (id) do update set
  username = excluded.username,
  password = excluded.password,
  name = excluded.name,
  designation = excluded.designation,
  email = excluded.email,
  permissions = excluded.permissions;
