import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initialCategories } from '@/config/initialData';
import { verifyServerAdmin, isAuthorizedAdmin } from '@/lib/security/roles';

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ success: true, data: initialCategories, source: 'fallback' });
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ success: true, data: initialCategories, source: 'fallback' });
    }

    return NextResponse.json({ success: true, data, source: 'database' });
  } catch (err) {
    return NextResponse.json({ success: true, data: initialCategories, source: 'fallback' });
  }
}

export async function POST(request) {
  const supabase = await createClient();
  const body = await request.json();

  if (!body.name || !body.slug) {
    return NextResponse.json({ success: false, error: 'Category name and slug are required' }, { status: 400 });
  }

  if (!supabase) {
    const newCat = {
      id: 'cat-' + Date.now(),
      name: body.name.trim(),
      slug: body.slug.toLowerCase().trim(),
      description: body.description?.trim() || '',
      display_order: body.display_order || 0,
    };
    return NextResponse.json({ success: true, data: newCat }, { status: 201 });
  }

  const isAdmin = await isAuthorizedAdmin(supabase);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Forbidden: Admin privileges required' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('categories')
    .insert([
      {
        name: body.name.trim(),
        slug: body.slug.toLowerCase().trim(),
        description: body.description?.trim() || null,
        display_order: body.display_order || 0,
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
    return NextResponse.json({ success: false, error: 'Category ID is required' }, { status: 400 });
  }

  if (!supabase) {
    return NextResponse.json({ success: true, data: body });
  }

  const isAdmin = await isAuthorizedAdmin(supabase);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Forbidden: Admin privileges required' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('categories')
    .update({
      name: body.name.trim(),
      slug: body.slug.toLowerCase().trim(),
      description: body.description?.trim() || null,
      display_order: body.display_order || 0,
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
    return NextResponse.json({ success: false, error: 'Category ID required' }, { status: 400 });
  }

  if (!supabase) {
    return NextResponse.json({ success: true, message: 'Category deleted in offline mode' });
  }

  const isAdminDelete = await isAuthorizedAdmin(supabase);
  if (!isAdminDelete) {
    return NextResponse.json({ success: false, error: 'Forbidden: Admin privileges required' }, { status: 403 });
  }

  const { error } = await supabase.from('categories').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: 'Category deleted successfully' });
}

