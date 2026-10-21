import fs from 'fs';
import path from 'path';

const sourceDir = 'C:\\Users\\DELL\\wk travel agency web\\images\\our work';
const targetDir = path.resolve('public/images/our-work');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

export const WORK_ITEMS_DEFINITIONS = [
  {
    id: 'work-1',
    originalFile: 'WhatsApp Image 2026-10-19 at 12.46.14 AM (1).jpeg',
    newFile: 'klia-airport-departure.jpeg',
    title: 'KLIA International Departure & Documentation Check',
    category: 'group',
    destination: 'Kuala Lumpur International Airport (KLIA), Malaysia',
    description: 'Direct passenger handling at Malaysia Airlines terminal with boarding verification and assisted baggage drop.',
    highlights: 'Karachi to Kuala Lumpur direct connection, terminal check-in facilitation, seamless international boarding.',
    travelDate: 'October 2026',
    milestone: 'Verified Departure',
    departurePoint: 'Jinnah International Airport, Karachi',
    displayOrder: 1,
    isPublished: true,
  },
  {
    id: 'work-2',
    originalFile: 'WhatsApp Image 2026-10-19 at 12.46.13 AM.jpeg',
    newFile: 'flight-boarding-group.jpeg',
    title: 'Group Boarding, In-Flight Logistics & Transit Hospitality',
    category: 'group',
    destination: 'Karachi to Southeast Asia Flight Route',
    description: 'Comprehensive group travel coordination including jet-bridge boarding, reserved cabin seating, and transit hospitality.',
    highlights: 'Full group departure coordination, synchronized seat allocations, pre-flight transit lounge refreshments.',
    travelDate: 'October 2026',
    milestone: 'Verified Group Tour',
    departurePoint: 'Jinnah International Airport, Karachi',
    displayOrder: 2,
    isPublished: true,
  },
  {
    id: 'work-3',
    originalFile: 'WhatsApp Image 2026-10-19 at 12.46.09 AM.jpeg',
    newFile: 'petronas-towers-night-solo.jpeg',
    title: 'Petronas Twin Towers Evening Illumination & Symphony Lake',
    category: 'family',
    destination: 'Kuala Lumpur City Centre (KLCC), Malaysia',
    description: 'Evening city tour featuring the world-famous illuminated Petronas Twin Towers, KLCC Park fountain displays, and skyline vistas.',
    highlights: 'Prime viewpoint access, KLCC Lake Symphony light show, guided evening photography session.',
    travelDate: 'October 2026',
    milestone: 'City Excursion',
    departurePoint: 'WK Travel Private Transport Desk',
    displayOrder: 3,
    isPublished: true,
  },
  {
    id: 'work-4',
    originalFile: 'WhatsApp Image 2026-10-19 at 12.46.14 AM (2).jpeg',
    newFile: 'petronas-towers-group-day.jpeg',
    title: 'Petronas Twin Towers Daylight Architectural Excursion',
    category: 'group',
    destination: 'Jalan Ampang, Kuala Lumpur, Malaysia',
    description: 'Daytime architectural walking tour of Kuala Lumpur landmark icons with private chauffeur transfers and scheduled group entry.',
    highlights: '88-storey skyscraper backdrop, modern architectural briefing, central KL pedestrian exploration.',
    travelDate: 'October 2026',
    milestone: 'Group Sightseeing',
    departurePoint: 'Hotel Lobby Pick-up, Bukit Bintang',
    displayOrder: 4,
    isPublished: true,
  },
  {
    id: 'work-5',
    originalFile: 'WhatsApp Image 2026-10-19 at 12.49.38 AM.jpeg',
    newFile: 'petronas-towers-group-night.jpeg',
    title: 'KLCC Night Panorama Group Sightseeing Tour',
    category: 'group',
    destination: 'Kuala Lumpur City Centre, Malaysia',
    description: 'Coordinated evening group outing capturing the vibrant nightlife and towering twin architectural beacons of Kuala Lumpur.',
    highlights: 'High-contrast evening lighting, group souvenir photos, comfortable post-dinner transfers.',
    travelDate: 'October 2026',
    milestone: 'Verified Operation',
    departurePoint: 'Bukit Bintang Hospitality Desk',
    displayOrder: 5,
    isPublished: true,
  },
  {
    id: 'work-6',
    originalFile: 'WhatsApp Image 2026-10-19 at 12.59.59 AM.jpeg',
    newFile: 'batu-caves-murugan-temple.jpeg',
    title: 'Batu Caves Golden Murugan & Rainbow Stairs Cultural Tour',
    category: 'group',
    destination: 'Gombak, Selangor (Kuala Lumpur), Malaysia',
    description: 'Guided excursion to the limestone caves, 140-foot golden Lord Murugan statue, and famous 272 colorful stairway ascent.',
    highlights: 'Limestone cavern geology, cultural temple exploration, panoramic vantage over greater Selangor.',
    travelDate: 'October 2026',
    milestone: 'Cultural Tour',
    departurePoint: 'WK Travel Air-Conditioned Coach',
    displayOrder: 6,
    isPublished: true,
  },
  {
    id: 'work-7',
    originalFile: 'WhatsApp Image 2026-10-19 at 1.00.03 AM.jpeg',
    newFile: 'istana-negara-royal-palace.jpeg',
    title: 'Istana Negara Royal Palace Grand Entrance & Heritage Tour',
    category: 'vip',
    destination: 'Jalan Tuanku Abdul Halim, Kuala Lumpur, Malaysia',
    description: 'Official sightseeing stop at the royal residence of Malaysia monarch, featuring traditional Islamic architecture and grand yellow domes.',
    highlights: 'Royal archway architecture, ceremonial guard inspection point, historical state briefing.',
    travelDate: 'October 2026',
    milestone: 'Heritage Excursion',
    departurePoint: 'Kuala Lumpur Central Circuit',
    displayOrder: 7,
    isPublished: true,
  },
  {
    id: 'work-8',
    originalFile: 'WhatsApp Image 2026-10-19 at 1.00.01 AM.jpeg',
    newFile: 'tugu-negara-national-monument.jpeg',
    title: 'Tugu Negara National Monument Cultural Heritage Visit',
    category: 'group',
    destination: 'Perdana Botanical Gardens, Kuala Lumpur, Malaysia',
    description: 'Commemorative visit to one of the world largest bronze sculptured monuments honoring historic service and national peace.',
    highlights: 'Historic bronze monument, landscaped cenotaph gardens, panoramic views over Kuala Lumpur lake district.',
    travelDate: 'October 2026',
    milestone: 'Verified Excursion',
    departurePoint: 'WK Travel Private Escort Desk',
    displayOrder: 8,
    isPublished: true,
  },
  {
    id: 'work-9',
    originalFile: 'WhatsApp Image 2026-10-19 at 12.46.14 AM.jpeg',
    newFile: 'kasturi-walk-central-market.jpeg',
    title: 'Kasturi Walk & Central Market Heritage Bazaar Shopping',
    category: 'family',
    destination: 'Kasturi Walk, Jalan Hang Kasturi, Kuala Lumpur',
    description: 'Traditional Malaysian handicraft, souvenir shopping, and street culinary immersion along the iconic Wau Bulan sheltered arcade.',
    highlights: 'Authentic Malaysian handicrafts, tropical fruit stalls, cultural souvenir curation assistance.',
    travelDate: 'October 2026',
    milestone: 'Bazaar Tour',
    departurePoint: 'Central Market Gateway',
    displayOrder: 9,
    isPublished: true,
  },
  {
    id: 'work-10',
    originalFile: 'WhatsApp Image 2026-10-19 at 12.49.34 AM.jpeg',
    newFile: 'langkawi-geoforest-speedboat.jpeg',
    title: 'Kilim Karst Geoforest Park Mangrove Speedboat Safari',
    category: 'adventure',
    destination: 'Kilim Karst Geoforest Park, Langkawi, Malaysia',
    description: 'Thrilling charter speedboat voyage through ancient limestone sea caves, dramatic karst cliffs, and mangrove estuaries.',
    highlights: 'UNESCO Global Geopark exploration, eagle feeding spectacle, crocodile cave pass, private speed-craft navigation.',
    travelDate: 'October 2026',
    milestone: 'Nature Adventure',
    departurePoint: 'Kilim River Jetty, Langkawi',
    displayOrder: 10,
    isPublished: true,
  },
  {
    id: 'work-11',
    originalFile: 'WhatsApp Image 2026-10-19 at 12.46.48 AM.jpeg',
    newFile: 'langkawi-mangrove-boat-tour.jpeg',
    title: 'Langkawi River Estuary & Wildlife Ecology Boat Tour',
    category: 'adventure',
    destination: 'Langkawi Biosphere Reserve, Kedah, Malaysia',
    description: 'Specialized river cruising focused on Langkawi unique mangrove biome, floating fish farms, and coastal tidal ecosystems.',
    highlights: 'Equipped with certified SOLAS safety life vests, licensed sea captain, floating seafood pavilion stop.',
    travelDate: 'October 2026',
    milestone: 'Verified Adventure',
    departurePoint: 'Tanjung Rhu River Basin',
    displayOrder: 11,
    isPublished: true,
  },
  {
    id: 'work-12',
    originalFile: 'WhatsApp Image 2026-10-19 at 12.46.45 AM.jpeg',
    newFile: 'langkawi-island-beach-safari.jpeg',
    title: 'Andaman Coastline Island Hopping & Coral Beach Safari',
    category: 'adventure',
    destination: 'Pulau Dayang Bunting & Beras Basah, Langkawi',
    description: 'Scenic island hopping voyage across untouched white-sand beaches, emerald lagoons, and limestone coastline.',
    highlights: 'Crystal clear swimming bays, freshwater lake visit, safe maritime passenger handling.',
    travelDate: 'October 2026',
    milestone: 'Island Hopping',
    departurePoint: 'Awana Porto Malai Jetty, Langkawi',
    displayOrder: 12,
    isPublished: true,
  },
  {
    id: 'work-13',
    originalFile: 'WhatsApp Image 2026-10-19 at 12.46.50 AM.jpeg',
    newFile: 'langkawi-sky-bridge-view.jpeg',
    title: 'Langkawi Sky Bridge & Gunung Mat Cincang Cloud Panorama',
    category: 'vip',
    destination: 'Gunung Mat Cincang Peak (660m), Langkawi',
    description: 'High-altitude excursion via the steepest cable car in the world to the curved suspended pedestrian bridge over tropical rain-forest.',
    highlights: 'Spectacular misty mountain panorama, 125-meter curved suspension bridge, Southern Thailand coastline views.',
    travelDate: 'October 2026',
    milestone: 'Peak Expedition',
    departurePoint: 'Oriental Village SkyCab Station',
    displayOrder: 13,
    isPublished: true,
  },
  {
    id: 'work-14',
    originalFile: 'WhatsApp Image 2026-10-19 at 12.49.35 AM.jpeg',
    newFile: 'langkawi-3d-art-museum.jpeg',
    title: 'Art in Paradise 3D Interactive Illusion Museum Excursion',
    category: 'family',
    destination: 'Oriental Village, Teluk Burau, Langkawi',
    description: 'Interactive family entertainment across 9 thematic zones featuring optical 3D perspective murals and waterfall suspension illusions.',
    highlights: 'World-class 3D trompe-l’œil artworks, engaging family photo opportunities, climate-controlled indoor gallery.',
    travelDate: 'October 2026',
    milestone: 'Family Leisure',
    departurePoint: 'Oriental Village Complex',
    displayOrder: 14,
    isPublished: true,
  },
  {
    id: 'work-15',
    originalFile: 'WhatsApp Image 2026-10-19 at 12.59.58 AM.jpeg',
    newFile: 'vip-van-private-transfer.jpeg',
    title: 'Dedicated Air-Conditioned VIP Chauffeur Ground Logistics',
    category: 'vip',
    destination: 'Kuala Lumpur - Genting - Airport Chauffeur Route',
    description: 'Executive private passenger transport service in high-roof Toyota Commuter van with professional English & Urdu-speaking drivers.',
    highlights: 'Point-to-point hotel transfers, spacious 10-seater climate comfort, luggage assistance, dedicated itinerary timing.',
    travelDate: 'October 2026',
    milestone: 'VIP Ground Handling',
    departurePoint: 'Hotel Porte-Cochere Pickup Desk',
    displayOrder: 15,
    isPublished: true,
  },
  {
    id: 'work-16',
    originalFile: 'WhatsApp Image 2026-10-19 at 1.36.44 AM.jpeg',
    newFile: 'hotel-infinity-pool-kuala-lumpur.jpeg',
    title: 'Skyline Luxury Hotel Rooftop Infinity Pool Hospitality',
    category: 'family',
    destination: 'Bukit Bintang City Centre, Kuala Lumpur',
    description: 'Curated 4-star and 5-star hotel accommodations offering panoramic rooftop leisure facilities, pool decks, and wellness amenities.',
    highlights: 'Panoramic city views, family relaxation time between scheduled tours, premium verified accommodation partner.',
    travelDate: 'October 2026',
    milestone: 'Hotel Hospitality',
    departurePoint: 'Verified Hotel Partner Desk',
    displayOrder: 16,
    isPublished: true,
  },
  {
    id: 'work-17',
    originalFile: 'WhatsApp Image 2026-10-19 at 1.42.17 AM.jpeg',
    newFile: 'sri-lanka-transit-colombo.jpeg',
    title: 'Colombo Transit Tour & Bandaranaike International Connection',
    category: 'transit',
    destination: 'Bandaranaike International Airport & Colombo, Sri Lanka',
    description: 'Coordinated Sri Lanka transit stopover arrangement including transit visa facilitation, baggage hold, and short city excursion.',
    highlights: 'Sri Lankan transit coordination, Bandaranaike airport meet-and-assist, multi-destination itinerary integration.',
    travelDate: 'September 2026',
    milestone: 'Transit Operation',
    departurePoint: 'Bandaranaike International Terminal',
    displayOrder: 17,
    isPublished: true,
  },
  {
    id: 'work-18',
    originalFile: 'WhatsApp Image 2026-10-19 at 1.42.18 AM.jpeg',
    newFile: 'international-transit-departure.jpeg',
    title: 'Multi-Airline International Transit & Terminal Baggage Flow',
    category: 'transit',
    destination: 'Southeast Asia Transit Terminal Hub',
    description: 'Cross-airline transit and check-in support connecting regional budget and full-service carriers across Southeast Asia.',
    highlights: 'Interline transit facilitation (Scoot, IndiGo, Citilink, Jetstar), baggage re-tagging guidance, gate navigation.',
    travelDate: 'September 2026',
    milestone: 'Transit Flow Support',
    departurePoint: 'International Departures Hub',
    displayOrder: 18,
    isPublished: true,
  },
];

console.log('Copying 18 authentic images...');
let copiedCount = 0;
for (const item of WORK_ITEMS_DEFINITIONS) {
  const src = path.join(sourceDir, item.originalFile);
  const dest = path.join(targetDir, item.newFile);

  if (!fs.existsSync(src)) {
    console.error(`Missing source file: ${src}`);
    continue;
  }

  fs.copyFileSync(src, dest);
  copiedCount++;
  console.log(`[${copiedCount}/18] Copied ${item.originalFile} -> ${item.newFile}`);
}

console.log(`\nSuccessfully copied ${copiedCount} files to ${targetDir}`);

// Generate src/config/ourWorkData.js
const configFile = path.resolve('src/config/ourWorkData.js');
const configContent = `// Authentic media catalog for WK Travel & Tours completed operations
// Generated from authentic assets in images/our work

export const OUR_WORK_CATEGORIES = [
  { id: 'all', label: 'All Operations' },
  { id: 'group', label: 'Group Departures' },
  { id: 'family', label: 'Family & Leisure' },
  { id: 'adventure', label: 'Coastal & Island' },
  { id: 'vip', label: 'VIP & Transfers' },
  { id: 'transit', label: 'International Transit' },
];

export const OUR_WORK_ITEMS = ${JSON.stringify(
  WORK_ITEMS_DEFINITIONS.map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    imageUrl: '/images/our-work/' + item.newFile,
    destination: item.destination,
    description: item.description,
    highlights: item.highlights,
    travelDate: item.travelDate,
    milestone: item.milestone,
    departurePoint: item.departurePoint,
    displayOrder: item.displayOrder,
    isPublished: item.isPublished,
    originalFile: item.originalFile,
    newFile: item.newFile,
  })),
  null,
  2
)};

export function getPublishedWork() {
  return OUR_WORK_ITEMS.filter((item) => item.isPublished).sort(
    (a, b) => a.displayOrder - b.displayOrder
  );
}

export function getWorkByCategory(category) {
  const published = getPublishedWork();
  if (!category || category === 'all') return published;
  return published.filter((item) => item.category === category);
}
`;

fs.writeFileSync(configFile, configContent, 'utf-8');
console.log(`\nGenerated ${configFile} with ${WORK_ITEMS_DEFINITIONS.length} verified operations.`);
