/**
 * Centralized, validated package classification and filtering engine for WK Travel & Tours.
 * Enforces strict category isolation, service type boundaries, and featured tour separation.
 */

export const VALID_CATEGORIES = ['solo', 'friends', 'family', 'honeymoon', 'visa', 'featured'];

/**
 * Check if a package is a tourist holiday package (not a visa-only service).
 */
export function isTourPackage(pkg) {
  if (!pkg) return false;
  return pkg.serviceType !== 'visa' && pkg.pricingBasis !== 'visa_only';
}

/**
 * Check if a package is a visa processing service.
 */
export function isVisaPackage(pkg) {
  if (!pkg) return false;
  return pkg.serviceType === 'visa' || pkg.pricingBasis === 'visa_only' || pkg.category === 'visa';
}

/**
 * Filter packages strictly for a specific category.
 * Rules:
 * - Solo packages never leak into Family or Honeymoon.
 * - Family and Honeymoon remain separate unless explicitly categorized.
 * - Visa packages only appear in 'visa' category.
/**
 * Determines whether a package is a customized / tailor-made package specifically
 * assigned and relevant to the given category.
 * Prevents cross-category contamination (e.g., family package never matches honeymoon or friends).
 */
export function isCustomizedForCategory(pkg, categorySlug) {
  if (!pkg || !categorySlug) return false;
  const cat = String(categorySlug).toLowerCase().trim();

  // Explicit slug matching for authentic client customized packages
  if (cat === 'family' && pkg.slug === 'family-customized-package') return true;
  if (cat === 'friends' && pkg.slug === 'friends-vip-package') return true;
  if (cat === 'honeymoon' && pkg.slug === 'honeymoon-customized-package') return true;
  if (cat === 'solo' && pkg.slug === 'solo-customized-package') return true;

  // Check explicit boolean or type indicators
  const isCustomFlag =
    pkg.isCustomized === true ||
    pkg.is_customized === true ||
    pkg.isCustom === true ||
    pkg.is_custom === true ||
    pkg.packageType === 'customized' ||
    pkg.package_type === 'customized';

  if (!isCustomFlag) return false;

  // The customized package MUST be relevant to this category
  const primaryCat = (pkg.category || pkg.primary_category || '').toLowerCase().trim();
  const targetType = (pkg.targetTripType || '').toLowerCase().trim();
  const allowed = Array.isArray(pkg.allowedCategories)
    ? pkg.allowedCategories.map((c) => String(c).toLowerCase().trim())
    : Array.isArray(pkg.categories)
    ? pkg.categories.map((c) => String(c).toLowerCase().trim())
    : [];

  return primaryCat === cat || targetType === cat || allowed.includes(cat);
}

/**
 * Calculates priority tier for deterministic category ordering:
 * Tier 1: Relevant customized packages matching the current category (Priority 1)
 * Tier 2: Other packages with primary category explicitly matching categorySlug (Priority 2)
 * Tier 3: Other eligible packages allowed in this category (Priority 3)
 */
export function getCategoryPriorityTier(pkg, categorySlug) {
  if (isCustomizedForCategory(pkg, categorySlug)) {
    return 1;
  }
  const cat = String(categorySlug).toLowerCase().trim();
  const primaryCat = (pkg.category || pkg.primary_category || '').toLowerCase().trim();
  if (primaryCat === cat) {
    return 2;
  }
  return 3;
}

/**
 * Filter packages strictly for a specific category with deterministic ordering.
 * Rules:
 * - Customized packages relevant to the category appear FIRST.
 * - Solo packages never leak into Family or Honeymoon.
 * - Family and Honeymoon remain separate unless explicitly categorized.
 * - Visa packages only appear in 'visa' category.
 * - Only active packages are returned.
 */
export function getPackagesByCategory(packages = [], categorySlug) {
  if (!packages || !Array.isArray(packages)) return [];

  const activePackages = packages.filter((p) => p.isActive !== false && p.is_active !== false);

  if (!categorySlug || categorySlug === 'all') {
    return activePackages;
  }

  const normalizedCategory = String(categorySlug).toLowerCase().trim();

  if (normalizedCategory === 'visa') {
    const visaPackages = activePackages.filter((p) => isVisaPackage(p));
    return [...visaPackages].sort((a, b) => {
      const orderA = a.displayOrder ?? a.display_order ?? 999;
      const orderB = b.displayOrder ?? b.display_order ?? 999;
      return orderA - orderB;
    });
  }

  if (normalizedCategory === 'featured') {
    // Featured International Tours must strictly be tour packages, never visa-only
    const featuredPackages = activePackages.filter(
      (p) => isTourPackage(p) && (p.isFeatured === true || p.is_featured === true)
    );
    return [...featuredPackages].sort((a, b) => {
      const orderA = a.displayOrder ?? a.display_order ?? 999;
      const orderB = b.displayOrder ?? b.display_order ?? 999;
      return orderA - orderB;
    });
  }

  // Category specific filter
  const eligible = activePackages.filter((p) => {
    // Visa services must NEVER appear in holiday categories
    if (isVisaPackage(p)) return false;

    // Check primary category or explicit allowed categories array
    if (p.category === normalizedCategory) return true;
    if (Array.isArray(p.categories) && p.categories.includes(normalizedCategory)) return true;
    if (Array.isArray(p.allowedCategories) && p.allowedCategories.includes(normalizedCategory)) return true;

    return false;
  });

  // Apply Phase 3 deterministic 3-tier ordering rule:
  // Tier 1: Relevant customized packages matching the current category (ALWAYS FIRST)
  // Tier 2: Other packages with primary category explicitly matching categorySlug
  // Tier 3: Other eligible packages allowed in this category
  // Secondary: displayOrder ascending
  return [...eligible].sort((a, b) => {
    const tierA = getCategoryPriorityTier(a, normalizedCategory);
    const tierB = getCategoryPriorityTier(b, normalizedCategory);
    if (tierA !== tierB) {
      return tierA - tierB;
    }
    const orderA = a.displayOrder ?? a.display_order ?? 999;
    const orderB = b.displayOrder ?? b.display_order ?? 999;
    return orderA - orderB;
  });
}

/**
 * Get featured holiday tours. Strictly excludes visa services.
 */
export function getFeaturedTours(packages = []) {
  return getPackagesByCategory(packages, 'featured');
}

/**
 * Get solo / one-person travel packages.
 */
export function getSoloPackages(packages = []) {
  return getPackagesByCategory(packages, 'solo');
}

/**
 * Get friends & group travel packages (4+ pax).
 */
export function getFriendsPackages(packages = []) {
  return getPackagesByCategory(packages, 'friends');
}

/**
 * Get family holiday packages. Distinct from honeymoon.
 */
export function getFamilyPackages(packages = []) {
  return getPackagesByCategory(packages, 'family');
}

/**
 * Get honeymoon couple packages. Distinct from family.
 */
export function getHoneymoonPackages(packages = []) {
  return getPackagesByCategory(packages, 'honeymoon');
}

/**
 * Get tourist visa processing packages.
 */
export function getVisaPackages(packages = []) {
  return getPackagesByCategory(packages, 'visa');
}

/**
 * Universal search and filter for package catalogue.
 */
export function filterPackages(packages = [], { query = '', category = 'all', maxPrice, duration } = {}) {
  let results = getPackagesByCategory(packages, category);

  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    results = results.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.destination.toLowerCase().includes(q) ||
        p.subtitle?.toLowerCase().includes(q) ||
        p.tagline?.toLowerCase().includes(q) ||
        p.cities?.some((c) => c.toLowerCase().includes(q))
    );
  }

  if (maxPrice && Number(maxPrice) > 0) {
    results = results.filter((p) => p.price <= Number(maxPrice));
  }

  if (duration && duration !== 'all') {
    if (duration === 'short') {
      results = results.filter((p) => (p.durationDays || 0) <= 5);
    } else if (duration === 'medium') {
      results = results.filter((p) => (p.durationDays || 0) >= 6 && (p.durationDays || 0) <= 9);
    } else if (duration === 'long') {
      results = results.filter((p) => (p.durationDays || 0) >= 10);
    }
  }

  return results;
}

