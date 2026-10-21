import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyServerAdmin, isAuthorizedAdmin } from '@/lib/security/roles';
import { OUR_WORK_ITEMS } from '@/config/ourWorkData';

// Mutable in-memory store for offline/fallback mode
let localAgencyWork = [...OUR_WORK_ITEMS];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const includeUnpublished = searchParams.get('includeUnpublished') === 'true';

  const supabase = await createClient();
  if (!supabase) {
    const list = includeUnpublished ? localAgencyWork : localAgencyWork.filter((w) => w.isPublished);
    return NextResponse.json({ success: true, data: list, source: 'fallback' });
  }

  try {
    let query = supabase.from('agency_work').select('*').order('display_order', { ascending: true });
    if (!includeUnpublished) {
      query = query.eq('is_published', true);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      const list = includeUnpublished ? localAgencyWork : localAgencyWork.filter((w) => w.isPublished);
      return NextResponse.json({ success: true, data: list, source: 'fallback' });
    }

    const mapped = data.map((w) => ({
      ...w,
      imageUrl: w.image_url || w.imageUrl,
      travelDate: w.travel_date || w.travelDate,
      isPublished: w.is_published ?? w.isPublished ?? true,
      displayOrder: w.display_order ?? w.displayOrder ?? 0,
      departurePoint: w.departure_point || w.departurePoint || '',
      highlights: w.highlights || '',
    }));

    return NextResponse.json({ success: true, data: mapped, source: 'database' });
  } catch (err) {
    const list = includeUnpublished ? localAgencyWork : localAgencyWork.filter((w) => w.isPublished);
    return NextResponse.json({ success: true, data: list, source: 'fallback' });
  }
}

export async function POST(request) {
  const supabase = await createClient();
  const body = await request.json();

  if (!body.title || !body.imageUrl) {
    return NextResponse.json({ success: false, error: 'Title and image URL are required' }, { status: 400 });
  }

  if (!supabase) {
    const newWork = {
      id: 'work-' + Date.now(),
      title: body.title,
      category: body.category || 'group',
      imageUrl: body.imageUrl,
      destination: body.destination || '',
      description: body.description || '',
      highlights: body.highlights || '',
      travelDate: body.travelDate || '',
      milestone: body.milestone || 'Verified Operation',
      departurePoint: body.departurePoint || '',
      isPublished: body.isPublished !== false,
      displayOrder: body.displayOrder || localAgencyWork.length + 1,
    };
    localAgencyWork.unshift(newWork);
    return NextResponse.json({ success: true, data: newWork }, { status: 201 });
  }

  const isAdmin = await isAuthorizedAdmin(supabase);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Forbidden: Admin privileges required' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('agency_work')
    .insert([
      {
        title: body.title,
        category: body.category || 'group',
        image_url: body.imageUrl,
        destination: body.destination || null,
        description: body.description || null,
        travel_date: body.travelDate || null,
        is_published: body.isPublished !== false,
        display_order: body.displayOrder || 0,
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
    return NextResponse.json({ success: false, error: 'Work ID required' }, { status: 400 });
  }

  if (!supabase) {
    localAgencyWork = localAgencyWork.map((item) => (item.id === body.id ? { ...item, ...body } : item));
    return NextResponse.json({ success: true, data: body });
  }

  const isAdminPut = await isAuthorizedAdmin(supabase);
  if (!isAdminPut) {
    return NextResponse.json({ success: false, error: 'Forbidden: Admin privileges required' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('agency_work')
    .update({
      title: body.title,
      category: body.category,
      image_url: body.imageUrl,
      destination: body.destination || null,
      description: body.description || null,
      travel_date: body.travelDate || null,
      is_published: body.isPublished !== false,
      display_order: body.displayOrder ?? 0,
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
    return NextResponse.json({ success: false, error: 'Work ID required' }, { status: 400 });
  }

  if (!supabase) {
    localAgencyWork = localAgencyWork.filter((w) => w.id !== id);
    return NextResponse.json({ success: true, message: 'Work deleted in offline mode' });
  }

  const isAdminDelete = await isAuthorizedAdmin(supabase);
  if (!isAdminDelete) {
    return NextResponse.json({ success: false, error: 'Forbidden: Admin privileges required' }, { status: 403 });
  }

  const { error } = await supabase.from('agency_work').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: 'Work deleted successfully' });
}
