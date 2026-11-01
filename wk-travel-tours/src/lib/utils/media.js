/**
 * Reusable Media Resolution and Validation Utilities
 * WK Travel & Tours
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lhuwxgbsrnhecljkzbfa.supabase.co';

export const FALLBACK_IMAGES = {
  package: '/images/packages/asia-grand-tour-4-countries.jpeg',
  banner: '/images/banners/family-package-banner.jpeg',
  work: '/images/our-work/klia-airport-departure.jpeg',
  logo: '/images/logo/wk-travel-logo.jpeg',
};

/**
 * Consistently resolves image URLs across all media providers and sources:
 * - Direct public Supabase Storage URLs
 * - Local static public assets (/images/...)
 * - Partial storage object paths (packages/abc.jpeg)
 * - Null / undefined / empty values -> Graceful branded fallback
 *
 * @param {string|null|undefined} src
 * @param {'package'|'banner'|'work'|'logo'} [fallbackType='package']
 * @returns {string} Fully qualified or valid absolute local path
 */
export function resolveImageUrl(src, fallbackType = 'package') {
  const fallback = FALLBACK_IMAGES[fallbackType] || FALLBACK_IMAGES.package;

  if (!src || typeof src !== 'string') {
    return fallback;
  }

  const clean = src.trim();
  if (!clean || clean === 'null' || clean === 'undefined') {
    return fallback;
  }

  // Already a complete HTTP / HTTPS URL
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }

  // Absolute local public asset path
  if (clean.startsWith('/')) {
    return clean;
  }

  // Missing leading slash on local asset
  if (clean.startsWith('images/')) {
    return `/${clean}`;
  }

  // Supabase Storage relative object path (e.g. "packages/filename.jpeg" or "filename.jpeg")
  if (clean.startsWith('packages/') || clean.startsWith('banners/') || clean.startsWith('agency-work/')) {
    return `${SUPABASE_URL}/storage/v1/object/public/${clean}`;
  }

  // Default assumption for raw filenames: stored in target bucket
  const targetBucket = fallbackType === 'work' ? 'agency-work' : fallbackType === 'banner' ? 'banners' : 'packages';
  return `${SUPABASE_URL}/storage/v1/object/public/${targetBucket}/${clean}`;
}

/**
 * Checks if the media source is a video file or streaming embed.
 * @param {string|null|undefined} url
 * @returns {boolean}
 */
export function isVideoMedia(url) {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase();
  return (
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.ogg') ||
    clean.includes('youtube.com') ||
    clean.includes('youtu.be') ||
    clean.includes('vimeo.com')
  );
}

/**
 * Validates media file before uploading: type, extension, size
 * @param {File} file
 * @param {Object} [options]
 * @param {number} [options.maxSizeMB=10]
 * @param {boolean} [options.allowVideo=false]
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateMediaFile(file, options = {}) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const allowVideo = options.allowVideo || false;
  const maxSizeMB = options.maxSizeMB || (allowVideo ? 50 : 10);
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validImageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const validVideoMimes = ['video/mp4', 'video/webm', 'video/quicktime'];

  const allowedMimes = allowVideo ? [...validImageMimes, ...validVideoMimes] : validImageMimes;

  if (!allowedMimes.includes(file.type.toLowerCase())) {
    const formatNotice = allowVideo
      ? 'Supported formats: JPEG, PNG, WebP, or MP4/WebM video.'
      : 'Supported image formats: JPEG, JPG, PNG, and WebP.';
    return { valid: false, error: `Invalid file type (${file.type || 'unknown'}). ${formatNotice}` };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of ${maxSizeMB}MB.`,
    };
  }

  return { valid: true };
}

/**
 * Formats file size in human readable KB or MB
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

