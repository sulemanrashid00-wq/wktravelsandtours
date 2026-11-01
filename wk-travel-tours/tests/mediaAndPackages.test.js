import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveImageUrl, isVideoMedia, validateMediaFile, formatFileSize, FALLBACK_IMAGES } from '../src/lib/utils/media.js';
import { normalizePackage } from '../src/services/packageService.js';
import { getSoloPackages, getFeaturedTours } from '../src/lib/utils/packageFilters.js';

test('resolveImageUrl correctly resolves various image formats and fallbacks', () => {
  // 1. Null / undefined / empty -> returns appropriate fallback
  assert.equal(resolveImageUrl(null, 'package'), FALLBACK_IMAGES.package);
  assert.equal(resolveImageUrl(undefined, 'banner'), FALLBACK_IMAGES.banner);
  assert.equal(resolveImageUrl('', 'work'), FALLBACK_IMAGES.work);
  assert.equal(resolveImageUrl('null', 'logo'), FALLBACK_IMAGES.logo);

  // 2. Already full URL
  const fullUrl = 'https://lhuwxgbsrnhecljkzbfa.supabase.co/storage/v1/object/public/packages/test.jpg';
  assert.equal(resolveImageUrl(fullUrl), fullUrl);

  // 3. Local asset
  assert.equal(resolveImageUrl('/images/packages/thailand.jpeg'), '/images/packages/thailand.jpeg');
  assert.equal(resolveImageUrl('images/packages/thailand.jpeg'), '/images/packages/thailand.jpeg');

  // 4. Storage relative path
  assert.ok(resolveImageUrl('packages/adventure-tour-123.jpg').includes('packages/adventure-tour-123.jpg'));
});

test('isVideoMedia correctly detects video files and video embeds', () => {
  assert.equal(isVideoMedia('https://example.com/tour.mp4'), true);
  assert.equal(isVideoMedia('https://example.com/clip.webm'), true);
  assert.equal(isVideoMedia('https://www.youtube.com/watch?v=123'), true);
  assert.equal(isVideoMedia('/images/packages/thailand.jpeg'), false);
  assert.equal(isVideoMedia(null), false);
});

test('validateMediaFile correctly enforces allowed MIME types and size boundaries', () => {
  const validJpeg = { name: 'photo.jpg', type: 'image/jpeg', size: 2 * 1024 * 1024 };
  assert.equal(validateMediaFile(validJpeg).valid, true);

  const validWebp = { name: 'photo.webp', type: 'image/webp', size: 1 * 1024 * 1024 };
  assert.equal(validateMediaFile(validWebp).valid, true);

  const oversized = { name: 'huge.jpg', type: 'image/jpeg', size: 15 * 1024 * 1024 };
  assert.equal(validateMediaFile(oversized, { maxSizeMB: 10 }).valid, false);

  const invalidExe = { name: 'script.exe', type: 'application/x-msdownload', size: 1024 };
  assert.equal(validateMediaFile(invalidExe).valid, false);
});

test('formatFileSize formats human readable file sizes', () => {
  assert.equal(formatFileSize(1024), '1 KB');
  assert.equal(formatFileSize(1024 * 1024 * 2.5), '2.5 MB');
});

test('normalizePackage standardizes database snake_case and camelCase attributes', () => {
  const rawDbRow = {
    id: 'f5e22b51-b81d-43ff-9ee7-ffaf46a7634e',
    title: 'Adventure Tour',
    slug: 'adventure-tour',
    destination: 'Adventureland',
    price: 250000,
    pricing_basis: 'per_person',
    primary_image: '/images/packages/adventure.jpeg',
    duration_days: 7,
    category: 'solo',
    allowed_categories: ['solo'],
    service_type: 'tour',
    is_active: true,
    is_featured: false,
    is_customized: true,
    package_type: 'customized',
    display_order: 10,
  };

  const normalized = normalizePackage(rawDbRow);
  assert.equal(normalized.title, 'Adventure Tour');
  assert.equal(normalized.slug, 'adventure-tour');
  assert.equal(normalized.primaryImage, '/images/packages/adventure.jpeg');
  assert.equal(normalized.pricingBasis, 'per_person');
  assert.equal(normalized.durationDays, 7);
  assert.equal(normalized.category, 'solo');
  assert.deepEqual(normalized.allowedCategories, ['solo']);
  assert.equal(normalized.isActive, true);
  assert.equal(normalized.isFeatured, false);
  assert.equal(normalized.isCustomized, true);

  // Verify that getSoloPackages includes this normalized package
  const soloList = getSoloPackages([normalized]);
  assert.equal(soloList.length, 1);
  assert.equal(soloList[0].slug, 'adventure-tour');

  // Verify that getFeaturedTours does NOT include it because isFeatured is false
  const featuredList = getFeaturedTours([normalized]);
  assert.equal(featuredList.length, 0);
});

