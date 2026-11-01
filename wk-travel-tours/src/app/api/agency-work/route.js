import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { verifyServerAdmin, isAuthorizedAdmin } from '@/lib/security/roles';
import { OUR_WORK_ITEMS } from '@/config/ourWorkData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Mutable in-memory store for offline/fallback mode
let localAgencyWork = [...OUR_WORK_ITEMS];

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    return createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const includeUnpublished = searchParams.get('includeUnpublished') === 'true';

  const adminClient = getAdminClient();
  const serverClient = await createServerClient();
  const dbClient = adminClient || serverClient;

  if (!dbClient) {
    const list = includeUnpublished ? localAgencyWork : localAgencyWork.filter((w) => w.isPublished);
    return NextResponse.json({ success: true, data: list, source: 'fallback' });
  }

  try {
    let query = dbClient.from('agency_work').select('*').order('display_order', { ascending: true });
    if (!includeUnpublished) {
      query = query.eq('is_published', true);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      const list = includeUnpublished ? localAgencyWork : localAgencyWork.filter((w) => w.isPublished);
      return NextResponse.json({ success: true, data: list, source: 'fallback' });
    }

    // Merge each DB row with rich metadata from OUR_WORK_ITEMS to guarantee
    // destination, highlights, milestone, and authentic image URLs are always 100% complete
    const mapped = data.map((w, idx) => {
      const img = w.image_url || w.imageUrl || '';
      const fallback =
        OUR_WORK_ITEMS.find((item) => item.imageUrl === img || item.displayOrder === (w.display_order ?? w.displayOrder)) ||
        OUR_WORK_ITEMS[idx] ||
        {};

      // Guard against any legacy package flyer reference
      const safeImg = img && !img.includes('/images/packages/') ? img : fallback.imageUrl || img;

      return {
        ...fallback,
        ...w,
        id: w.id || fallback.id,
        title: w.title || fallback.title,
        category: (w.category || fallback.category || 'group').toLowerCase(),
        imageUrl: safeImg,
        destination: w.destination || fallback.destination || '',
        description: w.description || fallback.description || '',
        highlights: w.highlights || fallback.highlights || '',
        travelDate: w.travel_date || w.travelDate || fallback.travelDate || '',
        milestone: w.milestone || fallback.milestone || 'Verified Operation',
        departurePoint: w.departure_point || w.departurePoint || fallback.departurePoint || '',
        isPublished: w.is_published ?? w.isPublished ?? true,
        displayOrder: w.display_order ?? w.displayOrder ?? fallback.displayOrder ?? idx + 1,
      };
    });

    // Return mapped database records when present, fallback to static defaults if database empty
    const result = mapped.length > 0 ? mapped : OUR_WORK_ITEMS;
    return NextResponse.json({ success: true, data: result, source: 'database' });
  } catch (err) {
    console.error('Error in /api/agency-work GET:', err);
    const list = includeUnpublished ? localAgencyWork : localAgencyWork.filter((w) => w.isPublished);
    return NextResponse.json({ success: true, data: list, source: 'fallback' });
  }
}

export async function POST(request) {
  const adminClient = getAdminClient();
  const serverClient = await createServerClient();
  const dbClient = adminClient || serverClient;

  const body = await request.json();

  if (!body.title || !body.imageUrl) {
    return NextResponse.json({ success: false, error: 'Title and image URL are required' }, { status: 400 });
  }

  if (!dbClient) {
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

  const isAdmin = await isAuthorizedAdmin(serverClient);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Forbidden: Admin privileges required' }, { status: 403 });
  }

  const { data, error } = await dbClient
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
  const adminClient = getAdminClient();
  const serverClient = await createServerClient();
  const dbClient = adminClient || serverClient;

  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ success: false, error: 'Work ID required' }, { status: 400 });
  }

  if (!dbClient) {
    localAgencyWork = localAgencyWork.map((item) => (item.id === body.id ? { ...item, ...body } : item));
    return NextResponse.json({ success: true, data: body });
  }

  const isAdminPut = await isAuthorizedAdmin(serverClient);
  if (!isAdminPut) {
    return NextResponse.json({ success: false, error: 'Forbidden: Admin privileges required' }, { status: 403 });
  }

  const updateFields = {
    title: body.title,
    category: body.category,
    image_url: body.imageUrl,
    description: body.description || null,
    travel_date: body.travelDate || null,
    is_published: body.isPublished !== false,
    display_order: body.displayOrder ?? 0,
  };

  if (body.destination !== undefined) updateFields.destination = body.destination;

  const { data, error } = await dbClient
    .from('agency_work')
    .update(updateFields)
    .eq('id', body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(request) {
  const adminClient = getAdminClient();
  const serverClient = await createServerClient();
  const dbClient = adminClient || serverClient;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'Work ID required' }, { status: 400 });
  }

  if (!dbClient) {
    localAgencyWork = localAgencyWork.filter((w) => w.id !== id);
    return NextResponse.json({ success: true, message: 'Work deleted in offline mode' });
  }

  const isAdminDelete = await isAuthorizedAdmin(serverClient);
  if (!isAdminDelete) {
    return NextResponse.json({ success: false, error: 'Forbidden: Admin privileges required' }, { status: 403 });
  }

  const { error } = await dbClient.from('agency_work').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: 'Work deleted successfully' });
}
