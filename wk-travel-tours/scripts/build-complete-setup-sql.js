import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseSqlPath = path.resolve(__dirname, '..', 'supabase', 'migrations', '20261018000000_production_readiness.sql');
const outputSqlPath = path.resolve(__dirname, '..', 'supabase', 'COMPLETE_SETUP.sql');

let sql = fs.readFileSync(baseSqlPath, 'utf-8');

// Update header
sql = sql.replace(
  '-- File: supabase/wk-travel-final-consolidated.sql',
  '-- File: supabase/COMPLETE_SETUP.sql\n-- Master Single-Paste SQL Setup for Supabase'
);

// Check if pkg-13 through pkg-17 are already in the SQL
if (!sql.includes('sri-lanka-malaysia-thailand')) {
  // Update allowed_categories for existing packages in SQL
  sql = sql.replace(
    "'solo', 'friends']::text[]",
    "'solo', 'friends', 'family', 'honeymoon', 'featured']::text[]"
  );
  sql = sql.replace(
    "'family']::text[], 'tour', 'Fixed departure groups and custom family dates from Karachi', 'Best Family Circuit', '/images/packages/asia-grand-tour-4-countries.jpeg', true",
    "'solo', 'family', 'friends', 'featured']::text[], 'tour', 'Fixed departure groups and custom family dates from Karachi', 'Best Family Circuit', '/images/packages/asia-grand-tour-4-countries.jpeg', true"
  );
  sql = sql.replace(
    "'friends']::text[], 'tour', 'Curated seasonal expeditions departing from Karachi', 'Epic Group Expedition', '/images/packages/asia-explorer-5-countries.jpeg', true",
    "'solo', 'friends', 'family', 'featured']::text[], 'tour', 'Curated seasonal expeditions departing from Karachi', 'Epic Group Expedition', '/images/packages/asia-explorer-5-countries.jpeg', true"
  );
  sql = sql.replace(
    "'solo']::text[], 'tour', 'Direct and connecting flights from Karachi (KHI)', 'Historic & Modern', '/images/packages/baku-azerbaijan-tour.jpeg', true",
    "'solo', 'friends', 'featured']::text[], 'tour', 'Direct and connecting flights from Karachi (KHI)', 'Historic & Modern', '/images/packages/baku-azerbaijan-tour.jpeg', true"
  );
  sql = sql.replace(
    "'family']::text[], 'tour', 'Flexible departure schedules from Karachi', 'Family Favorite', '/images/packages/malaysia-kuala-lumpur-langkawi.jpeg', false",
    "'solo', 'family', 'honeymoon']::text[], 'tour', 'Flexible departure schedules from Karachi', 'Family Favorite', '/images/packages/malaysia-kuala-lumpur-langkawi.jpeg', false"
  );
  sql = sql.replace(
    "'solo']::text[], 'tour', 'Daily direct departures from Karachi (KHI)', 'Express Getaway', '/images/packages/dubai-city-of-dreams.jpeg', false",
    "'solo', 'friends', 'family', 'honeymoon']::text[], 'tour', 'Daily direct departures from Karachi (KHI)', 'Express Getaway', '/images/packages/dubai-city-of-dreams.jpeg', false"
  );
  sql = sql.replace(
    "'honeymoon']::text[], 'tour', 'Scheduled group departures from Karachi (KHI)', 'Romantic Discovery', '/images/packages/turkey-istanbul-cappadocia-antalya.jpeg', true",
    "'solo', 'honeymoon', 'featured']::text[], 'tour', 'Scheduled group departures from Karachi (KHI)', 'Romantic Discovery', '/images/packages/turkey-istanbul-cappadocia-antalya.jpeg', true"
  );
  sql = sql.replace(
    "'honeymoon']::text[], 'tour', 'Year-round departures connecting via Bangkok or Kuala Lumpur', 'Tropical Romance', '/images/packages/bali-indonesia-island-of-gods.jpeg', true",
    "'solo', 'honeymoon', 'featured']::text[], 'tour', 'Year-round departures connecting via Bangkok or Kuala Lumpur', 'Tropical Romance', '/images/packages/bali-indonesia-island-of-gods.jpeg', true"
  );

  const additionalPackagesSql = `
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

-- 14. MALAYSIA TOURIST EVISA SERVICE (Visa)
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
  true,
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
  primary_image = excluded.primary_image, itinerary = excluded.itinerary;

-- 15. THAILAND TOURIST VISA ASSISTANCE (Visa)
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
  true,
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
  primary_image = excluded.primary_image, itinerary = excluded.itinerary;

-- 16. SRI LANKA ETA VISIT VISA PROCESSING (Visa)
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
  true,
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
  primary_image = excluded.primary_image, itinerary = excluded.itinerary;

-- 17. INDONESIA E-VOA ELECTRONIC VISA (Visa)
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
  true,
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
  primary_image = excluded.primary_image, itinerary = excluded.itinerary;
`;

  // Insert before STEP 9
  sql = sql.replace('-- STEP 9: SEED PROMOTIONAL BANNERS', additionalPackagesSql + '\n-- STEP 9: SEED PROMOTIONAL BANNERS');
}

fs.writeFileSync(outputSqlPath, sql, 'utf-8');
console.log('Successfully generated complete SQL file at:', outputSqlPath);
console.log('File size:', fs.statSync(outputSqlPath).size, 'bytes');

