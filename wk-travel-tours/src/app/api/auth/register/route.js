import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const fullName = (body.fullName || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const phone = (body.phone || '').trim();
    const password = body.password || '';

    // 1. Validation
    if (!fullName || fullName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Full name must be at least 2 characters.' },
        { status: 400 }
      );
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // 2. Strict Privilege Isolation: Registration NEVER grants admin role
    const assignedRole = 'customer';

    // 3. Register via Supabase if configured
    const supabase = await createClient();

    if (!supabase) {
      // Offline / development fallback state
      return NextResponse.json({
        success: true,
        message: 'Registration simulated in development environment. Account created with customer privileges.',
        email,
        role: assignedRole,
        verificationPending: false,
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          role: assignedRole, // Enforce customer role
        },
      },
    });

    if (error) {
      // Safe handling of duplicate emails and provider errors
      const isDuplicate =
        error.message?.toLowerCase().includes('already registered') ||
        error.message?.toLowerCase().includes('duplicate') ||
        error.status === 422;

      return NextResponse.json(
        {
          success: false,
          error: isDuplicate
            ? 'An account with this email address already exists. Please sign in.'
            : error.message || 'Unable to complete registration. Please try again.',
        },
        { status: 400 }
      );
    }

    const isVerificationPending = !data.session;

    return NextResponse.json({
      success: true,
      message: isVerificationPending
        ? 'Account successfully created. Please check your email to verify your address before signing in.'
        : 'Account successfully registered and active.',
      email,
      role: assignedRole,
      verificationPending: isVerificationPending,
    });
  } catch (err) {
    console.error('Registration API Error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error processing registration.' },
      { status: 500 }
    );
  }
}

