-- ==============================================================================
-- MIGRATION: 20261021000000_reviews_public_insert_policy.sql
-- DESCRIPTION: Fixes review submission failures and RLS infinite recursion
-- 1. Helper function public.is_admin() (security definer) to prevent recursive profile lookups
-- 2. Explicit public INSERT policy on public.reviews: "Allow public inserts"
-- 3. Public SELECT policy for approved reviews
-- 4. Clean admin policies without circular table dependencies
-- ==============================================================================

-- 1. Ensure reviews table exists with expected schema
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  customer_name text not null,
  rating integer not null default 5,
  comment text not null,
  trip_reference text,
  photo_url text,
  status text not null default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure columns exist
alter table public.reviews add column if not exists customer_name text;
alter table public.reviews add column if not exists rating integer default 5;
alter table public.reviews add column if not exists comment text;
alter table public.reviews add column if not exists trip_reference text;
alter table public.reviews add column if not exists photo_url text;
alter table public.reviews add column if not exists status text default 'pending';
alter table public.reviews add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- Enable RLS
alter table public.reviews enable row level security;
alter table public.profiles enable row level security;

-- 2. Security Definer helper to check admin role without triggering RLS recursion
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 3. Fix profiles policies to prevent infinite recursion
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;

create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Admins can view all profiles" on public.profiles
  for select using (public.is_admin());

create policy "Admins can update profiles" on public.profiles
  for update using (public.is_admin());

-- 4. Customer Reviews Policies
drop policy if exists "Approved reviews are viewable by everyone" on public.reviews;
drop policy if exists "Anyone can submit reviews for moderation" on public.reviews;
drop policy if exists "Allow public inserts" on public.reviews;
drop policy if exists "Admins have full access to reviews" on public.reviews;

-- Explicit policy allowing public and anonymous visitors to submit reviews
create policy "Allow public inserts" on public.reviews
  for insert with check (true);

-- Public select strictly permits approved reviews
create policy "Approved reviews are viewable by everyone" on public.reviews
  for select using (status = 'approved');

-- Admins full access policy (using security definer function)
create policy "Admins have full access to reviews" on public.reviews
  for all using (public.is_admin());

-- Ensure index on reviews status
create index if not exists idx_reviews_status on public.reviews(status);

