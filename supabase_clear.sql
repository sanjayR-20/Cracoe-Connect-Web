-- Run this in Supabase SQL Editor to remove all existing sample data

begin;

-- Delete in safe order

delete from public.messages;
delete from public.tasks;
delete from public.announcements;
delete from public.schedule_items;
delete from public.meetings;
delete from public.users;

commit;
