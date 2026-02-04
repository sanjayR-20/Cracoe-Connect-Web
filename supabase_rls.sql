    -- Enable RLS and add permissive policies for development

    alter table public.users enable row level security;
    alter table public.tasks enable row level security;
    alter table public.announcements enable row level security;
    alter table public.schedule_items enable row level security;
    alter table public.messages enable row level security;
    alter table public.meetings enable row level security;

    -- Allow all operations for anon (development only)
    create policy "users_all" on public.users for all using (true) with check (true);
    create policy "tasks_all" on public.tasks for all using (true) with check (true);
    create policy "announcements_all" on public.announcements for all using (true) with check (true);
    create policy "schedule_all" on public.schedule_items for all using (true) with check (true);
    create policy "messages_all" on public.messages for all using (true) with check (true);
    create policy "meetings_all" on public.meetings for all using (true) with check (true);
