'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmail } from '@/services/authService';
import { createClient } from '@/lib/supabase/client';
import {
  IconShieldCheck,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconUser,
} from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/admin';
  const unauthorizedError = searchParams.get('error') === 'unauthorized';

  // Auth Method: 'otp' | 'password'
  const [authMethod, setAuthMethod] = useState('otp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Flow states: 'enter_email' | 'enter_code'
  const [otpStage, setOtpStage] = useState('enter_email');
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    unauthorizedError
      ? 'Administrative verification required. Please sign in with verified credentials.'
      : ''
  );
  const [successNotice, setSuccessNotice] = useState('');
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setIsSupabaseConfigured(false);
    }
  }, []);

  // Countdown timer for 60-second resend throttle
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Request 4-digit code
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, purpose: 'login' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch verification code.');
      }

      setOtpStage('enter_code');
      setResendCooldown(60);
      setSuccessNotice(`A 4-digit verification code has been dispatched to ${cleanEmail}.`);
    } catch (err) {
      setErrorMessage(err.message || 'Unable to dispatch verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify 4-digit code
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length !== 4) {
      setErrorMessage('Please enter the complete 4-digit numeric verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: cleanCode,
          purpose: 'login',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed. Code may be invalid or expired.');
      }

      setSuccessNotice('Verification confirmed. Loading your session...');
      setTimeout(() => {
        router.push(data.redirectUrl || redirectPath);
        router.refresh();
      }, 400);
    } catch (err) {
      setErrorMessage(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Password sign-in using actual configured provider
  const handlePasswordSignIn = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMessage('Please provide both your account email and password.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(cleanEmail, password);
      setSuccessNotice('Authentication successful. Redirecting...');
      setTimeout(() => {
        router.push(redirectPath);
        router.refresh();
      }, 400);
    } catch (err) {
      setErrorMessage(
        err.message || 'Authentication failed. Please verify your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md border border-[#E1E7EB] bg-white rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
      <div className="text-center space-y-1">
        <span className="text-xs uppercase tracking-widest text-[#087E83] font-semibold">
          Secure Access Portal
        </span>
        <h1 className="font-heading text-2xl font-bold text-[#10263D]">
          Sign In to Your Account
        </h1>
        <p className="text-xs text-[#586775]">
          Sign in to manage your customer travel bookings or administrative console.
        </p>
      </div>

      {/* Auth Method Toggle */}
      <div
        role="tablist"
        aria-label="Authentication Method"
        className="grid grid-cols-2 gap-1 bg-[#F3F6F8] p-1 rounded-lg border border-[#E1E7EB] text-xs font-semibold"
      >
        <button
          type="button"
          role="tab"
          aria-selected={authMethod === 'otp'}
          onClick={() => {
            setAuthMethod('otp');
            setErrorMessage('');
            setSuccessNotice('');
          }}
          className={`py-2 px-3 rounded transition-colors text-center ${
            authMethod === 'otp'
              ? 'bg-white text-[#10263D] shadow-xs'
              : 'text-[#586775] hover:text-[#10263D]'
          }`}
        >
          4-Digit Email OTP
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={authMethod === 'password'}
          onClick={() => {
            setAuthMethod('password');
            setErrorMessage('');
            setSuccessNotice('');
          }}
          className={`py-2 px-3 rounded transition-colors text-center ${
            authMethod === 'password'
              ? 'bg-white text-[#10263D] shadow-xs'
              : 'text-[#586775] hover:text-[#10263D]'
          }`}
        >
          Password Sign In
        </button>
      </div>

      {/* Status Banners */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 leading-relaxed"
        >
          {errorMessage}
        </div>
      )}

      {successNotice && (
        <div
          role="status"
          className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-[#087E83] flex items-center gap-2 font-medium"
        >
          <IconCheck className="w-4 h-4 shrink-0 text-[#087E83]" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* METHOD 1: 4-DIGIT EMAIL OTP */}
      {authMethod === 'otp' && (
        <div className="space-y-4">
          <div className="bg-[#F3F6F8] p-3 rounded-lg border border-[#E1E7EB] text-[11px] text-[#586775] leading-relaxed">
            <strong className="text-[#10263D] font-semibold block mb-0.5">
              Passwordless Verification
            </strong>
            Enter your email to receive a secure, single-use 4-digit code. Valid for 10 minutes.
          </div>

          {otpStage === 'enter_email' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label
                  htmlFor="otp-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="otp-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3.5 py-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={loading || resendCooldown > 0}
                className="w-full"
              >
                {loading
                  ? 'Dispatching Code...'
                  : resendCooldown > 0
                  ? `Wait ${resendCooldown}s to Resend`
                  : 'Send 4-Digit Verification Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="otp-code-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#10263D]"
                  >
                    Enter 4-Digit Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStage('enter_email');
                      setOtpCode('');
                      setErrorMessage('');
                    }}
                    className="text-[11px] font-semibold text-[#087E83] hover:underline"
                  >
                    Change Email
                  </button>
                </div>

                <div className="text-xs text-[#586775]">
                  Verification code dispatched to{' '}
                  <strong className="text-[#10263D]">{email}</strong>
                </div>

                <input
                  id="otp-code-input"
                  type="text"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="••••"
                  required
                  autoFocus
                  className="w-full text-center tracking-[0.6em] text-2xl font-bold bg-white border border-[#E1E7EB] rounded py-3 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                />
                <span className="text-[11px] text-[#586775] text-center block">
                  Enter the 4 numeric digits sent to your inbox.
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={loading || otpCode.length !== 4}
                className="w-full"
              >
                {loading ? 'Verifying...' : 'Verify Code & Sign In'}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={() => handleSendOtp(null)}
                  className={`text-xs ${
                    resendCooldown > 0
                      ? 'text-[#586775] cursor-not-allowed'
                      : 'text-[#087E83] font-semibold hover:underline'
                  }`}
                >
                  {resendCooldown > 0
                    ? `Resend available in ${resendCooldown}s`
                    : 'Resend Verification Code'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* METHOD 2: PASSWORD LOGIN */}
      {authMethod === 'password' && (
        <form onSubmit={handlePasswordSignIn} className="space-y-4">
          <div>
            <label
              htmlFor="password-email"
              className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5"
            >
              Account Email
            </label>
            <input
              id="password-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3.5 py-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="account-password"
                className="block text-xs font-semibold uppercase tracking-wider text-[#10263D]"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-[#087E83] hover:text-[#06676B] inline-flex items-center gap-1 font-medium"
              >
                {showPassword ? (
                  <>
                    <IconEyeOff className="w-3.5 h-3.5" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <IconEye className="w-3.5 h-3.5" />
                    <span>Show</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <input
                id="account-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your account password"
                required
                className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3.5 py-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83] pr-10"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading || !isSupabaseConfigured}
            className="w-full"
          >
            {loading ? 'Authenticating...' : 'Sign In with Password'}
          </Button>
        </form>
      )}

      {/* Registration Link for New Customers */}
      <div className="pt-2 text-center text-xs text-[#586775]">
        <span>New traveler to WK Travel & Tours? </span>
        <Link
          href="/register"
          className="font-semibold text-[#087E83] hover:underline"
        >
          Create Customer Account &rarr;
        </Link>
      </div>

      {/* Security Notice & Homepage Navigation */}
      <div className="pt-4 border-t border-[#E1E7EB] text-center text-xs text-[#586775] space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-[#10263D]">
          <IconShieldCheck className="w-4 h-4 text-[#087E83]" />
          <span>Server-side Role Authorization Enforced</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Sessions are cryptographically bound via secure HTTP-only cookies and Row Level Security.
        </p>
        <div className="pt-2">
          <Link href="/" className="font-semibold text-[#10263D] hover:text-[#087E83]">
            &larr; Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 py-16 bg-[#F3F6F8]">
      <Suspense fallback={<div className="text-xs text-[#586775]">Loading sign in portal...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
