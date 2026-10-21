import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initialBanners } from '@/config/initialData';
import { verifyServerAdmin, isAuthorizedAdmin } from '@/lib/security/roles';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('includeInactive') === 'true';

  const supabase = await createClient();
  if (!supabase) {
    const list = includeInactive
      ? initialBanners
      : initialBanners.filter((b) => b.isActive !== false);
    return NextResponse.json({ success: true, data: list, source: 'fallback' });
  }

  try {
    let query = supabase.from('promotional_banners').select('*').order('display_order', { ascending: true });
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return NextResponse.json({ success: true, data: initialBanners, source: 'fallback' });
    }

    // Map snake_case to camelCase
    const mapped = data.map((b) => ({
      ...b,
      image: b.image_url || b.image,
      targetTripType: b.target_trip_type || b.targetTripType,
      targetUrl: b.target_url || b.targetUrl,
      displayOrder: b.display_order ?? b.displayOrder ?? 0,
      isActive: b.is_active ?? b.isActive ?? true,
    }));

    return NextResponse.json({ success: true, data: mapped, source: 'database' });
  } catch (err) {
    return NextResponse.json({ success: true, data: initialBanners, source: 'fallback' });
  }
}

export async function POST(request) {
  const supabase = await createClient();
  const body = await request.json();

  if (!body.title || !body.image) {
    return NextResponse.json({ success: false, error: 'Title and image are required' }, { status: 400 });
  }

  if (!supabase) {
    const newBanner = {
      id: 'b-' + Date.now(),
      title: body.title,
      subtitle: body.subtitle || '',
      badge: body.badge || 'Campaign',
      image: body.image,
      targetTripType: body.targetTripType || 'family',
      targetUrl: body.targetUrl || '/custom-trip',
      displayOrder: body.displayOrder || 0,
      isActive: true,
    };
    return NextResponse.json({ success: true, data: newBanner }, { status: 201 });
  }

  const isAdmin = await isAuthorizedAdmin(supabase);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Forbidden: Admin privileges required' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('promotional_banners')
    .insert([
      {
        title: body.title,
        subtitle: body.subtitle || null,
        badge: body.badge || null,
        image_url: body.image,
        target_trip_type: body.targetTripType || 'family',
        target_url: body.targetUrl || '/custom-trip',
        display_order: body.displayOrder || 0,
        is_active: body.isActive !== false,
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

  if (!body.id) {
    return NextResponse.json({ success: false, error: 'Banner ID is required' }, { status: 400 });
  }

  if (!supabase) {
    return NextResponse.json({ success: true, data: body });
  }

  const isAdmin = await isAuthorizedAdmin(supabase);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Forbidden: Admin privileges required' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('promotional_banners')
    .update({
      title: body.title,
      subtitle: body.subtitle || null,
      badge: body.badge || null,
      image_url: body.image || body.imageUrl,
      target_trip_type: body.targetTripType || 'family',
      target_url: body.targetUrl || '/custom-trip',
      display_order: body.displayOrder ?? 0,
      is_active: body.isActive !== false,
    })
    .eq('id', body.id)
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
    return NextResponse.json({ success: false, error: 'Banner ID required' }, { status: 400 });
  }

  if (!supabase) {
    return NextResponse.json({ success: true, message: 'Banner deleted in offline mode' });
  }

  const isAdminDelete = await isAuthorizedAdmin(supabase);
  if (!isAdminDelete) {
    return NextResponse.json({ success: false, error: 'Forbidden: Admin privileges required' }, { status: 403 });
  }

  const { error } = await supabase.from('promotional_banners').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: 'Banner deleted successfully' });
}

