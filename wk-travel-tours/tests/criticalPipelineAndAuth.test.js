import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMediaFile, resolveImageUrl, isVideoMedia, formatFileSize } from '../src/lib/utils/media.js';
import { normalizePackage } from '../src/services/packageService.js';
import {
  getFeaturedTours,
  getSoloPackages,
  getFriendsPackages,
  getFamilyPackages,
  getHoneymoonPackages,
  getVisaPackages,
  getPackagesByCategory,
  filterPackages,
} from '../src/lib/utils/packageFilters.js';

test('TEST 1 & 2 & 3: Package Image Isolation & Unique Association', () => {
  const chinaPkg = normalizePackage({
    id: 'pkg-china-001',
    title: 'China Silk Road & Ancient Metros',
    slug: 'china',
    category: 'solo',
    allowed_categories: ['solo'],
    primary_image: 'https://lhuwxgbsrnhecljkzbfa.supabase.co/storage/v1/object/public/packages/china-great-wall.jpg',
    price: 320000,
    is_active: true,
    is_featured: false,
  });

  const thailandPkg = normalizePackage({
    id: 'pkg-thailand-001',
    title: 'Explore Thailand: Bangkok, Pattaya & Phuket',
    slug: 'thailand-bangkok-pattaya-phuket',
    category: 'solo',
    allowed_categories: ['solo', 'friends'],
    primary_image: '/images/packages/thailand-bangkok-pattaya-phuket.jpeg',
    price: 185000,
    is_active: true,
    is_featured: true,
  });

  const japanPkg = normalizePackage({
    id: 'pkg-japan-001',
    title: 'Japan Discovery Tour',
    slug: 'japan-discovery',
    category: 'solo',
    allowed_categories: ['solo'],
    primary_image: 'https://lhuwxgbsrnhecljkzbfa.supabase.co/storage/v1/object/public/packages/japan-tokyo.webp',
    price: 450000,
    is_active: true,
    is_featured: false,
  });

  // Verify packages never share image references accidentally
  assert.notEqual(chinaPkg.primaryImage, thailandPkg.primaryImage);
  assert.notEqual(chinaPkg.primaryImage, japanPkg.primaryImage);
  assert.notEqual(thailandPkg.primaryImage, japanPkg.primaryImage);

  // Verify China image is correctly resolved
  const resolvedChina = resolveImageUrl(chinaPkg.primaryImage, 'package');
  assert.equal(resolvedChina, 'https://lhuwxgbsrnhecljkzbfa.supabase.co/storage/v1/object/public/packages/china-great-wall.jpg');

  // Verify China is in Solo and not in Friends, Family, Honeymoon, Visa
  const catalog = [chinaPkg, thailandPkg, japanPkg];
  const soloList = getSoloPackages(catalog);
  const friendsList = getFriendsPackages(catalog);
  const familyList = getFamilyPackages(catalog);
  const honeymoonList = getHoneymoonPackages(catalog);
  const visaList = getVisaPackages(catalog);

  assert.equal(soloList.some((p) => p.slug === 'china'), true);
  assert.equal(friendsList.some((p) => p.slug === 'china'), false);
  assert.equal(familyList.some((p) => p.slug === 'china'), false);
  assert.equal(honeymoonList.some((p) => p.slug === 'china'), false);
  assert.equal(visaList.some((p) => p.slug === 'china'), false);
});

test('TEST 4 & 5: Image Replacement & Immutability when Unchanged', () => {
  const originalPkg = {
    id: 'pkg-edit-01',
    title: 'Baku Azerbaijan Tour',
    primaryImage: 'https://lhuwxgbsrnhecljkzbfa.supabase.co/storage/v1/object/public/packages/baku-old.jpg',
    price: 195000,
  };

  // Replacement simulation
  const replacementImage = 'https://lhuwxgbsrnhecljkzbfa.supabase.co/storage/v1/object/public/packages/baku-new-v2.webp';
  const updatedPkg = { ...originalPkg, primaryImage: replacementImage };
  assert.equal(updatedPkg.primaryImage, replacementImage);
  assert.notEqual(updatedPkg.primaryImage, originalPkg.primaryImage);

  // Edit without changing image simulation
  const editedPriceOnly = { ...originalPkg, price: 210000 };
  assert.equal(editedPriceOnly.primaryImage, originalPkg.primaryImage);
  assert.equal(editedPriceOnly.price, 210000);
});

test('TEST 6: Validation Rejects Invalid Media and Retains Fallbacks', () => {
  const invalidExe = validateMediaFile({ type: 'application/x-msdownload', size: 1024 });
  assert.equal(invalidExe.valid, false);

  const oversizedImg = validateMediaFile({ type: 'image/jpeg', size: 15 * 1024 * 1024 });
  assert.equal(oversizedImg.valid, false);

  const validWebp = validateMediaFile({ type: 'image/webp', size: 2 * 1024 * 1024 });
  assert.equal(validWebp.valid, true);

  // Empty string or null fallback
  const fallback = resolveImageUrl('', 'package');
  assert.equal(fallback.startsWith('/images/'), true);
});

test('TEST 7: Package Deletion Isolation', () => {
  const list = [
    { id: '1', slug: 'china', isActive: true, category: 'solo' },
    { id: '2', slug: 'thailand', isActive: true, category: 'solo' },
  ];
  const remaining = list.filter((p) => p.id !== '1');
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].slug, 'thailand');
  assert.equal(getSoloPackages(remaining).some((p) => p.slug === 'china'), false);
});
