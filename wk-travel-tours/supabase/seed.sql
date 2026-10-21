-- Seed Data for WK Travel & Tours
-- Based on verified agency poster assets and real pricing

-- Categories
insert into public.categories (id, name, slug, description, display_order) values
('c1000000-0000-0000-0000-000000000001', 'Solo Travelers', 'solo', 'Curated experiences for individual explorers and solo adventurers', 1),
('c1000000-0000-0000-0000-000000000002', 'Friends & Groups', 'friends', 'Vibrant group journeys with exclusive group discounts (min 4 pax)', 2),
('c1000000-0000-0000-0000-000000000003', 'Family Holidays', 'family', 'Comfortable, family-first itineraries across Asia and the Middle East', 3),
('c1000000-0000-0000-0000-000000000004', 'Honeymoon Specials', 'honeymoon', 'Romantic escapes with candlelit stays and private transfers', 4),
('c1000000-0000-0000-0000-000000000005', 'Visit Visas', 'visa', 'Comprehensive tourist visa processing and professional document guidance', 5),
('c1000000-0000-0000-0000-000000000006', 'Featured Packages', 'featured', 'Our most popular and highest recommended international packages', 6)
on conflict (slug) do nothing;

-- Promotional Banners
insert into public.promotional_banners (title, subtitle, badge, image_url, target_trip_type, target_url, display_order, is_active) values
('Family’s Package Available', 'Customized Packages for Families of All Sizes. Journeys Beyond Boundaries.', 'Family Travel', '/images/banners/family-package-banner.jpeg', 'family', '/custom-trip?type=family', 1, true),
('VIP Friends Package', 'Good Friends, Bigger Trips, Better Memories. Special Group Discounts (Min 4 Pax).', 'Group Travel', '/images/banners/friends-vip-banner.jpeg', 'friends', '/custom-trip?type=friends', 2, true),
('Honeymoon Customized Package', 'Your Dream Honeymoon, Designed Just for You. Romantic Stays & Private Tours.', 'Honeymoon', '/images/banners/honeymoon-package-banner.jpeg', 'honeymoon', '/custom-trip?type=honeymoon', 3, true);

-- Real Verified Packages
insert into public.packages (id, title, slug, destination, subtitle, tagline, price, pricing_basis, duration, primary_image, inclusions, exclusions, highlights, is_featured, is_active, important_notes) values
(
  'a1000000-0000-0000-0000-000000000001',
  'Explore Thailand: Bangkok, Pattaya & Phuket',
  'thailand-bangkok-pattaya-phuket',
  'Thailand',
  'Same Country Different Vibes',
  'City Lights, Beaches, Fun, Island Vibes & Nature',
  360000,
  'per_person',
  '7 Days / 6 Nights',
  '/images/packages/thailand-bangkok-pattaya-phuket.jpeg',
  array['Return Air Ticket', 'Hotel Accommodation', 'Breakfast Included', 'Visa Assistance', 'Airport Transfers', 'City Tours & Excursions'],
  array['Personal expenses', 'Optional water sports', 'Lunch and dinner not specified'],
  array['Bangkok City Lights, Culture & Shopping', 'Pattaya Beaches, Fun & Adventure', 'Phuket Island Vibes, Nature & Relaxation'],
  true,
  true,
  'Valid passport with at least 6 months validity required. Rates subject to seat availability upon booking confirmation.'
),
(
  'a1000000-0000-0000-0000-000000000002',
  '4-Country Asia Grand Tour: Sri Lanka, Malaysia, Thailand & Singapore',
  'asia-grand-tour-4-countries',
  'Sri Lanka, Malaysia, Thailand, Singapore',
  'Explore The World With Us',
  'Your Dream Journey Starts Here',
  430000,
  'per_person',
  '10 Days / 9 Nights',
  '/images/packages/asia-grand-tour-4-countries.jpeg',
  array['Return Air Ticket', 'Hotel Accommodation', 'Breakfast Included', 'Visa Assistance', 'Airport Transfers', 'City Tours & Excursions'],
  array['Visa issuance government fee variances', 'Lunch and dinner unless specified'],
  array['Sigiriya & Colombo in Sri Lanka', 'Petronas Towers & Batu Caves in Malaysia', 'Bangkok Temples in Thailand', 'Marina Bay & Merlion in Singapore'],
  true,
  true,
  'Multi-country visa processing timeline is approximately 2 to 3 weeks before departure.'
),
(
  'a1000000-0000-0000-0000-000000000003',
  '5-Country Mega Asia Odyssey: Sri Lanka, Malaysia, Thailand, Indonesia & Vietnam',
  'asia-explorer-5-countries',
  'Sri Lanka, Malaysia, Thailand, Indonesia, Vietnam',
  'New Destinations, New Memories',
  'The Ultimate South-East Asia Journey',
  500000,
  'per_person',
  '14 Days / 13 Nights',
  '/images/packages/asia-explorer-5-countries.jpeg',
  array['Return Air Ticket', 'Hotel Accommodation', 'Breakfast Included', 'Visa Assistance', 'Airport Transfers', 'City Tours & Excursions'],
  array['Personal travel insurance', 'Tips and porterage'],
  array['Halong Bay Cruise vibes in Vietnam', 'Bali cultural temples in Indonesia', 'Kuala Lumpur Skyline in Malaysia', 'Thailand vibrant markets'],
  true,
  true,
  'A multi-entry or multiple single-entry visas required as per nationality.'
),
(
  'a1000000-0000-0000-0000-000000000004',
  'Explore Baku: City of History, Culture & Modern Beauty',
  'baku-azerbaijan-tour',
  'Baku, Azerbaijan',
  'A City of History, Culture & Modern Beauty',
  'Visit Baku, Feel the Magic',
  260000,
  'per_person',
  '5 Days / 4 Nights',
  '/images/packages/baku-azerbaijan-tour.jpeg',
  array['Return Air Ticket', 'Hotel Accommodation', 'Breakfast Included', 'Visa Assistance', 'Airport Transfers', 'City Tour & Excursions'],
  array['Lunch and dinner', 'Entrance fees to museums unless listed'],
  array['Flame Towers panoramic views', 'UNESCO Old City (Icherisheher) walking tour', 'Baku Seaside Boulevard & Ferris Wheel', 'Gobustan & Fire Mountain excursion'],
  true,
  true,
  'E-visa approval usually takes 3 working days.'
),
(
  'a1000000-0000-0000-0000-000000000005',
  'Kuala Lumpur & Langkawi: City Vibes & Island Paradise',
  'malaysia-kuala-lumpur-langkawi',
  'Malaysia',
  'Two Destinations, One Amazing Journey',
  'Modern City Vibes & Tropical Island Paradise',
  275000,
  'per_person',
  '6 Days / 5 Nights',
  '/images/packages/malaysia-kuala-lumpur-langkawi.jpeg',
  array['Return Air Ticket', 'Hotel Accommodation', 'Breakfast Included', 'Malaysia Visa Assistance', 'Airport Transfers', 'City Tour & Excursions'],
  array['Tourism tax paid directly at hotel', 'Cable car express lane surcharge'],
  array['KL City Tour & Batu Caves', 'Langkawi SkyCab & SkyBridge', 'Langkawi Island Hopping Tour', 'Duty-Free Shopping & Local Night Markets'],
  true,
  true,
  'Internal flight ticket from Kuala Lumpur to Langkawi included.'
),
(
  'a1000000-0000-0000-0000-000000000006',
  'Explore Dubai: The City of Dreams',
  'dubai-city-of-dreams',
  'Dubai, UAE',
  'Luxury, Shopping, Adventure All in One Place',
  'Your Dream Journey Starts Here',
  220000,
  'per_person',
  '5 Days / 4 Nights',
  '/images/packages/dubai-city-of-dreams.jpeg',
  array['Return Air Ticket', 'Hotel Accommodation', 'Daily Breakfast', 'Visa Assistance', 'Airport Transfers', 'City Tours & Excursions'],
  array['Tourism Dirham fee', 'Optional desert quad biking'],
  array['Burj Khalifa entry & viewing experience', 'Desert Safari with BBQ Dinner & Dune Bashing', 'Dubai Marina Dhow Cruise', 'Dubai Mall & Fountain Show'],
  true,
  true,
  'UAE tourist e-visa process requires clear passport scan and white background photo.'
),
(
  'a1000000-0000-0000-0000-000000000007',
  'Explore Turkey: Istanbul, Cappadocia & Antalya',
  'turkey-istanbul-cappadocia-antalya',
  'Turkey',
  'A Land of History, Culture & Natural Beauty',
  'Dream, Discover, Travel',
  320000,
  'per_person',
  '8 Days / 7 Nights',
  '/images/packages/turkey-istanbul-cappadocia-antalya.jpeg',
  array['Return Air Ticket', 'Hotel Accommodation', 'Breakfast Included', 'Visa Assistance', 'Airport Transfers', 'City Tours & Excursions'],
  array['Hot air balloon flight over Cappadocia (optional add-on)', 'Turkish bath treatments'],
  array['Historic Istanbul: Blue Mosque, Hagia Sophia & Grand Bazaar', 'Magical Cappadocia fairy chimneys and cave hotel experience', 'Antalya Mediterranean coastline and Duden waterfalls'],
  true,
  true,
  'Visa requirements: sticker visa for non-OECD/Schengen/US visa holders, or e-visa if holding qualifying visas.'
),
(
  'a1000000-0000-0000-0000-000000000008',
  'Explore Bali: Island of Gods',
  'bali-indonesia-island-of-gods',
  'Bali, Indonesia',
  'Sun, Sea, Culture & Adventure',
  'Your Dream Journey Starts Here',
  350000,
  'per_person',
  '7 Days / 6 Nights',
  '/images/packages/bali-indonesia-island-of-gods.jpeg',
  array['Return Air Ticket', 'Hotel Accommodation', 'Daily Breakfast', 'Visa Assistance', 'Airport Transfers', 'City Tours & Excursions'],
  array['Bali tourist levy ($10)', 'Water sports'],
  array['Nusa Penida Kelingking beach excursion', 'Tegenungan Waterfall & Ubud monkey forest', 'Seminyak Beach sunset and beach clubs', 'Tanah Lot & Uluwatu Cliff Temples'],
  true,
  true,
  'Indonesia e-VOA (visa on arrival) assistance included in service.'
),
(
  'a1000000-0000-0000-0000-000000000009',
  '4-in-1 Visit Visa Package (Sri Lanka, Malaysia, Thailand, Indonesia)',
  '4-in-1-visit-visa-package',
  'Multi-Country',
  'Explore The World with Hassle-Free Visas',
  'Fast Document Preparation & Visa Filing',
  65000,
  'visa_only',
  'Application Duration: 10-15 Days',
  '/images/packages/4-in-1-visit-visa-package.jpeg',
  array['Visa Processing', 'Professional Assistance', 'Complete Visa Guidance', 'Document Review & Verification', 'Embassy / E-Visa Submission'],
  array['Air tickets', 'Hotel accommodation', 'Embassy physical biometric attendance where applicable'],
  array['Sri Lanka ETA Processing', 'Malaysia eVisa Submission', 'Thailand Tourist Visa Documentation', 'Indonesia e-VOA Guidance'],
  false,
  true,
  'Visa issuance is at the sole discretion of respective immigration authorities. WK Travel & Tours ensures 100% compliant documentation.'
)
on conflict (slug) do nothing;

-- Map Packages to Categories
-- p1: Thailand (solo, friends, featured)
insert into public.package_category_map (package_id, category_id) values
('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001'),
('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002'),
('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000006'),

-- p2: 4-Country Asia (solo, friends, family, featured)
('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001'),
('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002'),
('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003'),
('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000006'),

-- p3: 5-Country Asia (solo, friends, family, featured)
('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001'),
('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002'),
('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003'),
('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000006'),

-- p4: Baku (solo, friends, honeymoon, featured)
('a1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001'),
('a1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000002'),
('a1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004'),
('a1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000006'),

-- p5: Malaysia KL & Langkawi (solo, friends, honeymoon, family)
('a1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001'),
('a1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002'),
('a1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000003'),
('a1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000004'),

-- p6: Dubai (solo, friends, family, honeymoon, featured)
('a1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000001'),
('a1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000002'),
('a1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000003'),
('a1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000004'),
('a1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006'),

-- p7: Turkey (solo, friends, honeymoon, featured)
('a1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000001'),
('a1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000002'),
('a1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000004'),
('a1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000006'),

-- p8: Bali (solo, friends, honeymoon, featured)
('a1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000001'),
('a1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000002'),
('a1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000004'),
('a1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000006'),

-- p9: 4-in-1 Visit Visa (visa)
('a1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000005')
on conflict do nothing;

