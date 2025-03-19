
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create availability table
create table if not exists "public"."availability" (
  id uuid not null default uuid_generate_v4(),
  user_id int,
  "date" date not null,
  "start_time" time not null,
  "end_time" time not null,
  "is_available" boolean default true,
  "created_at" timestamp with time zone default timezone('utc'::text, now()),
  "updated_at" timestamp with time zone default timezone('utc'::text, now()),
  primary key ("id")
);

-- Enable RLS (Row Level Security)
alter table "public"."availability" enable row level security;

-- Create RLS policies
create policy "Users can view own availability"
  on "public"."availability"
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own availability"
  on "public"."availability"
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own availability"
  on "public"."availability"
  for update
  using (auth.uid() = user_id);

create policy "Users can delete own availability"
  on "public"."availability"
  for delete
  using (auth.uid() = user_id);

-- Create indexes
create index if not exists idx_availability_user_id on "public"."availability" (user_id);
