import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { isAuthorizedAdmin } from '@/lib/security/roles';

export const dynamic = 'force-dynamic';

function getStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && serviceKey) {
    return createSupabaseClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return null;
}

export async function DELETE(request) {
  try {
    const serverClient = await createServerClient();
    const isAdmin = await isAuthorizedAdmin(serverClient);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required to delete media' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get('bucket') || 'packages';
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ success: false, error: 'Media path parameter required' }, { status: 400 });
    }

    const storageClient = getStorageClient();
    if (!storageClient) {
      return NextResponse.json({ success: false, error: 'Storage provider not configured' }, { status: 500 });
    }

    const { error } = await storageClient.storage.from(bucket).remove([path]);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Media removed successfully' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

