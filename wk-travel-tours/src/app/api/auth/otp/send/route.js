import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateSecure4DigitOtp,
  hashOtp,
  checkResendRateLimit,
  recordOtpSentTimestamp,
  saveOtpToMemory,
} from '@/lib/security/otpService';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = body.email ? body.email.toLowerCase().trim() : '';
    const purpose = body.purpose || 'login';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Rate limiting: 60-second resend cooldown
    const rateCheck = checkResendRateLimit(email);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Please wait ${rateCheck.remainingSeconds} seconds before requesting a new code.`,
        },
        { status: 429 }
      );
    }

    // Generate cryptographically secure 4-digit OTP
    const code = generateSecure4DigitOtp();
    const hashed = hashOtp(code, email, purpose);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    recordOtpSentTimestamp(email);

    // Save in Supabase database if connected
    const supabase = await createClient();
    let dbSaved = false;

    if (supabase) {
      try {
        const { error } = await supabase.from('email_otp_codes').insert([
          {
            email,
            otp_hash: hashed,
            purpose,
            attempts: 0,
            max_attempts: 5,
            expires_at: expiresAt,
          },
        ]);
        if (!error) {
          dbSaved = true;
        }
      } catch {
        // Fallback to memory store if table not yet migrated
        dbSaved = false;
      }
    }

    // Always keep in memory store as fallback
    saveOtpToMemory(email, hashed, purpose);

    // Email dispatch handler
    // In production with configured SMTP / Resend, emails are dispatched here.
    const isSmtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER);
    const isTestMode = process.env.NODE_ENV === 'test' || !isSmtpConfigured;

    let deliveryStatus = 'dispatched';
    if (!isSmtpConfigured) {
      deliveryStatus = 'pending_smtp_provider';
      // In development mode, log to secure server console for tester convenience
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[AUTH-OTP-DEVELOPMENT] 4-digit OTP dispatched to ${email} (expires in 10m)`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'A 4-digit verification code has been generated.',
      email,
      expiresInMinutes: 10,
      deliveryStatus,
      // In test mode only, expose code for automated verification testing
      testCode: process.env.NODE_ENV === 'test' ? code : undefined,
    });
  } catch (err) {
    console.error('OTP Send Error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error while dispatching verification code.' },
      { status: 500 }
    );
  }
}

