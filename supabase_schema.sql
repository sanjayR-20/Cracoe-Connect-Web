-- Run this in Supabase SQL Editor to create required tables

create table if not exists public.users (
  id text primary key,
  username text unique not null,
  password text not null,
  name text not null,
  designation text not null,
  email text not null,
  permissions jsonb not null
);

create table if not exists public.tasks (
  id text primary key,
  title text not null,
  description text,
  priority text not null,
  deadline text not null,
  status text not null,
  assigned_to_id text[] not null,
  created_by text not null
);

create table if not exists public.announcements (
  id text primary key,
  title text not null,
  message text not null,
  created_by text not null,
  timestamp text not null
);

create table if not exists public.schedule_items (
  id text primary key,
  title text not null,
  time text not null,
  type text not null
);

create table if not exists public.messages (
  id text primary key,
  from_id text not null,
  type text not null,
  message text,
  payload jsonb,
  timestamp text not null
);

create table if not exists public.meetings (
  id text primary key,
  title text not null,
  date text not null,
  time text not null,
  attendees text[] not null,
  minutes text
);
