-- ==============================================================================
-- WK TRAVEL & TOURS — AUTHENTIC AGENCY WORK PORTFOLIO & MEDIA CMS MIGRATION
-- Migration Version: 20261019000000
-- Purpose: Catalog authentic operations from images/our work, remove package poster recycling,
--          ensure schema support for destination, highlights, milestone, and departure points.
-- ==============================================================================

-- 1. Ensure Table and Extended Columns Exist
create table if not exists public.agency_work (
  id text primary key,
  title text not null,
  category text not null,
  image_url text not null,
  destination text,
  description text,
  highlights text,
  travel_date text,
  milestone text,
  departure_point text,
  is_published boolean default true,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.agency_work add column if not exists destination text;
alter table public.agency_work add column if not exists highlights text;
alter table public.agency_work add column if not exists milestone text;
alter table public.agency_work add column if not exists departure_point text;

-- 2. Remove Deprecated Mock Entries that recycled tour package flyers
delete from public.agency_work where id in (
  'd1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000002',
  'd1000000-0000-0000-0000-000000000003',
  'work-1',
  'work-2',
  'work-3'
) and image_url like '/images/packages/%';

-- 3. Upsert All 18 Authentic Photographic Records
insert into public.agency_work (
  id, title, category, image_url, destination, description, highlights, travel_date, milestone, departure_point, display_order, is_published
) values
(
  'wk-work-01',
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
  'wk-work-02',
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
  'wk-work-03',
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
  'wk-work-04',
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
  'wk-work-05',
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
  'wk-work-06',
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
  'wk-work-07',
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
  'wk-work-08',
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
  'wk-work-09',
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
  'wk-work-10',
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
  'wk-work-11',
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
  'wk-work-12',
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
  'wk-work-13',
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
  'wk-work-14',
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
  'wk-work-15',
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
  'wk-work-16',
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
  'wk-work-17',
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
  'wk-work-18',
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
  display_order = excluded.display_order,
  is_published = excluded.is_published;

-- 4. Indexes and Row Level Security
create index if not exists idx_agency_work_published_order on public.agency_work(is_published, display_order);
alter table public.agency_work enable row level security;

drop policy if exists "Published agency work is viewable by everyone" on public.agency_work;
drop policy if exists "Admins have full access to agency work" on public.agency_work;

create policy "Published agency work is viewable by everyone" on public.agency_work
  for select using (is_published = true);

create policy "Admins have full access to agency work" on public.agency_work
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

