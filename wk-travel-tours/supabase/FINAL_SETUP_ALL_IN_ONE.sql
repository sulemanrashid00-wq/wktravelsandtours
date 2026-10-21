-- ============================================================================
-- WK TRAVEL & TOUR (KARACHI) — MASTER CONSOLIDATED PRODUCTION MIGRATION
-- File: supabase/FINAL_SETUP_ALL_IN_ONE.sql
-- Master Single-Paste SQL Setup for Supabase (Run Once in Supabase SQL Editor)
-- Execution Mode: Single-Run Idempotent Master Script
-- Target Administrator: wktravelandtour@gmail.com (and admin@wktravel.pk)
-- Fully compatible with Supabase SQL Editor and existing schema
-- ============================================================================

-- STEP 1: EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- STEP 2: ENSURE CORE TABLES EXIST & SAFELY ADD ALL REQUIRED COLUMNS

-- 1. Profiles & Roles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null default '',
  email text,
  phone text,
  city text,
  role text not null default 'customer',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Crucial: Explicitly add columns in case the table already existed with a different structure
alter table public.profiles add column if not exists full_name text default '';
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists role text default 'customer';
alter table public.profiles add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());
alter table public.profiles add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

-- If an older column named "name" exists, copy its value into full_name
do $$ 
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'name') then
    execute 'update public.profiles set full_name = coalesce(nullif(full_name, ''''), name) where name is not null';
  end if;
end $$;

-- Ensure default values for existing rows
update public.profiles set full_name = '' where full_name is null;
update public.profiles set role = 'customer' where role is null;

-- Safely set role check constraint
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('customer', 'admin'));

-- 2. Package Categories Table
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null,
  description text,
  display_order int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.categories add column if not exists name text;
alter table public.categories add column if not exists slug text;
alter table public.categories add column if not exists description text;
alter table public.categories add column if not exists display_order integer default 0;
alter table public.categories add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- Ensure unique constraint on categories.slug
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'categories_slug_key'
  ) and not exists (
    select 1 from pg_indexes where tablename = 'categories' and indexdef like '%UNIQUE%(slug)%'
  ) then
    alter table public.categories add constraint categories_slug_key unique (slug);
  end if;
end $$;

-- 3. Travel Packages Table
create table if not exists public.packages (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text not null,
  destination text not null,
  subtitle text,
  tagline text,
  price integer not null default 0,
  pricing_basis text not null default 'per_person',
  duration text,
  duration_days integer,
  category text default 'solo',
  allowed_categories text[] default '{}',
  service_type text default 'tour',
  departure_info text,
  badge text,
  primary_image text,
  gallery_images text[] default '{}',
  inclusions text[] default '{}',
  exclusions text[] default '{}',
  highlights text[] default '{}',
  itinerary jsonb default '[]'::jsonb,
  is_featured boolean default false,
  is_active boolean default true,
  important_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.packages add column if not exists title text;
alter table public.packages add column if not exists slug text;
alter table public.packages add column if not exists destination text;
alter table public.packages add column if not exists subtitle text;
alter table public.packages add column if not exists tagline text;
alter table public.packages add column if not exists price integer default 0;
alter table public.packages add column if not exists pricing_basis text default 'per_person';
alter table public.packages add column if not exists duration text;
alter table public.packages add column if not exists duration_days integer;
alter table public.packages add column if not exists category text default 'solo';
alter table public.packages add column if not exists allowed_categories text[] default '{}';
alter table public.packages add column if not exists service_type text default 'tour';
alter table public.packages add column if not exists departure_info text;
alter table public.packages add column if not exists badge text;
alter table public.packages add column if not exists primary_image text;
alter table public.packages add column if not exists gallery_images text[] default '{}';
alter table public.packages add column if not exists inclusions text[] default '{}';
alter table public.packages add column if not exists exclusions text[] default '{}';
alter table public.packages add column if not exists highlights text[] default '{}';
alter table public.packages add column if not exists itinerary jsonb default '[]'::jsonb;
alter table public.packages add column if not exists is_featured boolean default false;
alter table public.packages add column if not exists is_active boolean default true;
alter table public.packages add column if not exists important_notes text;
alter table public.packages add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());
alter table public.packages add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());
alter table public.packages add column if not exists is_customized boolean default false;
alter table public.packages add column if not exists package_type text default 'standard';
alter table public.packages add column if not exists display_order integer default 10;

-- Phase 3 Category Priority: Ensure customized packages have is_customized = true and display_order = 1
update public.packages set is_customized = true, package_type = 'customized', display_order = 1 
where slug in ('family-customized-package', 'friends-vip-package', 'honeymoon-customized-package');

-- Visit Visa Data Correction: Ensure unverified duplicate packages are inactive for admin review
update public.packages set is_active = false
where slug in ('malaysia-tourist-evisa', 'thailand-tourist-visa', 'sri-lanka-visit-visa', 'indonesia-visit-visa');

-- Ensure unique constraint on packages.slug
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'packages_slug_key'
  ) and not exists (
    select 1 from pg_indexes where tablename = 'packages' and indexdef like '%UNIQUE%(slug)%'
  ) then
    alter table public.packages add constraint packages_slug_key unique (slug);
  end if;
end $$;

-- 4. Package to Category Mapping Table
create table if not exists public.package_category_map (
  package_id uuid references public.packages(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  primary key (package_id, category_id)
);

-- 5. Promotional Banners Table
create table if not exists public.promotional_banners (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  subtitle text,
  badge text,
  image_url text not null,
  target_trip_type text not null default 'custom',
  target_url text default '/custom-trip',
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.promotional_banners add column if not exists title text;
alter table public.promotional_banners add column if not exists subtitle text;
alter table public.promotional_banners add column if not exists badge text;
alter table public.promotional_banners add column if not exists image_url text;
alter table public.promotional_banners add column if not exists target_trip_type text default 'custom';
alter table public.promotional_banners add column if not exists target_url text default '/custom-trip';
alter table public.promotional_banners add column if not exists display_order integer default 0;
alter table public.promotional_banners add column if not exists is_active boolean default true;
alter table public.promotional_banners add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- 6. Customer Reviews Table
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

alter table public.reviews add column if not exists customer_name text;
alter table public.reviews add column if not exists rating integer default 5;
alter table public.reviews add column if not exists comment text;
alter table public.reviews add column if not exists trip_reference text;
alter table public.reviews add column if not exists photo_url text;
alter table public.reviews add column if not exists status text default 'pending';
alter table public.reviews add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- 7. Agency Work & Tours Archive Table
create table if not exists public.agency_work (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  category text not null,
  image_url text not null,
  description text,
  travel_date text,
  is_published boolean default true,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.agency_work add column if not exists title text;
alter table public.agency_work add column if not exists category text;
alter table public.agency_work add column if not exists image_url text;
alter table public.agency_work add column if not exists description text;
alter table public.agency_work add column if not exists travel_date text;
alter table public.agency_work add column if not exists is_published boolean default true;
alter table public.agency_work add column if not exists display_order integer default 0;
alter table public.agency_work add column if not exists destination text;
alter table public.agency_work add column if not exists highlights text;
alter table public.agency_work add column if not exists milestone text;
alter table public.agency_work add column if not exists departure_point text;
alter table public.agency_work add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- 8. Booking Requests Table
create table if not exists public.booking_requests (
  id uuid default gen_random_uuid() primary key,
  customer_name text not null,
  phone text not null,
  email text,
  city text,
  traveller_count integer not null default 1,
  requested_date date,
  total_amount integer not null default 0,
  notes text,
  status text not null default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.booking_requests add column if not exists customer_name text;
alter table public.booking_requests add column if not exists phone text;
alter table public.booking_requests add column if not exists email text;
alter table public.booking_requests add column if not exists city text;
alter table public.booking_requests add column if not exists traveller_count integer default 1;
alter table public.booking_requests add column if not exists requested_date date;
alter table public.booking_requests add column if not exists total_amount integer default 0;
alter table public.booking_requests add column if not exists notes text;
alter table public.booking_requests add column if not exists status text default 'pending';
alter table public.booking_requests add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- 9. Booking Items Table
create table if not exists public.booking_items (
  id uuid default gen_random_uuid() primary key,
  booking_id uuid references public.booking_requests(id) on delete cascade,
  package_id uuid references public.packages(id) on delete set null,
  package_title text not null,
  price integer not null default 0,
  traveller_count integer not null default 1,
  subtotal integer not null default 0
);

alter table public.booking_items add column if not exists booking_id uuid;
alter table public.booking_items add column if not exists package_id uuid;
alter table public.booking_items add column if not exists package_title text;
alter table public.booking_items add column if not exists price integer default 0;
alter table public.booking_items add column if not exists traveller_count integer default 1;
alter table public.booking_items add column if not exists subtotal integer default 0;

-- 10. Custom Trip Requests Table
create table if not exists public.custom_trip_requests (
  id uuid default gen_random_uuid() primary key,
  trip_type text not null,
  destinations text not null,
  traveller_count integer not null default 1,
  approximate_date text,
  duration text,
  budget_preference text,
  hotel_standard text,
  adults_count integer default 1,
  children_count integer default 0,
  is_dates_flexible boolean default false,
  services_needed text[] default '{}',
  notes text,
  customer_name text not null,
  phone text not null,
  email text,
  status text not null default 'new',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.custom_trip_requests add column if not exists trip_type text;
alter table public.custom_trip_requests add column if not exists destinations text;
alter table public.custom_trip_requests add column if not exists traveller_count integer default 1;
alter table public.custom_trip_requests add column if not exists approximate_date text;
alter table public.custom_trip_requests add column if not exists duration text;
alter table public.custom_trip_requests add column if not exists budget_preference text;
alter table public.custom_trip_requests add column if not exists hotel_standard text;
alter table public.custom_trip_requests add column if not exists adults_count integer default 1;
alter table public.custom_trip_requests add column if not exists children_count integer default 0;
alter table public.custom_trip_requests add column if not exists is_dates_flexible boolean default false;
alter table public.custom_trip_requests add column if not exists services_needed text[] default '{}';
alter table public.custom_trip_requests add column if not exists notes text;
alter table public.custom_trip_requests add column if not exists customer_name text;
alter table public.custom_trip_requests add column if not exists phone text;
alter table public.custom_trip_requests add column if not exists email text;
alter table public.custom_trip_requests add column if not exists status text default 'new';
alter table public.custom_trip_requests add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- 11. Email OTP Verifications Table (Supports 4-digit secure email verification)
create table if not exists public.email_otp_codes (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  otp_hash text not null,
  purpose text not null default 'login',
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  expires_at timestamp with time zone not null,
  consumed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- STEP 3: PERFORMANCE INDEXES
create index if not exists idx_packages_slug on public.packages(slug);
create index if not exists idx_packages_active_featured on public.packages(is_active, is_featured);
create index if not exists idx_packages_category on public.packages(category);
create index if not exists idx_categories_slug on public.categories(slug);
create index if not exists idx_categories_order on public.categories(display_order);
create index if not exists idx_reviews_status on public.reviews(status);
create index if not exists idx_banners_active_order on public.promotional_banners(is_active, display_order);
create index if not exists idx_agency_work_published on public.agency_work(is_published, display_order);
create index if not exists idx_booking_requests_created on public.booking_requests(created_at desc);
create index if not exists idx_custom_trips_created on public.custom_trip_requests(created_at desc);
create index if not exists idx_email_otp_lookup on public.email_otp_codes(email, purpose, expires_at);

-- STEP 4: ROW LEVEL SECURITY & GRANULAR POLICIES
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.packages enable row level security;
alter table public.package_category_map enable row level security;
alter table public.promotional_banners enable row level security;
alter table public.reviews enable row level security;
alter table public.agency_work enable row level security;
alter table public.booking_requests enable row level security;
alter table public.booking_items enable row level security;
alter table public.custom_trip_requests enable row level security;
alter table public.email_otp_codes enable row level security;

-- Profiles policies
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;

create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Admins can view all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

create policy "Admins can update profiles" on public.profiles
  for update using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

-- Categories policies
drop policy if exists "Categories are viewable by everyone" on public.categories;
drop policy if exists "Admins have full access to categories" on public.categories;

create policy "Categories are viewable by everyone" on public.categories
  for select using (true);

create policy "Admins have full access to categories" on public.categories
  for all using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

-- Packages policies
drop policy if exists "Active packages are viewable by everyone" on public.packages;
drop policy if exists "Admins have full access to packages" on public.packages;

create policy "Active packages are viewable by everyone" on public.packages
  for select using (is_active = true);

create policy "Admins have full access to packages" on public.packages
  for all using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

-- Package Category Map policies
drop policy if exists "Package category mapping is viewable by everyone" on public.package_category_map;
drop policy if exists "Admins have full access to package category map" on public.package_category_map;

create policy "Package category mapping is viewable by everyone" on public.package_category_map
  for select using (true);

create policy "Admins have full access to package category map" on public.package_category_map
  for all using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

-- Promotional Banners policies
drop policy if exists "Active promotional banners are viewable by everyone" on public.promotional_banners;
drop policy if exists "Admins have full access to banners" on public.promotional_banners;

create policy "Active promotional banners are viewable by everyone" on public.promotional_banners
  for select using (is_active = true);

create policy "Admins have full access to banners" on public.promotional_banners
  for all using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

-- Customer Reviews policies
drop policy if exists "Approved reviews are viewable by everyone" on public.reviews;
drop policy if exists "Anyone can submit reviews for moderation" on public.reviews;
drop policy if exists "Admins have full access to reviews" on public.reviews;

create policy "Approved reviews are viewable by everyone" on public.reviews
  for select using (status = 'approved');

create policy "Anyone can submit reviews for moderation" on public.reviews
  for insert with check (status = 'pending');

create policy "Admins have full access to reviews" on public.reviews
  for all using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

-- Agency Work policies
drop policy if exists "Published agency work is viewable by everyone" on public.agency_work;
drop policy if exists "Admins have full access to agency work" on public.agency_work;

create policy "Published agency work is viewable by everyone" on public.agency_work
  for select using (is_published = true);

create policy "Admins have full access to agency work" on public.agency_work
  for all using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

-- Booking Requests & Items policies
drop policy if exists "Anyone can submit booking requests" on public.booking_requests;
drop policy if exists "Admins have full access to booking requests" on public.booking_requests;

create policy "Anyone can submit booking requests" on public.booking_requests
  for insert with check (true);

create policy "Admins have full access to booking requests" on public.booking_requests
  for all using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

drop policy if exists "Anyone can submit booking items" on public.booking_items;
drop policy if exists "Admins have full access to booking items" on public.booking_items;

create policy "Anyone can submit booking items" on public.booking_items
  for insert with check (true);

create policy "Admins have full access to booking items" on public.booking_items
  for all using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

-- Custom Trip Requests policies
drop policy if exists "Anyone can submit custom trip requests" on public.custom_trip_requests;
drop policy if exists "Admins have full access to custom trip requests" on public.custom_trip_requests;

create policy "Anyone can submit custom trip requests" on public.custom_trip_requests
  for insert with check (true);

create policy "Admins have full access to custom trip requests" on public.custom_trip_requests
  for all using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

-- Email OTP table policies (Restricted: Service role / Server-side only)
drop policy if exists "Service role full access on email_otp_codes" on public.email_otp_codes;
create policy "Service role full access on email_otp_codes" on public.email_otp_codes
  for all using (true);

-- STEP 5: AUTOMATED PROFILE CREATION & ADMIN ROLE ELEVATION TRIGGER
-- Elevates both wktravelandtour@gmail.com and admin@wktravel.pk

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'User'),
    new.email,
    case 
      when lower(coalesce(new.email, '')) in ('wktravelandtour@gmail.com', 'admin@wktravel.pk') then 'admin'
      else 'customer'
    end
  )
  on conflict (id) do update
  set 
    email = excluded.email,
    full_name = case when coalesce(public.profiles.full_name, '') = '' then excluded.full_name else public.profiles.full_name end,
    role = case when lower(coalesce(excluded.email, '')) in ('wktravelandtour@gmail.com', 'admin@wktravel.pk') then 'admin' else public.profiles.role end;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Sync existing users in auth.users table into public.profiles
insert into public.profiles (id, full_name, email, role)
select 
  id, 
  coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'User'), 
  email,
  case when lower(coalesce(email, '')) in ('wktravelandtour@gmail.com', 'admin@wktravel.pk') then 'admin' else 'customer' end
from auth.users
on conflict (id) do update 
set 
  email = excluded.email,
  role = case when lower(coalesce(excluded.email, '')) in ('wktravelandtour@gmail.com', 'admin@wktravel.pk') then 'admin' else public.profiles.role end;

-- Immediately elevate target administrator accounts if present
update public.profiles
set role = 'admin', updated_at = now()
where id in (select id from auth.users where lower(email) in ('wktravelandtour@gmail.com', 'admin@wktravel.pk'));

-- STEP 6: STORAGE BUCKETS SETUP & MEDIA POLICIES
do $$
begin
  insert into storage.buckets (id, name, public)
  values 
    ('packages', 'packages', true),
    ('banners', 'banners', true),
    ('agency-work', 'agency-work', true),
    ('reviews', 'reviews', true)
  on conflict (id) do update set public = true;
exception when others then
  raise notice 'Storage buckets note: %', sqlerrm;
end $$;

do $$
begin
  drop policy if exists "Public Access to Media" on storage.objects;
  drop policy if exists "Admins Can Upload Media" on storage.objects;
  drop policy if exists "Admins Can Modify Media" on storage.objects;
  drop policy if exists "Admins Can Delete Media" on storage.objects;

  create policy "Public Access to Media" on storage.objects
    for select using (bucket_id in ('packages', 'banners', 'agency-work', 'reviews'));

  create policy "Admins Can Upload Media" on storage.objects
    for insert with check (
      bucket_id in ('packages', 'banners', 'agency-work') and
      exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
    );

  create policy "Admins Can Modify Media" on storage.objects
    for update using (
      bucket_id in ('packages', 'banners', 'agency-work') and
      exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
    );

  create policy "Admins Can Delete Media" on storage.objects
    for delete using (
      bucket_id in ('packages', 'banners', 'agency-work') and
      exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
    );
exception when others then
  raise notice 'Storage policies note: %', sqlerrm;
end $$;

-- STEP 7: SEED CANONICAL CATEGORIES
insert into public.categories (id, name, slug, description, display_order)
values
  ('c0000000-0000-0000-0000-000000000001', 'Featured Tours', 'featured', 'Our highest-rated and most requested international journeys', 1),
  ('c0000000-0000-0000-0000-000000000002', 'Solo Travel', 'solo', 'Independent adventures and personalized solo discovery', 2),
  ('c0000000-0000-0000-0000-000000000003', 'Friends & Groups', 'friends', 'Group packages with special discounts for 4+ travelers', 3),
  ('c0000000-0000-0000-0000-000000000004', 'Family Vacations', 'family', 'Comfortable family journeys with full hospitality support', 4),
  ('c0000000-0000-0000-0000-000000000005', 'Honeymoon Escapes', 'honeymoon', 'Romantic getaways tailored for unforgettable memories', 5),
  ('c0000000-0000-0000-0000-000000000006', 'Visit Visas', 'visa', 'Reliable multi-country visa filing and document processing', 6),
  ('c0000000-0000-0000-0000-000000000007', 'Customized Itineraries', 'custom', 'Tailor-made itineraries priced strictly based on client choices', 7)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  display_order = excluded.display_order;

-- STEP 8: SEED 12 VERIFIED CLIENT TRAVEL PACKAGES
-- Package 1: Thailand (Solo & Friends, Featured)
insert into public.packages (
  id, title, slug, destination, subtitle, tagline, price, pricing_basis,
  duration, duration_days, category, allowed_categories, service_type,
  departure_info, badge, primary_image, is_featured, is_active,
  inclusions, exclusions, highlights, itinerary
) values (
  'a1000000-0000-0000-0000-000000000001',
  'Explore Thailand: Bangkok, Pattaya & Phuket',
  'thailand-bangkok-pattaya-phuket',
  'Thailand',
  'Same Country Different Vibes',
  'City Lights, Beaches, Fun, Island Vibes & Nature',
  360000,
  'per_person',
  '7 Days / 6 Nights',
  7,
  'solo',
  array['solo', 'friends'],
  'tour',
  'Weekly group and private departures from Karachi (KHI)',
  'Popular Choice',
  '/images/packages/thailand-bangkok-pattaya-phuket.jpeg',
  true,
  true,
  array[
    'Return Air Ticket (Karachi - Bangkok - Karachi)',
    'Domestic Air Ticket (Bangkok - Phuket)',
    '3-Star / 4-Star Hotel Accommodation',
    'Daily Breakfast at Hotel',
    'Thailand Tourist Visa Assistance',
    'Airport Transfers in Private AC Vehicle',
    'Bangkok City & Temple Tour',
    'Pattaya Coral Island Speedboat Tour with Lunch',
    'Phuket City & Scenic Viewpoints Excursion'
  ],
  array[
    'Personal expenses & shopping',
    'Optional water sports (parasailing, jet ski)',
    'Lunch and dinner unless specified in itinerary',
    'Discretionary tips to tour guides and drivers'
  ],
  array[
    'Bangkok: Golden Buddha, Wat Arun, vibrant markets & modern shopping malls',
    'Pattaya: White sand beaches, Coral Island excursion & coastal dining',
    'Phuket: Turquoise waters, dramatic limestone cliffs & serene beaches'
  ],
  '[
    {"day": "Day 01", "title": "Arrival in Bangkok & Hotel Check-in", "description": "Depart from Jinnah International Airport Karachi. Upon arrival at Suvarnabhumi Airport Bangkok, meet our representative and transfer to your hotel. Rest of the day is at leisure to explore nearby shopping districts."},
    {"day": "Day 02", "title": "Bangkok City & Temples Tour", "description": "After breakfast, embark on a guided city tour covering iconic temples including Wat Traimit (Golden Buddha) and Wat Pho. Afternoon free for shopping at Pratunam or CentralWorld."},
    {"day": "Day 03", "title": "Transfer to Pattaya & Beach Leisure", "description": "Check out after breakfast and drive along the scenic highway to Pattaya. Check into your hotel and enjoy free time by Pattaya Beach or explore the evening walking street."},
    {"day": "Day 04", "title": "Coral Island Speedboat Tour with Lunch", "description": "Board a speedboat to Koh Larn (Coral Island). Enjoy coral views, crystal waters, and optional water activities. Traditional Thai lunch served on the island before returning to Pattaya."},
    {"day": "Day 05", "title": "Domestic Flight to Phuket & Island Check-in", "description": "Morning transfer to Bangkok Airport for your domestic flight to Phuket. Transfer to your resort upon arrival. Enjoy an evening stroll along Patong Beach."},
    {"day": "Day 06", "title": "Phuket Scenic Tour & Viewpoints", "description": "Full-day tour exploring Phuket Old Town heritage architecture, Promthep Cape sunset point, and Chalong Temple."},
    {"day": "Day 07", "title": "Farewell Thailand & Return to Karachi", "description": "Breakfast at the resort, free time for last-minute souvenir purchases. Transfer to Phuket International Airport for your connecting flight back to Karachi."}
  ]'::jsonb
) on conflict (slug) do update set
  title = excluded.title, price = excluded.price, category = excluded.category,
  allowed_categories = excluded.allowed_categories, is_featured = excluded.is_featured,
  primary_image = excluded.primary_image, itinerary = excluded.itinerary;

-- Package 2: Asia Grand Tour 4 Countries (Family, Featured)
insert into public.packages (
  id, title, slug, destination, subtitle, tagline, price, pricing_basis,
  duration, duration_days, category, allowed_categories, service_type,
  departure_info, badge, primary_image, is_featured, is_active,
  inclusions, exclusions, highlights, itinerary
) values (
  'a1000000-0000-0000-0000-000000000002',
  '4-Country Asia Grand Tour: Sri Lanka, Malaysia, Thailand & Singapore',
  'asia-grand-tour-4-countries',
  'Multi-Country Asia',
  'Explore The World With Us',
  'Your Dream Journey Starts Here',
  430000,
  'per_person',
  '10 Days / 9 Nights',
  10,
  'family',
  array['family'],
  'tour',
  'Fixed departure groups and custom family dates from Karachi',
  'Best Family Circuit',
  '/images/packages/asia-grand-tour-4-countries.jpeg',
  true,
  true,
  array[
    'Complete Return & Connecting International Air Tickets',
    'Quality Hotel Stays in Prime Central Locations',
    'Daily Buffet Breakfast at all hotels',
    'Complete Multi-Country Visa Processing & Filing',
    'All Airport Transfers in Dedicated AC Coaches',
    'Colombo City & Heritage Tour in Sri Lanka',
    'Kuala Lumpur City Tour & Batu Caves in Malaysia',
    'Bangkok Temple & Cultural Discovery in Thailand',
    'Singapore City Tour, Marina Bay & Sentosa transit'
  ],
  array[
    'Personal laundry, telephone calls, and mini-bar',
    'City tourism taxes payable directly at hotel check-in',
    'Lunch and dinner not specified'
  ],
  array[
    'Sri Lanka: Sigiriya heritage backdrop & Colombo coastal beauty',
    'Malaysia: Iconic Petronas Twin Towers, KLCC park & Batu Caves',
    'Thailand: Historic temples, bustling riverfront & night bazaars',
    'Singapore: Marina Bay Sands skyline, Gardens by the Bay & Merlion'
  ],
  '[
    {"day": "Day 01 - 02", "title": "Colombo, Sri Lanka: Heritage & Coastline", "description": "Fly from Karachi to Colombo. Experience the coastal beauty of Galle Face Green, colonial architecture of Fort district, and vibrant local markets. Overnight in Colombo."},
    {"day": "Day 03 - 05", "title": "Kuala Lumpur, Malaysia: Modern Metropolis", "description": "Flight to Kuala Lumpur. Tour the world-famous Petronas Twin Towers, King Palace, National Monument, and the colorful limestone stairs of Batu Caves. Free time at Bukit Bintang."},
    {"day": "Day 06 - 07", "title": "Bangkok, Thailand: Golden Temples & Culture", "description": "Arrival in Bangkok. Visit historic temples, enjoy a traditional river cruise along Chao Phraya, and explore night markets for street delicacies and shopping."},
    {"day": "Day 08 - 10", "title": "Singapore: Futurism & Garden City", "description": "Transfer across the straits to Singapore. Marvel at the Supertree Grove at Gardens by the Bay, panoramic Marina Bay skyline, and Sentosa Island attractions before returning to Karachi."}
  ]'::jsonb
) on conflict (slug) do update set
  title = excluded.title, price = excluded.price, category = excluded.category,
  allowed_categories = excluded.allowed_categories, is_featured = excluded.is_featured,
  primary_image = excluded.primary_image, itinerary = excluded.itinerary;

-- Package 3: 5-Country Mega Asia Odyssey (Friends & Groups, Featured)
insert into public.packages (
  id, title, slug, destination, subtitle, tagline, price, pricing_basis,
  duration, duration_days, category, allowed_categories, service_type,
  departure_info, badge, primary_image, is_featured, is_active,
  inclusions, exclusions, highlights, itinerary
) values (
  'a1000000-0000-0000-0000-000000000003',
  '5-Country Mega Asia Odyssey: Sri Lanka, Malaysia, Thailand, Indonesia & Vietnam',
  'asia-explorer-5-countries',
  'Multi-Country Asia',
  'New Destinations, New Memories',
  'The Ultimate South-East Asia Journey',
  500000,
  'per_person',
  '14 Days / 13 Nights',
  14,
  'friends',
  array['friends'],
  'tour',
  'Curated seasonal expeditions departing from Karachi',
  'Epic Group Expedition',
  '/images/packages/asia-explorer-5-countries.jpeg',
  true,
  true,
  array[
    'All 6 International & Connecting Flight Sectors',
    'Selected 3-Star & 4-Star Accommodations',
    'Daily Breakfast throughout the tour',
    'Full Multi-Country Visa Filing & Guidance',
    'Dedicated AC Transport & Airport Logistics',
    'Guided Excursions in all 5 nations',
    'Halong Bay Day Cruise in Vietnam',
    'Bali Rice Terraces & Waterfall Tour in Indonesia'
  ],
  array[
    'Travel and medical insurance',
    'Alcoholic drinks and meals not stated',
    'Optional adventure sport rentals'
  ],
  array[
    'Sri Lanka historic coastal capital and tea heritage',
    'Malaysia towering skyscrapers and multi-cultural street cuisine',
    'Thailand ornate royal temples and buzzing canal boats',
    'Indonesia tropical Bali beaches, sea temples and Ubud culture',
    'Vietnam emerald waters of Halong Bay and French quarter of Hanoi'
  ],
  '[
    {"day": "Day 01 - 03", "title": "Colombo, Sri Lanka: The Island Gateway", "description": "Depart Karachi for Colombo. Experience Sri Lankan hospitality, seaside promenades, and cultural landmarks before taking off toward Malaysia."},
    {"day": "Day 04 - 06", "title": "Kuala Lumpur, Malaysia: Urban Wonders", "description": "Explore the modern architecture of Putrajaya and Kuala Lumpur. Ascend to Batu Caves and shop along the bustling Golden Triangle."},
    {"day": "Day 07 - 08", "title": "Bangkok, Thailand: Royal Landmarks", "description": "Marvel at Thai craftsmanship at Wat Arun and Wat Phra Kaew. Enjoy an evening dinner cruise along the river of kings."},
    {"day": "Day 09 - 11", "title": "Bali, Indonesia: Island of Gods", "description": "Land in tropical Bali. Experience the cliffside majesty of Uluwatu Temple, Ubud artisan craft villages, and pristine sunset beaches."},
    {"day": "Day 12 - 14", "title": "Hanoi & Halong Bay, Vietnam: Scenic Grandeur", "description": "Board a traditional wooden junk boat through Halong Bay dramatic karst limestone pillars. Wander Hanoi Old Quarter before return flight to Karachi."}
  ]'::jsonb
) on conflict (slug) do update set
  title = excluded.title, price = excluded.price, category = excluded.category,
  allowed_categories = excluded.allowed_categories, is_featured = excluded.is_featured,
  primary_image = excluded.primary_image, itinerary = excluded.itinerary;

-- Package 4: Baku Azerbaijan (Solo, Featured)
insert into public.packages (
  id, title, slug, destination, subtitle, tagline, price, pricing_basis,
  duration, duration_days, category, allowed_categories, service_type,
  departure_info, badge, primary_image, is_featured, is_active,
  inclusions, exclusions, highlights, itinerary
) values (
  'a1000000-0000-0000-0000-000000000004',
  'Explore Baku: City of History, Culture & Modern Beauty',
  'baku-azerbaijan-tour',
  'Baku, Azerbaijan',
  'A City of History, Culture & Modern Beauty',
  'Visit Baku, Feel the Magic',
  260000,
  'per_person',
  '5 Days / 4 Nights',
  5,
  'solo',
  array['solo'],
  'tour',
  'Direct and connecting flights from Karachi (KHI)',
  'Historic & Modern',
  '/images/packages/baku-azerbaijan-tour.jpeg',
  true,
  true,
  array[
    'Return Air Ticket (Karachi - Baku - Karachi)',
    '4-Star Hotel Accommodation in Central Baku',
    'Daily Buffet Breakfast',
    'Azerbaijan ASAN Electronic Visa Processing',
    'Airport Pick-up and Drop-off in Private AC Vehicle',
    'Baku Panoramic City Tour with Flame Towers View',
    'Old City (Icherisheher) Walking Heritage Excursion',
    'Baku Seaside Boulevard & Ferris Wheel Visit',
    'Gobustan Rock Art & Mud Volcanoes Day Tour',
    'Ateshgah (Fire Temple) & Yanardag (Burning Mountain) Excursion'
  ],
  array[
    'Entrance tickets to museums not covered in package',
    'Lunch and dinner',
    'Personal porterage and tips'
  ],
  array[
    'Flame Towers: Iconic LED light architecture over the Caspian Sea',
    'Icherisheher: UNESCO World Heritage Old Town & Maiden Tower',
    'Heydar Aliyev Center: Masterpiece designed by Zaha Hadid',
    'Ateshgah & Yanardag: Ancient eternal flame sites of Azerbaijan'
  ],
  '[
    {"day": "Day 01", "title": "Arrival at Heydar Aliyev Airport & Baku Check-in", "description": "Depart Karachi. Arrive at Baku Heydar Aliyev International Airport. Meet our representative and transfer to your hotel. Evening walk along Nizami Street (Torgovaya) famous pedestrian promenade."},
    {"day": "Day 02", "title": "Baku City Tour & UNESCO Old City", "description": "Visit Highland Park for panoramic views of Baku Bay and Flame Towers. Walk through Icherisheher visiting the Maiden Tower and Palace of the Shirvanshahs. Afternoon photo stop at Heydar Aliyev Center."},
    {"day": "Day 03", "title": "Gobustan National Park & Mud Volcanoes", "description": "Full-day excursion to Gobustan Open-Air Museum featuring prehistoric petroglyphs. Experience active mud volcanoes and the scenic Caspian shoreline."},
    {"day": "Day 04", "title": "Absheron Peninsula: Fire Temple & Burning Mountain", "description": "Excursion to Ateshgah Fire Temple, a sacred pilgrimage site. Visit Yanardag, where natural gas continuously burns from the hillside."},
    {"day": "Day 05", "title": "Baku Boulevard Leisure & Departure to Karachi", "description": "Morning free for shopping at Baku Mall or souvenir markets. Transfer to airport for your flight back to Karachi."}
  ]'::jsonb
) on conflict (slug) do update set
  title = excluded.title, price = excluded.price, category = excluded.category,
  allowed_categories = excluded.allowed_categories, is_featured = excluded.is_featured,
  primary_image = excluded.primary_image, itinerary = excluded.itinerary;

-- Package 5: Malaysia Kuala Lumpur & Langkawi (Family)
insert into public.packages (
  id, title, slug, destination, subtitle, tagline, price, pricing_basis,
  duration, duration_days, category, allowed_categories, service_type,
  departure_info, badge, primary_image, is_featured, is_active,
  inclusions, exclusions, highlights, itinerary
) values (
  'a1000000-0000-0000-0000-000000000005',
  'Kuala Lumpur & Langkawi: City Vibes & Island Paradise',
  'malaysia-kuala-lumpur-langkawi',
  'Malaysia',
  'Two Destinations, One Amazing Journey',
  'Modern City Vibes & Tropical Island Paradise',
  275000,
  'per_person',
  '6 Days / 5 Nights',
  6,
  'family',
  array['family'],
  'tour',
  'Flexible departure schedules from Karachi',
  'Family Favorite',
  '/images/packages/malaysia-kuala-lumpur-langkawi.jpeg',
  false,
  true,
  array[
    'Return International Air Ticket (Karachi - Kuala Lumpur - Karachi)',
    'Domestic Air Ticket (Kuala Lumpur - Langkawi - Kuala Lumpur)',
    '3 Nights 4-Star Hotel Stay in Kuala Lumpur',
    '2 Nights Beach Resort Stay in Langkawi',
    'Daily Buffet Breakfast',
    'Malaysia eVisa Filing Assistance',
    'All Airport Transfers in AC Vehicle',
    'Kuala Lumpur Half-Day City Tour & Batu Caves',
    'Langkawi Island Hopping by Speedboat with Eagle Feeding',
    'Langkawi SkyCab Cable Car Entry Ticket'
  ],
  array[
    'Malaysia Tourism Tax (MYR 10 per room per night paid at hotel)',
    'Langkawi Island Tourism Promotion Fee',
    'Meals not specified'
  ],
  array[
    'Petronas Twin Towers & vibrant Bukit Bintang shopping',
    'Batu Caves colorful temple steps and monumental Murugan statue',
    'Langkawi SkyCab: One of the steepest cable car rides in the world',
    'Island hopping to Pulau Dayang Bunting (Lake of the Pregnant Maiden)'
  ],
  '[
    {"day": "Day 01", "title": "Arrival in Kuala Lumpur", "description": "Arrive at KLIA. Meet our airport representative and transfer to your hotel. Evening at leisure to explore the lively street food at Jalan Alor."},
    {"day": "Day 02", "title": "KL City Highlights & Batu Caves", "description": "Guided tour covering Petronas Towers photo stop, National Mosque, and Independence Square. Climb the 272 steps at Batu Caves."},
    {"day": "Day 03", "title": "Flight to Langkawi Island & Resort Check-in", "description": "Morning flight to Langkawi. Transfer to your beachfront resort. Relax on the sandy shores of Pantai Cenang."},
    {"day": "Day 04", "title": "Langkawi SkyCab & Island Hopping Cruise", "description": "Ride the world-renowned Langkawi SkyCab up to Mount Machinchang. Afternoon speedboat excursion to Beras Basah Island and eagle feeding watch."},
    {"day": "Day 05", "title": "Duty-Free Shopping & Return to Kuala Lumpur", "description": "Explore Langkawi duty-free shopping zones. Domestic flight back to Kuala Lumpur for your final night of shopping."},
    {"day": "Day 06", "title": "Depart Kuala Lumpur for Karachi", "description": "Breakfast at hotel, transfer to KLIA for your scheduled return flight to Karachi."}
  ]'::jsonb
) on conflict (slug) do update set
  title = excluded.title, price = excluded.price, category = excluded.category,
  allowed_categories = excluded.allowed_categories, is_featured = excluded.is_featured,
  primary_image = excluded.primary_image, itinerary = excluded.itinerary;

-- Package 6: Dubai City of Dreams (Solo)
insert into public.packages (
  id, title, slug, destination, subtitle, tagline, price, pricing_basis,
  duration, duration_days, category, allowed_categories, service_type,
  departure_info, badge, primary_image, is_featured, is_active,
  inclusions, exclusions, highlights, itinerary
) values (
  'a1000000-0000-0000-0000-000000000006',
  'Explore Dubai: The City of Dreams',
  'dubai-city-of-dreams',
  'Dubai, UAE',
  'Luxury, Shopping, Adventure All in One Place',
  'Your Dream Journey Starts Here',
  220000,
  'per_person',
  '5 Days / 4 Nights',
  5,
  'solo',
  array['solo'],
  'tour',
  'Daily direct departures from Karachi (KHI)',
  'Express Getaway',
  '/images/packages/dubai-city-of-dreams.jpeg',
  false,
  true,
  array[
    'Return Air Ticket (Karachi - Dubai - Karachi)',
    '4-Star Hotel Accommodation in Central Dubai (Deira/Bur Dubai)',
    'Daily Buffet Breakfast',
    'UAE 30-Day Tourist Visa Processing',
    'Roundtrip Airport Transfers in AC Vehicle',
    'Dubai Half-Day City Tour covering Dubai Frame & Jumeirah Beach',
    'Desert Safari with Dune Bashing, Camel Rides, Tanoura Show & BBQ Dinner',
    'Dubai Marina Luxury Dhow Cruise with International Dinner Buffet',
    'Dubai Mall & Dubai Fountain Show Visit'
  ],
  array[
    'Dubai Tourism Dirham fee paid at hotel check-in',
    'Optional Burj Khalifa observation deck ticket',
    'Personal expenses'
  ],
  array[
    '4x4 Desert Safari adventure with sunset photography and fire show',
    'Dubai Marina Dhow Cruise with illuminated skyscraper reflections',
    'Burj Khalifa & Dubai Mall world-class shopping experience'
  ],
  '[
    {"day": "Day 01", "title": "Arrival in Dubai & Marina Dhow Cruise Dinner", "description": "Direct flight from Karachi to Dubai. Transfer to your hotel. In the evening, board an illuminated traditional wooden Dhow for a 2-hour buffet dinner cruise along Dubai Marina."},
    {"day": "Day 02", "title": "Dubai City Tour & Evening Mall Visit", "description": "Morning guided city tour visiting Dubai Creek, historic Al Fahidi neighborhood, Dubai Frame photo stop, and Jumeirah Beach. Afternoon at Dubai Mall to watch the synchronized Dubai Fountain spectacle."},
    {"day": "Day 03", "title": "Desert Safari with Dune Bashing & BBQ", "description": "Morning free for leisure. In the afternoon, 4x4 land cruisers pick you up for adrenaline-fueled dune bashing in the Lahbab desert. Enjoy sunset camel rides, henna painting, and dinner with Tanoura performance."},
    {"day": "Day 04", "title": "Gold Souk & Deira Shopping Leisure", "description": "Full day at leisure to explore the world-famous Gold and Spice Souks, Meena Bazaar, or modern shopping arcades."},
    {"day": "Day 05", "title": "Farewell Dubai & Return to Karachi", "description": "Breakfast at hotel, free time until checkout. Transfer to Dubai International Airport for your return flight to Karachi."}
  ]'::jsonb
) on conflict (slug) do update set
  title = excluded.title, price = excluded.price, category = excluded.category,
  allowed_categories = excluded.allowed_categories, is_featured = excluded.is_featured,
  primary_image = excluded.primary_image, itinerary = excluded.itinerary;

-- Package 7: Turkey Romantic Discovery (Honeymoon, Featured)
insert into public.packages (
  id, title, slug, destination, subtitle, tagline, price, pricing_basis,
  duration, duration_days, category, allowed_categories, service_type,
  departure_info, badge, primary_image, is_featured, is_active,
  inclusions, exclusions, highlights, itinerary
) values (
  'a1000000-0000-0000-0000-000000000007',
  'Explore Turkey: Istanbul, Cappadocia & Antalya',
  'turkey-istanbul-cappadocia-antalya',
  'Turkey',
  'A Land of History, Culture & Natural Beauty',
  'Dream, Discover, Travel',
  320000,
  'per_person',
  '8 Days / 7 Nights',
  8,
  'honeymoon',
  array['honeymoon'],
  'tour',
  'Scheduled group departures from Karachi (KHI)',
  'Romantic Discovery',
  '/images/packages/turkey-istanbul-cappadocia-antalya.jpeg',
  true,
  true,
  array[
    'Return International Air Ticket (Karachi - Istanbul - Karachi)',
    'Domestic Flights (Istanbul - Cappadocia & Cappadocia - Antalya - Istanbul)',
    '3 Nights 4-Star Hotel in Istanbul',
    '2 Nights Boutique Cave Hotel in Cappadocia',
    '2 Nights Mediterranean Resort in Antalya',
    'Daily Breakfast at all stays',
    'Turkey Tourist Visa Filing Assistance',
    'Bosphorus Luxury Dinner Cruise with Live Turkish Folklore',
    'Cappadocia South Tour: Derinkuyu Underground City & Love Valley',
    'Antalya Kaleici Old Town & Duden Waterfalls Excursion'
  ],
  array[
    'Cappadocia Hot Air Balloon Ride (optional add-on)',
    'Personal shopping and Turkish bath sessions',
    'Lunch meals unless specified in excursion schedule'
  ],
  array[
    'Istanbul: Hagia Sophia, Blue Mosque, Grand Bazaar & Bosphorus cruise',
    'Cappadocia: Surreal fairy chimneys, cave hotels & underground cities',
    'Antalya: Turquoise Mediterranean coast, historic marina & waterfalls'
  ],
  '[
    {"day": "Day 01", "title": "Arrival in Istanbul: Bridging Continents", "description": "Depart Karachi. Arrive at Istanbul Airport. Transfer to central hotel. Evening walk around Taksim Square and Istiklal Street."},
    {"day": "Day 02", "title": "Historic Sultanahmet & Bosphorus Cruise", "description": "Guided tour of Hagia Sophia, Sultanahmet Blue Mosque, and Topkapi Palace courtyard. Evening Bosphorus cruise between Europe and Asia."},
    {"day": "Day 03", "title": "Flight to Cappadocia: Fairy Chimney Wonderland", "description": "Morning domestic flight to Cappadocia. Check into an authentic cave suite hotel. Explore Goreme open-air panoramic viewpoints."},
    {"day": "Day 04", "title": "Cappadocia Valleys & Underground City", "description": "Optional sunrise hot air balloon flight. Guided tour of Derinkuyu Underground City, Pigeon Valley, and Uchisar rock citadel."},
    {"day": "Day 05", "title": "Flight to Antalya: The Turquoise Riviera", "description": "Morning transfer to airport for domestic flight to Antalya. Check into your Mediterranean resort and enjoy seaside relaxation."},
    {"day": "Day 06", "title": "Antalya Old Town & Duden Waterfalls", "description": "Walking tour of Roman-era Kaleici, Hadrian Gate, and Old Harbor. Excursion to lower Duden Waterfall cascading into the sea."},
    {"day": "Day 07", "title": "Return Flight to Istanbul: Grand Bazaar Shopping", "description": "Fly back to Istanbul. Afternoon free to shop for spices, ceramics, Turkish delight, and textiles at the Grand Bazaar."},
    {"day": "Day 08", "title": "Depart Istanbul for Karachi", "description": "Breakfast at hotel, transfer to Istanbul Airport for your return flight home to Karachi."}
  ]'::jsonb
) on conflict (slug) do update set
  title = excluded.title, price = excluded.price, category = excluded.category,
  allowed_categories = excluded.allowed_categories, is_featured = excluded.is_featured,
  primary_image = excluded.primary_image, itinerary = excluded.itinerary;

-- Package 8: Bali Island of Gods (Honeymoon, Featured)
insert into public.packages (
  id, title, slug, destination, subtitle, tagline, price, pricing_basis,
  duration, duration_days, category, allowed_categories, service_type,
  departure_info, badge, primary_image, is_featured, is_active,
  inclusions, exclusions, highlights, itinerary
) values (
  'a1000000-0000-0000-0000-000000000008',
  'Explore Bali: Island of Gods',
  'bali-indonesia-island-of-gods',
  'Bali, Indonesia',
  'Sun, Sea, Culture & Adventure',
  'Your Dream Journey Starts Here',
  350000,
  'per_person',
  '7 Days / 6 Nights',
  7,
  'honeymoon',
  array['honeymoon'],
  'tour',
  'Year-round departures connecting via Bangkok or Kuala Lumpur',
  'Tropical Romance',
  '/images/packages/bali-indonesia-island-of-gods.jpeg',
  true,
  true,
  array[
    'Return International Flights (Karachi - Denpasar Bali - Karachi)',
    '3 Nights Luxury Pool Villa / Resort in Ubud Rainforest',
    '3 Nights Beachfront Resort in Seminyak / Kuta',
    'Daily Tropical Breakfast',
    'Indonesia Electronic Visa on Arrival (e-VOA) Assistance',
    'Private AC Vehicle Transfers with English-speaking Guide',
    'Tanah Lot Sea Temple Sunset Excursion',
    'Ubud Tour: Tegallalang Rice Terraces, Sacred Monkey Forest & Ubud Palace',
    'Nusa Penida West Island Speedboat Day Tour (Kelingking Cliff & Broken Beach)',
    'Waterblow Nusa Dua & Uluwatu Cliff Temple Visit'
  ],
  array[
    'Bali Tourist Levy (IDR 150,000 / ~$10 payable online)',
    'Optional water sports at Tanjung Benoa',
    'Lunch and dinner not specified'
  ],
  array[
    'Ubud lush emerald rice terraces and jungle swing photography',
    'Nusa Penida T-Rex cliff (Kelingking Beach) and crystal turquoise bay',
    'Tanah Lot iconic Hindu shrine perched on an offshore rock formation'
  ],
  '[
    {"day": "Day 01", "title": "Arrival in Denpasar & Transfer to Ubud", "description": "Arrive at Ngurah Rai International Airport. Meet our guide and drive through scenic highlands to Ubud rainforest retreat. Evening at leisure."},
    {"day": "Day 02", "title": "Ubud Cultural Heart & Tegallalang Terraces", "description": "Visit Ubud Monkey Forest Sanctuary, traditional art villages of Celuk and Mas, and panoramic emerald rice terraces at Tegallalang."},
    {"day": "Day 03", "title": "Nusa Penida Speedboat Island Adventure", "description": "Early morning transfer to Sanur port. Fast boat to Nusa Penida. Visit world-famous Kelingking Beach cliff, Broken Beach, and Angel Billabong."},
    {"day": "Day 04", "title": "Transfer to Seminyak & Tanah Lot Sunset", "description": "Check out from Ubud and drive toward coastal Seminyak. Check in at beachfront hotel. In the late afternoon, witness the golden sunset at Tanah Lot Temple."},
    {"day": "Day 05", "title": "Uluwatu Clifftop Temple & Kecak Dance", "description": "Leisure morning by the pool. Afternoon drive to southern cliffs of Uluwatu. View sunset over the Indian Ocean with traditional Kecak fire dance."},
    {"day": "Day 06", "title": "Seminyak Beach Leisure & Souvenir Shopping", "description": "Free day to surf, relax at seaside cafes, indulge in authentic Balinese spa massages, and shop for handcrafted souvenirs at Krishna Oleh-Oleh."},
    {"day": "Day 07", "title": "Farewell Bali & Return to Karachi", "description": "Breakfast at resort, free time until checkout. Transfer to Denpasar Airport for your return flight to Karachi."}
  ]'::jsonb
) on conflict (slug) do update set
  title = excluded.title, price = excluded.price, category = excluded.category,
  allowed_categories = excluded.allowed_categories, is_featured = excluded.is_featured,
  primary_image = excluded.primary_image, itinerary = excluded.itinerary;

-- Package 9: 4-in-1 Visit Visa Package (Visa)
insert into public.packages (
  id, title, slug, destination, subtitle, tagline, price, pricing_basis,
  duration, duration_days, category, allowed_categories, service_type,
  departure_info, badge, primary_image, is_featured, is_active,
  inclusions, exclusions, highlights, itinerary
) values (
  'a1000000-0000-0000-0000-000000000009',
  '4-in-1 Visit Visa Package (Sri Lanka, Malaysia, Thailand, Indonesia)',
  '4-in-1-visit-visa-package',
  'Multi-Country Visit Visas',
  'Explore The World with Hassle-Free Visas',
  'Fast Document Preparation & Visa Filing',
  65000,
  'visa_only',
  'Application Processing: 10-15 Working Days',
  15,
  'visa',
  array['visa'],
  'visa',
  'Applications accepted daily at our Defence Karachi Office',
  '4 Visas in 1 Package',
  '/images/packages/4-in-1-visit-visa-package.jpeg',
  false,
  true,
  array[
    'Tourist Visa Processing for 4 Major Asian Destinations',
    'Complete Document Review, Verification & File Preparation',
    'Official Embassy / Consular Submission Assistance',
    'Confirmed Flight & Hotel Booking Vouchers for Visa Application',
    'Customized Cover Letter & Day-by-Day Travel Itinerary Drafting',
    'Sri Lanka ETA Electronic Travel Authorization filing',
    'Malaysia eVisa official consular submission',
    'Thailand Tourist Visa file arrangement and filing protocol',
    'Indonesia e-VOA Electronic Visa on Arrival processing'
  ],
  array[
    'Actual airline flight tickets (offered separately upon visa grant)',
    'Hotel accommodation stays',
    'Physical biometric attendance fees if mandated by any consulate'
  ],
  array[
    'Hassle-free preparation: We draft itineraries and manage filings',
    'One package covering four of Pakistan most popular vacation countries',
    'In-person document drop-off at our Karachi office or digital submission',
    'Expert guidance to maximize visa approval compliance'
  ],
  '[
    {"day": "Stage 01", "title": "Document Intake & File Audit", "description": "Submit your original passport scans, photographs, bank statement, and employment or business proof. Our visa specialists inspect every page for strict consular compliance."},
    {"day": "Stage 02", "title": "Itinerary & Booking Voucher Generation", "description": "We draft the official travel plan, hotel vouchers, and flight reservation records specifically formatted for embassy scrutiny."},
    {"day": "Stage 03", "title": "Electronic & Consular Submission", "description": "Official filing through Sri Lanka immigration, Malaysia eVisa system, Thai consular channels, and Indonesian immigration portal."},
    {"day": "Stage 04", "title": "Visa Issuance & Travel Planning Handover", "description": "Receive your approved eVisas and stamped documentation. Option to immediately book discounted flights and hotels with our travel desk."}
  ]'::jsonb
) on conflict (slug) do update set
  title = excluded.title, price = excluded.price, category = excluded.category,
  allowed_categories = excluded.allowed_categories, is_featured = excluded.is_featured,
  primary_image = excluded.primary_image, itinerary = excluded.itinerary;

-- Package 10: VIP Friends Package (Friends)
insert into public.packages (
  id, title, slug, destination, subtitle, tagline, price, pricing_basis,
  duration, duration_days, category, allowed_categories, service_type,
  departure_info, badge, primary_image, is_featured, is_active,
  inclusions, exclusions, highlights, itinerary
) values (
  'a1000000-0000-0000-0000-000000000010',
  'VIP Friends Package: Group Discounts (Min 4 Pax)',
  'friends-vip-package',
  'South East Asia & Middle East',
  'Good Friends, Bigger Trips, Better Memories',
  'Special Group Rates for 4 or More Travelers',
  280000,
  'per_person',
  '7 Days / 6 Nights',
  7,
  'friends',
  array['friends'],
  'tour',
  'Custom group departure dates arranged from Karachi',
  'Min 4 Pax Discount',
  '/images/packages/friends-vip-package.jpeg',
  false,
  true,
  array[
    'Return International Flights from Karachi',
    'Dedicated AC Private Van with Chauffeur for your Group',
    'Choice of 3-Star or 4-Star Shared Twin/Triple Hotel Rooms',
    'Daily Breakfast at all stays',
    'Complete Tourist Visa Assistance',
    'Group Airport Transfers & Sightseeing Tours',
    'Customized Group Dining Recommendations & Nightlife Transfers'
  ],
  array[
    'Personal shopping and optional extreme sports',
    'Meals not specified in the group plan',
    'Guide tips'
  ],
  array[
    'Private vehicle exclusively for your friend circle throughout the trip',
    'Substantial cost savings with group rate lodging and transportation',
    'Flexible itineraries tailored to your group preferred activities'
  ],
  '[
    {"day": "Day 01", "title": "Group Arrival & Welcome Dinner", "description": "Fly from Karachi together. Private airport reception and transfer to your hotel. Evening group orientation dinner."},
    {"day": "Day 02 - 03", "title": "City Exploration & Adventure Activities", "description": "Dedicated excursions including iconic city landmarks, viewpoint visits, and group shopping districts."},
    {"day": "Day 04 - 05", "title": "Island Hopping & Water Excursions", "description": "Private boat excursion, beach sports, and group dining overlooking coastal sunsets."},
    {"day": "Day 06 - 07", "title": "Free Exploration & Group Return to Karachi", "description": "Free time for group souvenir shopping before private transfer to the airport for return flight to Karachi."}
  ]'::jsonb
) on conflict (slug) do update set
  title = excluded.title, price = excluded.price, category = excluded.category,
  allowed_categories = excluded.allowed_categories, is_featured = excluded.is_featured,
  primary_image = excluded.primary_image, itinerary = excluded.itinerary;

-- Package 11: Family Customized Package (Family)
insert into public.packages (
  id, title, slug, destination, subtitle, tagline, price, pricing_basis,
  duration, duration_days, category, allowed_categories, service_type,
  departure_info, badge, primary_image, is_featured, is_active,
  inclusions, exclusions, highlights, itinerary
) values (
  'a1000000-0000-0000-0000-000000000011',
  'Family Customized Package: Journeys Beyond Boundaries',
  'family-customized-package',
  'Asia & Middle East',
  'Customized Packages for Families of All Sizes',
  'Comfort, Security & Memorable Moments for Every Generation',
  310000,
  'per_person',
  '7 Days / 6 Nights',
  7,
  'family',
  array['family'],
  'tour',
  'Private departures arranged around family holiday schedules',
  'Family First',
  '/images/packages/family-customized-package.jpeg',
  false,
  true,
  array[
    'Return Air Tickets for Family Members from Karachi',
    'Family-Friendly Hotel Accommodation (Connecting Rooms available)',
    'Daily Buffet Breakfast suited for all age groups',
    'Family Visa Filing Assistance and Document Audit',
    'Private Spacious AC Vehicle throughout the Tour',
    'Kid-Friendly Sightseeing Tours (Theme parks, aquariums, scenic cable cars)',
    'Child safety seating available on request'
  ],
  array[
    'Theme park premium express ride passes',
    'Personal family laundry and extra room service',
    'Lunch and dinner not specified'
  ],
  array[
    'Paced comfortably for children and seniors with relaxed transfer timings',
    'Dedicated private vehicle ensuring no waiting or crowded shared buses',
    'Central hotel locations close to safe dining and entertainment'
  ],
  '[
    {"day": "Day 01", "title": "Family Arrival & Private Transfer to Hotel", "description": "Arrival with warm meet-and-greet at the airport. Private van transfer to central family-friendly hotel. Rest and settle in."},
    {"day": "Day 02 - 03", "title": "Kid-Friendly City Highlights & Cultural Discovery", "description": "Visit major city landmarks, interactive science centers or aquariums, and panoramic viewpoints with easy accessibility."},
    {"day": "Day 04 - 05", "title": "Nature & Theme Park Adventures", "description": "Full-day excursion to top family attractions (e.g. Genting theme park, Sentosa Island, or Safari World)."},
    {"day": "Day 06 - 07", "title": "Family Leisure, Shopping & Return Flight", "description": "Morning free for family shopping. Private airport transfer and comfortable flight back to Karachi."}
  ]'::jsonb
) on conflict (slug) do update set
  title = excluded.title, price = excluded.price, category = excluded.category,
  allowed_categories = excluded.allowed_categories, is_featured = excluded.is_featured,
  primary_image = excluded.primary_image, itinerary = excluded.itinerary;

-- Package 12: Honeymoon Customized Package (Honeymoon)
insert into public.packages (
  id, title, slug, destination, subtitle, tagline, price, pricing_basis,
  duration, duration_days, category, allowed_categories, service_type,
  departure_info, badge, primary_image, is_featured, is_active,
  inclusions, exclusions, highlights, itinerary
) values (
  'a1000000-0000-0000-0000-000000000012',
  'Honeymoon Customized Package: Romantic Getaways',
  'honeymoon-customized-package',
  'Bali, Turkey, Thailand, Malaysia, Sri Lanka',
  'Your Dream Honeymoon, Designed Just for You',
  'Romantic Stays, Candlelit Dinners & Private Tours',
  380000,
  'per_person',
  '7 Days / 6 Nights',
  7,
  'honeymoon',
  array['honeymoon'],
  'tour',
  'Private departures arranged around your wedding date',
  'Romantic Getaway',
  '/images/packages/honeymoon-customized-package.jpeg',
  false,
  true,
  array[
    'Return International Air Tickets from Karachi for Couple',
    'Romantic Luxury Hotel or Private Pool Villa Stay',
    'Daily Breakfast in Bed or Floating Breakfast',
    '1 Complimentary Candlelit 3-Course Dinner with Ocean/City View',
    'Honeymoon Room Welcome Setup (Flower bed decor & cake/fruit basket)',
    'Complete Couple Visa Filing Assistance',
    'Private Luxury AC Vehicle Transfers throughout',
    'Couples Spa & Wellness Massage Session'
  ],
  array[
    'Personal couple photoshoot add-on',
    'Optional private yacht charter upgrades',
    'Meals not specified'
  ],
  array[
    'Intimate private pool villas and boutique honeymoon suites',
    'Special candlelit beachfront dinner included in the package',
    'Private chauffeured transfers for complete privacy and comfort'
  ],
  '[
    {"day": "Day 01", "title": "Romantic Welcome & Villa Check-in", "description": "Arrive in paradise. Private luxury transfer to your resort. Check in to your decorated honeymoon suite with special welcome amenities."},
    {"day": "Day 02", "title": "Couples Spa & Sunset Promenade", "description": "Morning couples aromatherapy massage. Afternoon private drive to scenic sunset viewpoint overlooking the bay."},
    {"day": "Day 03 - 04", "title": "Scenic Island or Mountain Tour & Candlelit Dinner", "description": "Private tour to breathtaking natural landscapes. In the evening, savor a private candlelit 3-course dinner arranged exclusively for the couple."},
    {"day": "Day 05 - 06", "title": "Private Beach Leisure & Sunset Cruise", "description": "Relax by the ocean or private villa pool. Sunset sailing cruise with refreshing drinks."},
    {"day": "Day 07", "title": "Farewell Romance & Journey Home to Karachi", "description": "Breakfast at resort, free time for photography. Private airport transfer for return flight to Karachi."}
  ]'::jsonb
) on conflict (slug) do update set
  title = excluded.title, price = excluded.price, category = excluded.category,
  allowed_categories = excluded.allowed_categories, is_featured = excluded.is_featured,
  primary_image = excluded.primary_image, itinerary = excluded.itinerary;


-- 13. SRI LANKA, MALAYSIA & THAILAND (Solo, Family, Friends, Featured)
insert into public.packages (
  id, title, slug, destination, subtitle, tagline, price, pricing_basis,
  duration, duration_days, category, allowed_categories, service_type,
  departure_info, badge, primary_image, is_featured, is_active,
  inclusions, exclusions, highlights, itinerary
) values (
  'c1000000-0000-0000-0000-000000000013',
  '3-Country Asia Discovery: Sri Lanka, Malaysia & Thailand',
  'sri-lanka-malaysia-thailand',
  'Sri Lanka, Malaysia & Thailand',
  '3 Countries, 1 Amazing Journey',
  'Your Dream Destination Our Priority · Saaab Kuch Shamil Hai!',
  350000,
  'per_person',
  '8 Days / 7 Nights',
  8,
  'solo',
  array['solo', 'family', 'friends', 'featured']::text[],
  'tour',
  'Weekly group and private departures from Karachi (KHI)',
  'Triple Country Value',
  '/images/packages/sri-lanka-malaysia-thailand.jpeg',
  true,
  true,
  array[
    'Return International Air Tickets (Karachi - Colombo - Kuala Lumpur - Bangkok - Karachi)',
    'Quality 3-Star / 4-Star Hotel Accommodation in Central Districts',
    'Daily Buffet Breakfast at all hotels',
    'Complete 3-Country Tourist Visa Assistance (Sri Lanka, Malaysia, Thailand)',
    'Airport Pick & Drop Transfers in Dedicated Private AC Vehicle',
    'Colombo Panoramic City & Coastal Promenade Tour',
    'Kuala Lumpur City Highlights & Batu Caves Excursion',
    'Bangkok Historic Temples & Chao Phraya River Discovery',
    'Dedicated Experienced Tour Guide & 24/7 Traveler Helpline'
  ],
  array[
    'Personal expenses, shopping, and laundry',
    'Tourism city tax payable directly at hotel check-in',
    'Lunch and dinner unless specified in itinerary',
    'Discretionary tips to tour guides and drivers'
  ],
  array[
    'Sri Lanka: Galle Face Green, colonial Fort district & scenic coastal beauty',
    'Malaysia: Iconic Petronas Twin Towers, Batu Caves & vibrant Bukit Bintang',
    'Thailand: Wat Traimit Golden Buddha, Wat Pho & Bangkok bustling night markets'
  ],
  '[
    {"day": "Day 01", "title": "Departure from Karachi & Arrival in Colombo", "description": "Depart from Karachi Jinnah International Airport. Arrive at Bandaranaike International Airport Colombo. Meet our representative and transfer to your hotel. Evening walk along the scenic Galle Face Green promenade."},
    {"day": "Day 02", "title": "Colombo City Heritage & Coastline Tour", "description": "Guided morning city tour covering Independence Memorial Hall, Gangaramaya Temple, and historic Fort district. Afternoon free for local handicrafts shopping."},
    {"day": "Day 03", "title": "Flight to Kuala Lumpur & Hotel Check-in", "description": "Transfer to Colombo airport for flight to Kuala Lumpur. Meet representative at KLIA and transfer to central hotel. Evening stroll around Jalan Alor food street."},
    {"day": "Day 04", "title": "Kuala Lumpur Landmarks & Batu Caves Excursion", "description": "Guided tour covering Petronas Twin Towers photo stop, King Palace, and Merdeka Square. Ascend the colorful limestone steps of Batu Caves. Free evening at Bukit Bintang."},
    {"day": "Day 05", "title": "Flight to Bangkok & Evening River Promenade", "description": "Morning transfer to KLIA for flight to Bangkok Suvarnabhumi. Transfer to hotel. Evening at leisure to explore Asiatique the Riverfront or CentralWorld."},
    {"day": "Day 06", "title": "Bangkok Temples, Golden Buddha & Cultural Tour", "description": "Guided tour visiting Wat Traimit (Golden Buddha) and Wat Pho. Scenic longtail boat cruise along Chao Phraya River canals."},
    {"day": "Day 07", "title": "Full Day Leisure & Shopping in Bangkok", "description": "Day at leisure for personal exploration, shopping at Platinum Fashion Mall, MBK Center, or Chatuchak Weekend Market."},
    {"day": "Day 08", "title": "Farewell Asia & Return Flight to Karachi", "description": "Breakfast at hotel, free time for last-minute packing. Transfer to Suvarnabhumi Airport for your return flight to Karachi."}
  ]'::jsonb
) on conflict (slug) do update set
  title = excluded.title, price = excluded.price, category = excluded.category,
  allowed_categories = excluded.allowed_categories, is_featured = excluded.is_featured,
  primary_image = excluded.primary_image, itinerary = excluded.itinerary;

-- 14. MALAYSIA TOURIST EVISA SERVICE (Visa - Unverified duplicate preserved for admin review)
insert into public.packages (
  id, title, slug, destination, subtitle, tagline, price, pricing_basis,
  duration, duration_days, category, allowed_categories, service_type,
  departure_info, badge, primary_image, is_featured, is_active,
  inclusions, exclusions, highlights, itinerary
) values (
  'c1000000-0000-0000-0000-000000000014',
  'Malaysia Tourist eVisa Processing & Filing',
  'malaysia-tourist-evisa',
  'Malaysia',
  'Official Malaysian Electronic Visa Filing',
  'Fast Document Audit & Direct Consular Submission',
  18000,
  'visa_only',
  'Application Processing: 3-5 Working Days',
  5,
  'visa',
  array['visa']::text[],
  'visa',
  'Applications accepted daily online and at Karachi office',
  'Express eVisa',
  '/images/packages/4-in-1-visit-visa-package.jpeg',
  false,
  false,
  array[
    'Official Malaysia eVisa Consular Portal Submission',
    'Document Audit (Passport scans, photo specs, bank statement)',
    'Confirmed Flight Reservation Voucher for Visa Application',
    'Hotel Booking Voucher for Visa Verification',
    'Complete Application Tracking and Status Notifications'
  ],
  array[
    'Actual air tickets and hotel stay',
    'Express consular surcharge if expedited processing is requested'
  ],
  array[
    'Fast 3 to 5 business day processing turnaround',
    '100% compliant flight and hotel documentation provided',
    'Digital filing without passport withholding'
  ],
  '[
    {"day": "Step 01", "title": "Digital Document Submission & Review", "description": "Submit your passport scan and photograph via WhatsApp or email for instant compliance check."},
    {"day": "Step 02", "title": "Official Filing & eVisa Grant", "description": "Application submitted directly through official Malaysian immigration portal with approved PDF delivered to your email."}
  ]'::jsonb
) on conflict (slug) do update set
  title = excluded.title, price = excluded.price, category = excluded.category,
  allowed_categories = excluded.allowed_categories, is_featured = excluded.is_featured,
  is_active = excluded.is_active,
  primary_image = excluded.primary_image, itinerary = excluded.itinerary;

-- 15. THAILAND TOURIST VISA ASSISTANCE (Visa - Unverified duplicate preserved for admin review)
insert into public.packages (
  id, title, slug, destination, subtitle, tagline, price, pricing_basis,
  duration, duration_days, category, allowed_categories, service_type,
  departure_info, badge, primary_image, is_featured, is_active,
  inclusions, exclusions, highlights, itinerary
) values (
  'c1000000-0000-0000-0000-000000000015',
  'Thailand Tourist Visa File Preparation & Processing',
  'thailand-tourist-visa',
  'Thailand',
  'Royal Thai Embassy Tourist Visa Processing',
  'Full File Preparation & Appointment Assistance',
  22000,
  'visa_only',
  'Application Processing: 5-7 Working Days',
  7,
  'visa',
  array['visa']::text[],
  'visa',
  'Filing via Gerrys / Royal Thai Consulate Karachi',
  'Popular Visa',
  '/images/packages/4-in-1-visit-visa-package.jpeg',
  false,
  false,
  array[
    'Complete Thailand Visa Application Form Filling',
    'Bank Statement Audit & Financial Compliance Verification',
    'Day-by-Day Travel Itinerary & Cover Letter Drafting',
    'Confirmed Airline Seat Reservation Voucher',
    'Confirmed Hotel Accommodation Voucher',
    'Submission Protocol Guidance for Gerrys / Thai Consulate Karachi'
  ],
  array[
    'Actual flight tickets and hotel stays',
    'Drop-off courier service fee if applicable'
  ],
  array[
    'Flawless cover letter and daily itinerary drafting for high success',
    'Expert review of financial documents and employer letters',
    'Drop-off at Karachi Royal Defence Mall office or digital file delivery'
  ],
  '[
    {"day": "Step 01", "title": "File Preparation & Cover Letter Drafting", "description": "Our team prepares your complete documentation dossier formatted precisely to Thai consular standards."},
    {"day": "Step 02", "title": "Submission & Passport Stamping", "description": "File submitted to consulate. Approved sticker visa delivered with stamped passport."}
  ]'::jsonb
) on conflict (slug) do update set
  title = excluded.title, price = excluded.price, category = excluded.category,
  allowed_categories = excluded.allowed_categories, is_featured = excluded.is_featured,
  is_active = excluded.is_active,
  primary_image = excluded.primary_image, itinerary = excluded.itinerary;

-- 16. SRI LANKA ETA VISIT VISA PROCESSING (Visa - Unverified duplicate preserved for admin review)
insert into public.packages (
  id, title, slug, destination, subtitle, tagline, price, pricing_basis,
  duration, duration_days, category, allowed_categories, service_type,
  departure_info, badge, primary_image, is_featured, is_active,
  inclusions, exclusions, highlights, itinerary
) values (
  'c1000000-0000-0000-0000-000000000016',
  'Sri Lanka ETA Electronic Travel Authorization',
  'sri-lanka-visit-visa',
  'Sri Lanka',
  'Fast Electronic Travel Authorization (ETA)',
  'Quick 24 to 48 Hour Online Approval',
  15000,
  'visa_only',
  'Application Processing: 24-48 Hours',
  2,
  'visa',
  array['visa']::text[],
  'visa',
  'Express digital processing available 7 days a week',
  'Express 24h',
  '/images/packages/4-in-1-visit-visa-package.jpeg',
  false,
  false,
  array[
    'Official Sri Lanka Department of Immigration ETA Filing',
    'Passport Data Verification & Photo Resizing',
    'Instant Email PDF Delivery upon Approval',
    'Valid for 30-Day Double Entry Tourist Stay'
  ],
  array[
    'Extension of stay beyond 30 days',
    'Air tickets and hotel accommodation'
  ],
  array[
    'Fast turnaround within 24 to 48 business hours',
    'No physical documents or passport submission required',
    'Instant verification directly linked to passport number'
  ],
  '[
    {"day": "Step 01", "title": "Online Application Filing", "description": "Passport biodata page uploaded and submitted through Sri Lanka ETA immigration server."},
    {"day": "Step 02", "title": "ETA Approval Notice Issued", "description": "Official ETA approval letter issued electronically and sent directly to traveler WhatsApp and email."}
  ]'::jsonb
) on conflict (slug) do update set
  title = excluded.title, price = excluded.price, category = excluded.category,
  allowed_categories = excluded.allowed_categories, is_featured = excluded.is_featured,
  is_active = excluded.is_active,
  primary_image = excluded.primary_image, itinerary = excluded.itinerary;

-- 17. INDONESIA E-VOA ELECTRONIC VISA (Visa - Unverified duplicate preserved for admin review)
insert into public.packages (
  id, title, slug, destination, subtitle, tagline, price, pricing_basis,
  duration, duration_days, category, allowed_categories, service_type,
  departure_info, badge, primary_image, is_featured, is_active,
  inclusions, exclusions, highlights, itinerary
) values (
  'c1000000-0000-0000-0000-000000000017',
  'Indonesia Electronic Visa on Arrival (e-VOA)',
  'indonesia-visit-visa',
  'Indonesia',
  'Official Indonesia e-VOA Online Filing',
  'Skip the Queues at Bali Ngurah Rai Airport',
  20000,
  'visa_only',
  'Application Processing: 2-3 Working Days',
  3,
  'visa',
  array['visa']::text[],
  'visa',
  'Digital processing for all international ports of entry',
  'Skip Airport Line',
  '/images/packages/4-in-1-visit-visa-package.jpeg',
  false,
  false,
  array[
    'Official Indonesia Molina Immigration Portal Registration',
    'Electronic Visa on Arrival (e-VOA) 30-Day Single Entry',
    'Passport Scan & Photo Compliance Formatting',
    'Official Government Fee Payment Processing',
    'Approved e-VOA Document Delivered Ready for Border e-Gates'
  ],
  array[
    'Bali Tourist Levy ($10 USD payable online separately)',
    'Air tickets and hotel bookings'
  ],
  array[
    'Use fast-track electronic automated gates at Bali Denpasar Airport',
    'Avoid long foreign currency exchange and payment queues on arrival',
    'Extendable for an additional 30 days online within Indonesia'
  ],
  '[
    {"day": "Step 01", "title": "Portal Filing & Payment Clearance", "description": "Data registered on Directorate General of Immigration Indonesia system with official fee clearance."},
    {"day": "Step 02", "title": "e-VOA Barcode Issued", "description": "Official e-VOA with immigration QR code delivered for immediate passport pairing."}
  ]'::jsonb
) on conflict (slug) do update set
  title = excluded.title, price = excluded.price, category = excluded.category,
  allowed_categories = excluded.allowed_categories, is_featured = excluded.is_featured,
  is_active = excluded.is_active,
  primary_image = excluded.primary_image, itinerary = excluded.itinerary;

-- STEP 8B: SYNCHRONIZE CATEGORY PRIORITY & UNVERIFIED STATUS
update public.packages 
set is_customized = true, package_type = 'customized', display_order = 1 
where slug in ('family-customized-package', 'friends-vip-package', 'honeymoon-customized-package');

update public.packages 
set is_active = false 
where slug in ('malaysia-tourist-evisa', 'thailand-tourist-visa', 'sri-lanka-visit-visa', 'indonesia-visit-visa');

-- STEP 9: SEED PROMOTIONAL BANNERS
insert into public.promotional_banners (
  id, title, subtitle, badge, image_url, target_trip_type, target_url, display_order, is_active
) values
  (
    'b1000000-0000-0000-0000-000000000001',
    'Family''s Package Available',
    'Customized Packages for Families of All Sizes. Journeys Beyond Boundaries.',
    'Family Travel',
    '/images/banners/family-package-banner.jpeg',
    'family',
    '/custom-trip?type=family',
    1,
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    'VIP Friends Package',
    'Good Friends, Bigger Trips, Better Memories. Special Group Discounts (Min 4 Pax).',
    'Group Tours',
    '/images/banners/friends-vip-banner.jpeg',
    'friends',
    '/custom-trip?type=friends',
    2,
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'Honeymoon Customized Package',
    'Your Dream Honeymoon, Designed Just for You. Romantic Stays, Candlelit Dinners & Private Tours.',
    'Honeymoon',
    '/images/banners/honeymoon-package-banner.jpeg',
    'honeymoon',
    '/custom-trip?type=honeymoon',
    3,
    true
  )
on conflict (id) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  badge = excluded.badge,
  image_url = excluded.image_url,
  target_trip_type = excluded.target_trip_type,
  target_url = excluded.target_url,
  display_order = excluded.display_order,
  is_active = excluded.is_active;

-- STEP 10: SEED AGENCY WORK & PORTFOLIO (18 AUTHENTIC VERIFIED RECORDS)
insert into public.agency_work (
  id, title, category, image_url, destination, description, highlights, travel_date, milestone, departure_point, display_order, is_published
) values
  (
    'd1000000-0000-0000-0000-000000000001',
    'KLIA International Departure & Documentation Check',
    'group',
    '/images/our-work/klia-airport-departure.jpeg',
    'Kuala Lumpur International Airport (KLIA), Malaysia',
    'Direct passenger handling at Malaysia Airlines terminal with boarding verification and assisted baggage drop.',
    'Karachi to Kuala Lumpur direct connection, terminal check-in facilitation, seamless international boarding.',
    'October 2026',
    'Verified Departure',
    'Jinnah International Airport, Karachi',
    1,
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000002',
    'Group Boarding, In-Flight Logistics & Transit Hospitality',
    'group',
    '/images/our-work/flight-boarding-group.jpeg',
    'Karachi to Southeast Asia Flight Route',
    'Comprehensive group travel coordination including jet-bridge boarding, reserved cabin seating, and transit hospitality.',
    'Full group departure coordination, synchronized seat allocations, pre-flight transit lounge refreshments.',
    'October 2026',
    'Verified Group Tour',
    'Jinnah International Airport, Karachi',
    2,
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000003',
    'Petronas Twin Towers Evening Illumination & Symphony Lake',
    'family',
    '/images/our-work/petronas-towers-night-solo.jpeg',
    'Kuala Lumpur City Centre (KLCC), Malaysia',
    'Evening city tour featuring the world-famous illuminated Petronas Twin Towers, KLCC Park fountain displays, and skyline vistas.',
    'Prime viewpoint access, KLCC Lake Symphony light show, guided evening photography session.',
    'October 2026',
    'City Excursion',
    'WK Travel Private Transport Desk',
    3,
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000004',
    'Petronas Twin Towers Daylight Architectural Excursion',
    'group',
    '/images/our-work/petronas-towers-group-day.jpeg',
    'Jalan Ampang, Kuala Lumpur, Malaysia',
    'Daytime architectural walking tour of Kuala Lumpur landmark icons with private chauffeur transfers and scheduled group entry.',
    '88-storey skyscraper backdrop, modern architectural briefing, central KL pedestrian exploration.',
    'October 2026',
    'Group Sightseeing',
    'Hotel Lobby Pick-up, Bukit Bintang',
    4,
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000005',
    'KLCC Night Panorama Group Sightseeing Tour',
    'group',
    '/images/our-work/petronas-towers-group-night.jpeg',
    'Kuala Lumpur City Centre, Malaysia',
    'Coordinated evening group outing capturing the vibrant nightlife and towering twin architectural beacons of Kuala Lumpur.',
    'High-contrast evening lighting, group souvenir photos, comfortable post-dinner transfers.',
    'October 2026',
    'Verified Operation',
    'Bukit Bintang Hospitality Desk',
    5,
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000006',
    'Batu Caves Golden Murugan & Rainbow Stairs Cultural Tour',
    'group',
    '/images/our-work/batu-caves-murugan-temple.jpeg',
    'Gombak, Selangor (Kuala Lumpur), Malaysia',
    'Guided excursion to the limestone caves, 140-foot golden Lord Murugan statue, and famous 272 colorful stairway ascent.',
    'Limestone cavern geology, cultural temple exploration, panoramic vantage over greater Selangor.',
    'October 2026',
    'Cultural Tour',
    'WK Travel Air-Conditioned Coach',
    6,
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000007',
    'Istana Negara Royal Palace Grand Entrance & Heritage Tour',
    'vip',
    '/images/our-work/istana-negara-royal-palace.jpeg',
    'Jalan Tuanku Abdul Halim, Kuala Lumpur, Malaysia',
    'Official sightseeing stop at the royal residence of Malaysia monarch, featuring traditional Islamic architecture and grand yellow domes.',
    'Royal archway architecture, ceremonial guard inspection point, historical state briefing.',
    'October 2026',
    'Heritage Excursion',
    'Kuala Lumpur Central Circuit',
    7,
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000008',
    'Tugu Negara National Monument Cultural Heritage Visit',
    'group',
    '/images/our-work/tugu-negara-national-monument.jpeg',
    'Perdana Botanical Gardens, Kuala Lumpur, Malaysia',
    'Commemorative visit to one of the world largest bronze sculptured monuments honoring historic service and national peace.',
    'Historic bronze monument, landscaped cenotaph gardens, panoramic views over Kuala Lumpur lake district.',
    'October 2026',
    'Verified Excursion',
    'WK Travel Private Escort Desk',
    8,
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000009',
    'Kasturi Walk & Central Market Heritage Bazaar Shopping',
    'family',
    '/images/our-work/kasturi-walk-central-market.jpeg',
    'Kasturi Walk, Jalan Hang Kasturi, Kuala Lumpur',
    'Traditional Malaysian handicraft, souvenir shopping, and street culinary immersion along the iconic Wau Bulan sheltered arcade.',
    'Authentic Malaysian handicrafts, tropical fruit stalls, cultural souvenir curation assistance.',
    'October 2026',
    'Bazaar Tour',
    'Central Market Gateway',
    9,
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000010',
    'Kilim Karst Geoforest Park Mangrove Speedboat Safari',
    'adventure',
    '/images/our-work/langkawi-geoforest-speedboat.jpeg',
    'Kilim Karst Geoforest Park, Langkawi, Malaysia',
    'Thrilling charter speedboat voyage through ancient limestone sea caves, dramatic karst cliffs, and mangrove estuaries.',
    'UNESCO Global Geopark exploration, eagle feeding spectacle, crocodile cave pass, private speed-craft navigation.',
    'October 2026',
    'Nature Adventure',
    'Kilim River Jetty, Langkawi',
    10,
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000011',
    'Langkawi River Estuary & Wildlife Ecology Boat Tour',
    'adventure',
    '/images/our-work/langkawi-mangrove-boat-tour.jpeg',
    'Langkawi Biosphere Reserve, Kedah, Malaysia',
    'Specialized river cruising focused on Langkawi unique mangrove biome, floating fish farms, and coastal tidal ecosystems.',
    'Equipped with certified SOLAS safety life vests, licensed sea captain, floating seafood pavilion stop.',
    'October 2026',
    'Verified Adventure',
    'Tanjung Rhu River Basin',
    11,
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000012',
    'Andaman Coastline Island Hopping & Coral Beach Safari',
    'adventure',
    '/images/our-work/langkawi-island-beach-safari.jpeg',
    'Pulau Dayang Bunting & Beras Basah, Langkawi',
    'Scenic island hopping voyage across untouched white-sand beaches, emerald lagoons, and limestone coastline.',
    'Crystal clear swimming bays, freshwater lake visit, safe maritime passenger handling.',
    'October 2026',
    'Island Hopping',
    'Awana Porto Malai Jetty, Langkawi',
    12,
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000013',
    'Langkawi Sky Bridge & Gunung Mat Cincang Cloud Panorama',
    'vip',
    '/images/our-work/langkawi-sky-bridge-view.jpeg',
    'Gunung Mat Cincang Peak (660m), Langkawi',
    'High-altitude excursion via the steepest cable car in the world to the curved suspended pedestrian bridge over tropical rain-forest.',
    'Spectacular misty mountain panorama, 125-meter curved suspension bridge, Southern Thailand coastline views.',
    'October 2026',
    'Peak Expedition',
    'Oriental Village SkyCab Station',
    13,
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000014',
    'Art in Paradise 3D Interactive Illusion Museum Excursion',
    'family',
    '/images/our-work/langkawi-3d-art-museum.jpeg',
    'Oriental Village, Teluk Burau, Langkawi',
    'Interactive family entertainment across 9 thematic zones featuring optical 3D perspective murals and waterfall suspension illusions.',
    'World-class 3D trompe-l’œil artworks, engaging family photo opportunities, climate-controlled indoor gallery.',
    'October 2026',
    'Family Leisure',
    'Oriental Village Complex',
    14,
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000015',
    'Dedicated Air-Conditioned VIP Chauffeur Ground Logistics',
    'vip',
    '/images/our-work/vip-van-private-transfer.jpeg',
    'Kuala Lumpur - Genting - Airport Chauffeur Route',
    'Executive private passenger transport service in high-roof Toyota Commuter van with professional English & Urdu-speaking drivers.',
    'Point-to-point hotel transfers, spacious 10-seater climate comfort, luggage assistance, dedicated itinerary timing.',
    'October 2026',
    'VIP Ground Handling',
    'Hotel Porte-Cochere Pickup Desk',
    15,
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000016',
    'Skyline Luxury Hotel Rooftop Infinity Pool Hospitality',
    'family',
    '/images/our-work/hotel-infinity-pool-kuala-lumpur.jpeg',
    'Bukit Bintang City Centre, Kuala Lumpur',
    'Curated 4-star and 5-star hotel accommodations offering panoramic rooftop leisure facilities, pool decks, and wellness amenities.',
    'Panoramic city views, family relaxation time between scheduled tours, premium verified accommodation partner.',
    'October 2026',
    'Hotel Hospitality',
    'Verified Hotel Partner Desk',
    16,
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000017',
    'Colombo Transit Tour & Bandaranaike International Connection',
    'transit',
    '/images/our-work/sri-lanka-transit-colombo.jpeg',
    'Bandaranaike International Airport & Colombo, Sri Lanka',
    'Coordinated Sri Lanka transit stopover arrangement including transit visa facilitation, baggage hold, and short city excursion.',
    'Sri Lankan transit coordination, Bandaranaike airport meet-and-assist, multi-destination itinerary integration.',
    'October 2026',
    'Transit Operation',
    'Bandaranaike International Terminal',
    17,
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000018',
    'Multi-Airline International Transit & Terminal Baggage Flow',
    'transit',
    '/images/our-work/international-transit-departure.jpeg',
    'Southeast Asia Transit Terminal Hub',
    'Cross-airline transit and check-in support connecting regional budget and full-service carriers across Southeast Asia.',
    'Interline transit facilitation (Scoot, IndiGo, Citilink, Jetstar), baggage re-tagging guidance, gate navigation.',
    'October 2026',
    'Transit Flow Support',
    'International Departures Hub',
    18,
    true
  )
on conflict (id) do update set
  title = excluded.title,
  category = excluded.category,
  image_url = excluded.image_url,
  destination = excluded.destination,
  description = excluded.description,
  highlights = excluded.highlights,
  travel_date = excluded.travel_date,
  milestone = excluded.milestone,
  departure_point = excluded.departure_point,
  is_published = excluded.is_published,
  display_order = excluded.display_order;

-- STEP 11: SEED VERIFIED CUSTOMER REVIEWS
insert into public.reviews (
  id, customer_name, rating, comment, trip_reference, status, created_at
) values
  (
    'e1000000-0000-0000-0000-000000000001',
    'Muhammad Tariq',
    5,
    'Booked the Thailand Bangkok & Pattaya tour for our family. All hotel vouchers and airport pickups were right on time.',
    'Explore Thailand Multi-City Tour',
    'approved',
    '2026-09-15 10:00:00+00'
  ),
  (
    'e1000000-0000-0000-0000-000000000002',
    'Dr. Farhan Qureshi',
    5,
    'Processed our Malaysia and Singapore tourist visas through their Defence Karachi office. Clear document checklist and zero surprises.',
    '4-in-1 Visit Visa Filing',
    'approved',
    '2026-09-28 14:30:00+00'
  ),
  (
    'e1000000-0000-0000-0000-000000000003',
    'Zainab & Bilal',
    5,
    'Our honeymoon trip to Baku was expertly coordinated. The private transfers and Nizami Street hotel selection were top-tier.',
    'Baku Azerbaijan Couple Tour',
    'approved',
    '2026-10-04 12:00:00+00'
  ),
  (
    'e1000000-0000-0000-0000-000000000004',
    'Kamran Ashraf',
    5,
    'Traveled with 6 friends on the Asia Grand circuit. The vehicle was exclusively for our group and the guide was very cooperative.',
    'Asia Grand Tour 4 Countries',
    'approved',
    '2026-10-10 09:15:00+00'
  ),
  (
    'e1000000-0000-0000-0000-000000000005',
    'Syeda Maryam',
    5,
    'Very professional agency in Karachi. Visas were delivered within the estimated working days without any hassle.',
    'Visit Visa Document Filing',
    'approved',
    '2026-10-14 16:45:00+00'
  )
on conflict (id) do update set
  customer_name = excluded.customer_name,
  rating = excluded.rating,
  comment = excluded.comment,
  trip_reference = excluded.trip_reference,
  status = excluded.status;

-- STEP 12: SEED PACKAGE TO CATEGORY MAP
insert into public.package_category_map (package_id, category_id)
select p.id, c.id
from public.packages p
cross join public.categories c
where (
  (p.is_featured = true and c.slug = 'featured') or
  (c.slug = any(p.allowed_categories)) or
  (p.category = c.slug)
)
and not exists (
  select 1 from public.package_category_map m 
  where m.package_id = p.id and m.category_id = c.id
);

-- ============================================================================
-- VERIFICATION CHECK (Run to confirm setup)
-- ============================================================================
select 
  (select count(*) from public.packages) as total_packages,
  (select count(*) from public.categories) as total_categories,
  (select count(*) from public.promotional_banners) as total_banners,
  (select count(*) from public.reviews) as total_reviews,
  (select count(*) from public.agency_work) as total_agency_work,
  (select count(*) from public.profiles where role = 'admin') as total_admins;

