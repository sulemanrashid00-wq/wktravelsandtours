import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initialPackages } from '@/config/initialData';
import { packageSchema } from '@/lib/validation/packageSchema';
import { verifyServerAdmin, isAuthorizedAdmin } from '@/lib/security/roles';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('includeInactive') === 'true';

  const supabase = await createClient();
  if (!supabase) {
    const list = includeInactive
      ? initialPackages
      : initialPackages.filter((p) => p.isActive !== false);
    return NextResponse.json({ success: true, data: list, source: 'fallback' });
  }

  try {
    let query = supabase.from('packages').select('*').order('created_at', { ascending: false });
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      const list = includeInactive
        ? initialPackages
        : initialPackages.filter((p) => p.isActive !== false);
      return NextResponse.json({ success: true, data: list, source: 'fallback' });
    }

    // Map database snake_case columns to frontend camelCase
    const mapped = data.map((item) => ({
      ...item,
      pricingBasis: item.pricing_basis || item.pricingBasis || 'per_person',
      primaryImage: item.primary_image || item.primaryImage,
      galleryImages: item.gallery_images || item.galleryImages || [],
      isFeatured: item.is_featured ?? item.isFeatured ?? false,
      isActive: item.is_active ?? item.isActive ?? true,
      importantNotes: item.important_notes || item.importantNotes,
      durationDays: item.duration_days ?? item.durationDays,
      category: item.category || 'solo',
      allowedCategories:
        item.allowed_categories || item.allowedCategories || (item.category ? [item.category] : ['solo']),
      categories:
        item.allowed_categories || item.allowedCategories || (item.category ? [item.category] : ['solo']),
      serviceType: item.service_type || item.serviceType || 'tour',
      departureInfo: item.departure_info || item.departureInfo,
      badge: item.badge || item.badge,
      isCustomized: item.is_customized ?? item.isCustomized ?? false,
      packageType: item.package_type || item.packageType || 'standard',
      displayOrder: item.display_order ?? item.displayOrder ?? 10,
    }));

    return NextResponse.json({ success: true, data: mapped, source: 'database' });
  } catch (err) {
    return NextResponse.json({ success: true, data: initialPackages, source: 'fallback' });
  }
}

export async function POST(request) {
  const supabase = await createClient();
  const body = await request.json();

  // Validate payload with Zod
  let validated;
  try {
    validated = packageSchema.parse(body);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.errors ? err.errors[0]?.message : err.message },
      { status: 422 }
    );
  }

  if (!supabase) {
    // Offline / fallback persistence
    const fallbackItem = {
      ...validated,
      id: 'pkg-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    return NextResponse.json({ success: true, data: fallbackItem }, { status: 201 });
  }

  // Authenticate & authorize admin session (Supabase or 4-digit Email OTP)
  const isAdmin = await isAuthorizedAdmin(supabase);
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Admin privileges required' },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from('packages')
    .insert([
      {
        title: validated.title,
        slug: validated.slug,
        destination: validated.destination,
        subtitle: validated.subtitle || null,
        tagline: validated.tagline || null,
        price: validated.price,
        pricing_basis: validated.pricingBasis,
        duration: validated.duration,
        duration_days: validated.durationDays || null,
        category: validated.category || 'solo',
        allowed_categories: validated.allowedCategories || validated.categories || [validated.category || 'solo'],
        service_type: validated.serviceType || 'tour',
        departure_info: validated.departureInfo || null,
        badge: validated.badge || null,
        primary_image: validated.primaryImage,
        gallery_images: validated.galleryImages,
        inclusions: validated.inclusions,
        exclusions: validated.exclusions,
        highlights: validated.highlights,
        itinerary: validated.itinerary,
        is_featured: validated.isFeatured,
        is_active: validated.isActive,
        is_customized: validated.isCustomized ?? false,
        package_type: validated.packageType || 'standard',
        display_order: validated.displayOrder ?? 10,
        important_notes: validated.importantNotes || null,
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}

export async function PUT(request) {
  const supabase = await createClient();
  const body = await request.json();

  let validated;
  try {
    validated = packageSchema.parse(body);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.errors ? err.errors[0]?.message : err.message },
      { status: 422 }
    );
  }

  if (!validated.id && !body.id) {
    return NextResponse.json({ success: false, error: 'Package ID required for update' }, { status: 400 });
  }

  const packageId = validated.id || body.id;

  if (!supabase) {
    return NextResponse.json({ success: true, data: { ...validated, id: packageId } });
  }

  const isAdmin = await isAuthorizedAdmin(supabase);
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Admin privileges required' },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from('packages')
    .update({
      title: validated.title,
      slug: validated.slug,
      destination: validated.destination,
      subtitle: validated.subtitle || null,
      tagline: validated.tagline || null,
      price: validated.price,
      pricing_basis: validated.pricingBasis,
      duration: validated.duration,
      duration_days: validated.durationDays || null,
      category: validated.category || 'solo',
      allowed_categories: validated.allowedCategories || validated.categories || [validated.category || 'solo'],
      service_type: validated.serviceType || 'tour',
      departure_info: validated.departureInfo || null,
      badge: validated.badge || null,
      primary_image: validated.primaryImage,
      gallery_images: validated.galleryImages,
      inclusions: validated.inclusions,
      exclusions: validated.exclusions,
      highlights: validated.highlights,
      itinerary: validated.itinerary,
      is_featured: validated.isFeatured,
      is_active: validated.isActive,
      is_customized: validated.isCustomized ?? false,
      package_type: validated.packageType || 'standard',
      display_order: validated.displayOrder ?? 10,
      important_notes: validated.importantNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', packageId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'Package ID required' }, { status: 400 });
  }

  if (!supabase) {
    return NextResponse.json({ success: true, message: 'Package deleted in offline mode' });
  }

  const isAdmin = await isAuthorizedAdmin(supabase);
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Admin privileges required' },
      { status: 403 }
    );
  }

  const { error } = await supabase.from('packages').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: 'Package deleted successfully' });
}
