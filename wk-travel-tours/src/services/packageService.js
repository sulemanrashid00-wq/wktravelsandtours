import { initialPackages, initialCategories, initialBanners } from '../config/initialData.js';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getPackagesByCategory as filterByCategory } from '../lib/utils/packageFilters.js';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    return createSupabaseClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return null;
}

/**
 * Normalizes package records from database or static configs to ensure
 * both camelCase and snake_case properties are consistently populated.
 */
export function normalizePackage(item) {
  if (!item) return item;
  const category = item.category || 'solo';
  const allowed = Array.isArray(item.allowed_categories)
    ? item.allowed_categories
    : Array.isArray(item.allowedCategories)
    ? item.allowedCategories
    : Array.isArray(item.categories)
    ? item.categories
    : [category];

  const resolvedImage =
    item.primary_image ||
    item.primaryImage ||
    item.image_url ||
    item.imageUrl ||
    item.cover_image ||
    item.coverImage ||
    item.image ||
    '';

  return {
    ...item,
    id: item.id,
    title: item.title,
    slug: item.slug,
    destination: item.destination,
    subtitle: item.subtitle || '',
    tagline: item.tagline || item.subtitle || '',
    price: typeof item.price === 'number' ? item.price : parseInt(item.price, 10) || 0,
    duration: item.duration || `${item.duration_days || item.durationDays || 7} Days`,
    durationDays: item.duration_days ?? item.durationDays ?? 7,
    pricingBasis: item.pricing_basis || item.pricingBasis || 'per_person',
    primaryImage: resolvedImage,
    primary_image: resolvedImage,
    image: resolvedImage,
    imageUrl: resolvedImage,
    galleryImages: item.gallery_images || item.galleryImages || [],
    isFeatured: item.is_featured ?? item.isFeatured ?? false,
    isActive: item.is_active ?? item.isActive ?? true,
    importantNotes: item.important_notes || item.importantNotes || null,
    category,
    allowedCategories: allowed,
    categories: allowed,
    serviceType: item.service_type || item.serviceType || 'tour',
    departureInfo: item.departure_info || item.departureInfo || null,
    badge: item.badge || null,
    isCustomized: item.is_customized ?? item.isCustomized ?? false,
    packageType: item.package_type || item.packageType || 'standard',
    displayOrder: item.display_order ?? item.displayOrder ?? 10,
    inclusions: Array.isArray(item.inclusions) ? item.inclusions : [],
    exclusions: Array.isArray(item.exclusions) ? item.exclusions : [],
    highlights: Array.isArray(item.highlights) ? item.highlights : [],
    itinerary: Array.isArray(item.itinerary) ? item.itinerary : [],
    // Database mirror
    pricing_basis: item.pricing_basis || item.pricingBasis || 'per_person',
    is_featured: item.is_featured ?? item.isFeatured ?? false,
    is_active: item.is_active ?? item.isActive ?? true,
    allowed_categories: allowed,
    is_customized: item.is_customized ?? item.isCustomized ?? false,
    package_type: item.package_type || item.packageType || 'standard',
    display_order: item.display_order ?? item.displayOrder ?? 10,
  };
}

export async function getAllPackages(options = {}) {
  const includeInactive = options.includeInactive || false;
  const supabase = getSupabaseClient();

  if (!supabase) {
    const list = includeInactive
      ? initialPackages
      : initialPackages.filter((p) => p.isActive !== false);
    return list.map(normalizePackage);
  }

  try {
    let query = supabase.from('packages').select('*').order('display_order', { ascending: true });
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      const list = includeInactive
        ? initialPackages
        : initialPackages.filter((p) => p.isActive !== false);
      return list.map(normalizePackage);
    }

    return data.map(normalizePackage);
  } catch (err) {
    console.warn('Falling back to local packages:', err.message);
    const list = includeInactive
      ? initialPackages
      : initialPackages.filter((p) => p.isActive !== false);
    return list.map(normalizePackage);
  }
}

export async function getPackageBySlug(slug) {
  if (!slug) return null;
  const cleanSlug = String(slug).toLowerCase().trim();

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (data && !error) {
        return normalizePackage(data);
      }
    } catch {
      // Fallback
    }
  }

  const fallback = initialPackages.find(
    (p) => p.slug?.toLowerCase().trim() === cleanSlug
  );
  return fallback ? normalizePackage(fallback) : null;
}

export async function getPackagesByCategory(categorySlug) {
  const packages = await getAllPackages();
  return filterByCategory(packages, categorySlug);
}

export async function getPromotionalBanners() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return initialBanners;
  }

  try {
    const { data, error } = await supabase
      .from('promotional_banners')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return initialBanners;
    }
    return data.map((b) => ({
      ...b,
      image: b.image_url || b.image,
      targetTripType: b.target_trip_type || b.targetTripType,
      targetUrl: b.target_url || b.targetUrl,
      displayOrder: b.display_order ?? b.displayOrder ?? 0,
      isActive: b.is_active ?? b.isActive ?? true,
    }));
  } catch (err) {
    return initialBanners;
  }
}
