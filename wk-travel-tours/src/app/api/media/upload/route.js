import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { isAuthorizedAdmin } from '@/lib/security/roles';
import { validateMediaFile } from '@/lib/utils/media';

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

const ALLOWED_BUCKETS = ['packages', 'banners', 'agency-work', 'reviews'];

export async function POST(request) {
  try {
    const serverClient = await createServerClient();
    const isAdmin = await isAuthorizedAdmin(serverClient);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required for media upload' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const bucket = formData.get('bucket') || 'packages';
    const prefix = formData.get('prefix') || 'media';
    const isVideo = formData.get('isVideo') === 'true';

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { success: false, error: 'No valid file was uploaded in the request.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json(
        { success: false, error: `Invalid storage bucket: "${bucket}". Allowed: ${ALLOWED_BUCKETS.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateMediaFile(file, { allowVideo: isVideo || bucket === 'agency-work' });
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const storageClient = getStorageClient();
    if (!storageClient) {
      return NextResponse.json(
        { success: false, error: 'Storage provider is not configured in server environment.' },
        { status: 500 }
      );
    }

    // Generate strictly unique filename: timestamp + random string + clean filename
    const rawFileName = file.name || 'image.jpg';
    const cleanFileName = rawFileName
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `${Date.now()}-${randomSuffix}-${cleanFileName}`;
    const filePath = fileName;

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage with upsert: true
    const { data: uploadData, error: uploadError } = await storageClient.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = storageClient.storage.from(bucket).getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      publicUrl: urlData.publicUrl,
      path: filePath,
      filePath,
      bucket,
      fileName,
      size: file.size,
      mimeType: file.type,
    });
  } catch (err) {
    console.error('Unhandled error in /api/media/upload:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error during media upload.' },
      { status: 500 }
    );
  }
}

