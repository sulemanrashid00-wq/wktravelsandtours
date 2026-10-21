import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { verifyOtpTimingSafe, verifyOtpFromMemory } from '@/lib/security/otpService';

const ADMIN_EMAILS = ['wktravelandtour@gmail.com', 'admin@wktravel.pk'];

export async function POST(request) {
  try {
    const body = await request.json();
    const email = body.email ? body.email.toLowerCase().trim() : '';
    const code = body.code ? body.code.trim() : '';
    const purpose = body.purpose || 'login';

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email and 4-digit code are required.' },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: 'Verification code must be exactly 4 numeric digits.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    let verified = false;
    let failureReason = '';

    if (supabase) {
      try {
        const { data: record, error } = await supabase
          .from('email_otp_codes')
          .select('*')
          .eq('email', email)
          .eq('purpose', purpose)
          .is('consumed_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (record && !error) {
          const isExpired = new Date(record.expires_at) < new Date();
          if (isExpired) {
            failureReason = 'Verification code has expired. Please request a new one.';
          } else if (record.attempts >= record.max_attempts) {
            failureReason = 'Too many failed attempts. Code has been invalidated.';
          } else {
            const isMatch = verifyOtpTimingSafe(code, email, record.otp_hash, purpose);
            if (isMatch) {
              verified = true;
              // Mark code consumed
              await supabase
                .from('email_otp_codes')
                .update({ consumed_at: new Date().toISOString() })
                .eq('id', record.id);
            } else {
              // Increment attempts
              await supabase
                .from('email_otp_codes')
                .update({ attempts: record.attempts + 1 })
                .eq('id', record.id);
              const remaining = record.max_attempts - (record.attempts + 1);
              failureReason = `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`;
            }
          }
        }
      } catch {
        // Fallback to memory check
      }
    }

    // If not verified through DB, check memory store fallback
    if (!verified && !failureReason) {
      const memoryResult = verifyOtpFromMemory(email, code, purpose);
      if (memoryResult.valid) {
        verified = true;
      } else {
        failureReason = memoryResult.error || 'Invalid or expired verification code.';
      }
    }

    if (!verified) {
      return NextResponse.json(
        { success: false, error: failureReason || 'Verification failed.' },
        { status: 401 }
      );
    }

    // Check administrative role
    const isAdmin = ADMIN_EMAILS.includes(email);
    const role = isAdmin ? 'admin' : 'customer';

    // Set secure authentication cookie
    const cookieStore = await cookies();
    const sessionPayload = JSON.stringify({
      email,
      role,
      verifiedAt: new Date().toISOString(),
      authType: 'otp_4_digit',
    });

    cookieStore.set('wk_auth_session', sessionPayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      message: 'Email successfully verified.',
      email,
      role,
      isAdmin,
      redirectUrl: isAdmin ? '/admin' : '/profile',
    });
  } catch (err) {
    console.error('OTP Verify Error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error while verifying code.' },
      { status: 500 }
    );
  }
}

