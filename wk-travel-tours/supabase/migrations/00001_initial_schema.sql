-- WK Travel & Tours Schema Migration 00001
-- Normalized schema for packages, categories, banners, reviews, agency work, bookings, and custom trips

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles & Verified Roles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  phone text,
  city text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Package Categories
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  slug text not null unique,
  description text,
  display_order int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Travel Packages
create table if not exists public.packages (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  slug text not null unique,
  destination text not null,
  subtitle text,
  tagline text,
  price integer not null, -- stored in integer PKR
  pricing_basis text not null default 'per_person' check (pricing_basis in ('per_person', 'fixed_group', 'visa_only')),
  duration text,
  primary_image text not null,
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

-- 4. Package to Category Mapping
create table if not exists public.package_category_map (
  package_id uuid references public.packages(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  primary key (package_id, category_id)
);

-- 5. Promotional Banners (Hero / Slider)
create table if not exists public.promotional_banners (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  subtitle text,
  badge text,
  image_url text not null,
  target_trip_type text not null,
  target_url text default '/custom-trip',
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Customer Reviews (Pending moderation by default)
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  trip_reference text,
  photo_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Agency Work & Tours Archive
create table if not exists public.agency_work (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  category text not null, -- 'completed_tour', 'visa_success', 'umrah', 'corporate'
  image_url text not null,
  description text,
  travel_date text,
  is_published boolean default true,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Booking Requests
create table if not exists public.booking_requests (
  id uuid default uuid_generate_v4() primary key,
  customer_name text not null,
  phone text not null,
  email text,
  city text,
  traveller_count integer not null default 1,
  requested_date date,
  total_amount integer not null,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'contacted', 'confirmed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Booking Items
create table if not exists public.booking_items (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references public.booking_requests(id) on delete cascade,
  package_id uuid references public.packages(id) on delete set null,
  package_title text not null,
  price integer not null,
  traveller_count integer not null,
  subtotal integer not null
);

-- 10. Custom Trip Requests
create table if not exists public.custom_trip_requests (
  id uuid default uuid_generate_v4() primary key,
  trip_type text not null,
  destinations text not null,
  traveller_count integer not null default 1,
  approximate_date text,
  duration text,
  budget_preference text,
  services_needed text[] default '{}',
  notes text,
  customer_name text not null,
  phone text not null,
  email text,
  status text not null default 'new' check (status in ('new', 'contacted', 'converted', 'archived')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
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

-- Profiles Policies
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Public Read Policies
create policy "Active packages are viewable by everyone" on public.packages
  for select using (is_active = true);

create policy "Categories are viewable by everyone" on public.categories
  for select using (true);

create policy "Package category mapping is viewable by everyone" on public.package_category_map
  for select using (true);

create policy "Active promotional banners are viewable by everyone" on public.promotional_banners
  for select using (is_active = true);

create policy "Approved reviews are viewable by everyone" on public.reviews
  for select using (status = 'approved');

create policy "Published agency work is viewable by everyone" on public.agency_work
  for select using (is_published = true);

-- Public Insert Policies for submissions
create policy "Anyone can submit reviews for moderation" on public.reviews
  for insert with check (status = 'pending');

create policy "Anyone can submit booking requests" on public.booking_requests
  for insert with check (true);

create policy "Anyone can submit booking items" on public.booking_items
  for insert with check (true);

create policy "Anyone can submit custom trip requests" on public.custom_trip_requests
  for insert with check (true);

-- Admin Full Access Policies (verified by role in profiles)
create policy "Admins have full access to packages" on public.packages
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins have full access to banners" on public.promotional_banners
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins have full access to reviews" on public.reviews
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins have full access to agency work" on public.agency_work
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Admin access to booking requests and custom trips
create policy "Admins have full access to booking requests" on public.booking_requests
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins have full access to custom trip requests" on public.custom_trip_requests
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Trigger to automatically populate profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'customer'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists then recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage Buckets Configuration
insert into storage.buckets (id, name, public)
values 
  ('packages', 'packages', true),
  ('banners', 'banners', true),
  ('agency-work', 'agency-work', true),
  ('reviews', 'reviews', true)
on conflict (id) do nothing;

-- Storage RLS: Public Read
create policy "Public Access to Media" on storage.objects
  for select using (bucket_id in ('packages', 'banners', 'agency-work', 'reviews'));

-- Storage RLS: Verified Admin Mutations
create policy "Admins Can Upload Media" on storage.objects
  for insert with check (
    bucket_id in ('packages', 'banners', 'agency-work') and
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins Can Modify Media" on storage.objects
  for update using (
    bucket_id in ('packages', 'banners', 'agency-work') and
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins Can Delete Media" on storage.objects
  for delete using (
    bucket_id in ('packages', 'banners', 'agency-work') and
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );


