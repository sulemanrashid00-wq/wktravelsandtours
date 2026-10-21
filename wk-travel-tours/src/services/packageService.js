import { initialPackages, initialCategories, initialBanners } from '@/config/initialData';
import { createClient } from '@/lib/supabase/client';
import { getPackagesByCategory as filterByCategory } from '@/lib/utils/packageFilters';

export async function getAllPackages() {
  const supabase = createClient();
  if (!supabase) {
    return initialPackages;
  }

  try {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return initialPackages;
    }

    return data;
  } catch (err) {
    console.warn('Falling back to local verified packages:', err.message);
    return initialPackages;
  }
}

export async function getPackageBySlug(slug) {
  const packages = await getAllPackages();
  return packages.find((p) => p.slug === slug) || null;
}

export async function getPackagesByCategory(categorySlug) {
  const packages = await getAllPackages();
  return filterByCategory(packages, categorySlug);
}

export async function getPromotionalBanners() {
  const supabase = createClient();
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
    return data;
  } catch (err) {
    return initialBanners;
  }
}

