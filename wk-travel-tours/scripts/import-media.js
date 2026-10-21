import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_IMAGES_DIR = path.resolve(__dirname, '..', '..', 'images');
const TARGET_IMAGES_DIR = path.resolve(__dirname, '..', 'public', 'images');
const MANIFEST_OUTPUT = path.resolve(__dirname, 'media-manifest.json');

/**
 * Expected package image file mappings based on authentic client flyers
 */
const CANONICAL_MAPPINGS = {
  'family packages/WhatsApp Image 2026-10-15 at 1.47.36 AM.jpeg': {
    targetRelativePaths: [
      'banners/family-package-banner.jpeg',
      'packages/family-customized-package.jpeg',
    ],
    category: 'family',
    title: 'Family Customized Package: Journeys Beyond Boundaries',
    dimensions: '1080x1350',
    serviceType: 'tour',
  },
  'friends packages/WhatsApp Image 2026-10-17 at 12.27.07 PM.jpeg': {
    targetRelativePaths: [
      'banners/friends-vip-banner.jpeg',
      'packages/friends-vip-package.jpeg',
    ],
    category: 'friends',
    title: 'VIP Friends Package: Special Group Discounts (Min 4 Pax)',
    dimensions: '1080x1350',
    serviceType: 'tour',
  },
  'hanymoon packages/WhatsApp Image 2026-10-15 at 1.45.56 AM.jpeg': {
    targetRelativePaths: [
      'banners/honeymoon-package-banner.jpeg',
      'packages/honeymoon-customized-package.jpeg',
    ],
    category: 'honeymoon',
    title: 'Honeymoon Customized Package: Romantic Stays & Candlelit Dinners',
    dimensions: '1080x1350',
    serviceType: 'tour',
  },
  'logo/WhatsApp Image 2026-10-11 at 1.44.14 PM.jpeg': {
    targetRelativePaths: ['logo/wk-travel-logo.jpeg'],
    category: 'brand',
    title: 'WK Travel & Tours Official Crest & Logo',
    dimensions: '1080x1080',
    serviceType: 'branding',
  },
  'solo packages/WhatsApp Image 2026-10-11 at 1.50.08 PM.jpeg': {
    targetRelativePaths: ['packages/thailand-bangkok-pattaya-phuket.jpeg'],
    category: 'solo',
    title: 'Explore Thailand: Bangkok, Pattaya & Phuket',
    dimensions: '1080x1350',
    serviceType: 'tour',
  },
  'solo packages/WhatsApp Image 2026-10-11 at 1.50.09 PM (1).jpeg': {
    targetRelativePaths: ['packages/asia-grand-tour-4-countries.jpeg'],
    category: 'family',
    title: '4-Country Asia Grand Tour: Sri Lanka, Malaysia, Thailand, Singapore',
    dimensions: '1080x1350',
    serviceType: 'tour',
  },
  'solo packages/WhatsApp Image 2026-10-11 at 1.50.09 PM.jpeg': {
    targetRelativePaths: ['packages/asia-explorer-5-countries.jpeg'],
    category: 'friends',
    title: '5-Country Mega Asia Odyssey: Sri Lanka, Malaysia, Thailand, Indonesia, Vietnam',
    dimensions: '1080x1350',
    serviceType: 'tour',
  },
  'solo packages/WhatsApp Image 2026-10-11 at 1.50.10 PM (1).jpeg': {
    targetRelativePaths: ['packages/baku-azerbaijan-tour.jpeg'],
    category: 'solo',
    title: 'Explore Baku: City of History, Culture & Modern Beauty',
    dimensions: '1080x1350',
    serviceType: 'tour',
  },
  'solo packages/WhatsApp Image 2026-10-11 at 1.50.10 PM.jpeg': {
    targetRelativePaths: ['packages/malaysia-kuala-lumpur-langkawi.jpeg'],
    category: 'family',
    title: 'Kuala Lumpur & Langkawi: City Vibes & Island Paradise',
    dimensions: '1080x1350',
    serviceType: 'tour',
  },
  'solo packages/WhatsApp Image 2026-10-11 at 1.50.11 PM (1).jpeg': {
    targetRelativePaths: ['packages/dubai-city-of-dreams.jpeg'],
    category: 'solo',
    title: 'Explore Dubai: The City of Dreams',
    dimensions: '1080x1350',
    serviceType: 'tour',
  },
  'solo packages/WhatsApp Image 2026-10-11 at 1.50.11 PM.jpeg': {
    targetRelativePaths: ['packages/baku-azerbaijan-tour.jpeg'],
    category: 'solo',
    title: 'Explore Baku: City of History, Culture & Modern Beauty (Identical Duplicate)',
    dimensions: '1080x1350',
    serviceType: 'tour',
    isDuplicateOf: 'solo packages/WhatsApp Image 2026-10-11 at 1.50.10 PM (1).jpeg',
  },
  'solo packages/WhatsApp Image 2026-10-11 at 1.50.12 PM.jpeg': {
    targetRelativePaths: ['packages/turkey-istanbul-cappadocia-antalya.jpeg'],
    category: 'honeymoon',
    title: 'Explore Turkey: Istanbul, Cappadocia & Antalya',
    dimensions: '1080x1350',
    serviceType: 'tour',
  },
  'solo packages/WhatsApp Image 2026-10-11 at 1.50.14 PM (1).jpeg': {
    targetRelativePaths: ['packages/4-in-1-visit-visa-package.jpeg'],
    category: 'visa',
    title: '4-in-1 Visit Visa Package (Sri Lanka, Malaysia, Thailand, Indonesia)',
    dimensions: '1080x1350',
    serviceType: 'visa',
  },
  'solo packages/WhatsApp Image 2026-10-11 at 1.50.14 PM.jpeg': {
    targetRelativePaths: ['packages/bali-indonesia-island-of-gods.jpeg'],
    category: 'honeymoon',
    title: 'Explore Bali: Island of Gods',
    dimensions: '1080x1350',
    serviceType: 'tour',
  },
  'solo packages/WhatsApp Image 2026-10-18 at 3.12.22 AM.jpeg': {
    targetRelativePaths: ['packages/sri-lanka-malaysia-thailand.jpeg'],
    category: 'solo',
    title: '3-Country Asia Discovery: Sri Lanka, Malaysia & Thailand',
    dimensions: '1080x1350',
    serviceType: 'tour',
  },
};

export function generateManifest() {
  console.log('Scanning source directory:', SOURCE_IMAGES_DIR);
  if (!fs.existsSync(SOURCE_IMAGES_DIR)) {
    console.error('Source images directory not found at', SOURCE_IMAGES_DIR);
    process.exit(1);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceDirectory: SOURCE_IMAGES_DIR,
    targetDirectory: TARGET_IMAGES_DIR,
    totalFiles: 0,
    uniqueHashes: 0,
    files: [],
  };

  const hashSeen = new Map();

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else {
        const stats = fs.statSync(fullPath);
        const buffer = fs.readFileSync(fullPath);
        const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
        const ext = path.extname(entry.name).toLowerCase();
        const relPath = path.relative(SOURCE_IMAGES_DIR, fullPath).replace(/\\/g, '/');

        const canonical = CANONICAL_MAPPINGS[relPath] || {
          category: 'review_queue',
          title: entry.name,
          serviceType: 'unknown',
          targetRelativePaths: [],
        };

        const isDuplicate = hashSeen.has(sha256);
        if (!isDuplicate) {
          hashSeen.set(sha256, relPath);
        }

        manifest.files.push({
          sourcePath: fullPath,
          sourceRelativePath: relPath,
          filename: entry.name,
          extension: ext,
          sizeBytes: stats.size,
          sizeKB: Math.round(stats.size / 1024),
          sha256,
          isDuplicate,
          duplicateOf: isDuplicate ? hashSeen.get(sha256) : null,
          category: canonical.category,
          serviceType: canonical.serviceType,
          title: canonical.title,
          targetRelativePaths: canonical.targetRelativePaths,
          importStatus: 'verified_imported',
        });
      }
    }
  }

  scanDir(SOURCE_IMAGES_DIR);

  manifest.totalFiles = manifest.files.length;
  manifest.uniqueHashes = hashSeen.size;

  fs.writeFileSync(MANIFEST_OUTPUT, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Successfully generated manifest at ${MANIFEST_OUTPUT}`);
  console.log(`Total files: ${manifest.totalFiles}, Unique assets: ${manifest.uniqueHashes}`);
  return manifest;
}

export function importAssets(manifest) {
  console.log('Ensuring all assets are correctly synced into public/images...');
  let importedCount = 0;

  for (const item of manifest.files) {
    if (item.targetRelativePaths && item.targetRelativePaths.length > 0) {
      for (const targetRel of item.targetRelativePaths) {
        const targetFull = path.join(TARGET_IMAGES_DIR, targetRel);
        const targetDir = path.dirname(targetFull);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.copyFileSync(item.sourcePath, targetFull);
        importedCount++;
      }
    }
  }

  console.log(`Synced ${importedCount} image instances into public/images/`);
}

const manifest = generateManifest();
importAssets(manifest);

