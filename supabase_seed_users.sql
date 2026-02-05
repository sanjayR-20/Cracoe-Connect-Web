-- Seed Cracoe Connect users
-- Run this in Supabase SQL Editor after creating tables

insert into public.users (id, username, password, name, designation, email, permissions)
values
  ('u1', 'sharvesh', 'S@rvesh*&^2026', 'Sharvesh S', 'CEO', 'sharvesh@cracoeconnect.com', '{"canAssignTask": true, "canAnnounce": true, "canAddUser": true, "canRemoveUser": true}'),
  ('u2', 'sivadharana', 'Siv@dh@r@na$^2026', 'Sivadharana', 'COO', 'sivadharana@cracoeconnect.com', '{"canAssignTask": true, "canAnnounce": true, "canAddUser": false, "canRemoveUser": false}'),
  ('u3', 'shridharshini', 'Shr!Dh@r$hini&2026', 'Shri Dharshini', 'CTO', 'shridharshini@cracoeconnect.com', '{"canAssignTask": true, "canAnnounce": true, "canAddUser": false, "canRemoveUser": false}'),
  ('u5', 'sanjay', 'S@nJ@y*^&2026', 'Sanjay R', 'CFO', 'sanjay@cracoeconnect.com', '{"canAssignTask": true, "canAnnounce": true, "canAddUser": false, "canRemoveUser": false}'),
  ('u6', 'sakthivel', 'S@kth!v3l$^2026', 'Sakthivel', 'Manager', 'sakthivel@cracoeconnect.com', '{"canAssignTask": true, "canAnnounce": true, "canAddUser": false, "canRemoveUser": false}'),
  ('u7', 'shanmugavel', 'Sh@nMug@vel*&2026', 'Shanmugavel', 'Developer', 'shanmugavel@cracoeconnect.com', '{"canAssignTask": false, "canAnnounce": false, "canAddUser": false, "canRemoveUser": false}'),
  ('u8', 'shreevardhann', 'Shr33V@rdh@nn$2026', 'Shree Vardhann', 'Developer', 'shreevardhann@cracoeconnect.com', '{"canAssignTask": false, "canAnnounce": false, "canAddUser": false, "canRemoveUser": false}'),
  ('u9', 'shalini', 'Sh@l!n!^&2026', 'Shalini', 'Developer', 'shalini@cracoeconnect.com', '{"canAssignTask": false, "canAnnounce": false, "canAddUser": false, "canRemoveUser": false}'),
  ('u10', 'sreejith', 'Sre3j!th@*2026', 'Sreejith', 'Manager', 'sreejith@cracoeconnect.com', '{"canAssignTask": true, "canAnnounce": true, "canAddUser": false, "canRemoveUser": false}'),
  ('u11', 'sujithra', 'Suj!thr@*&2026', 'Sujithra', 'Developer', 'sujithra@cracoeconnect.com', '{"canAssignTask": false, "canAnnounce": false, "canAddUser": false, "canRemoveUser": false}')
on conflict (id) do update set
  username = excluded.username,
  password = excluded.password,
  name = excluded.name,
  designation = excluded.designation,
  email = excluded.email,
  permissions = excluded.permissions;
