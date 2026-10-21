'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import {
  IconUser,
  IconShieldCheck,
  IconCheck,
  IconEye,
  IconEyeOff,
} from '@/components/ui/Icons';

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Client-side validations
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMessage('Please provide your full legal name (minimum 2 characters).');
      return;
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter carefully.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create your customer account.');
      }

      setRegistrationComplete(true);
      setSuccessNotice(
        data.message ||
          'Your account has been created. Please check your email to verify your address before signing in.'
      );
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred during account creation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 py-16 bg-[#F3F6F8]">
      <div className="w-full max-w-lg border border-[#E1E7EB] bg-white rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="text-center space-y-1">
          <span className="text-xs uppercase tracking-widest text-[#087E83] font-semibold">
            Customer Registration
          </span>
          <h1 className="font-heading text-2xl font-bold text-[#10263D]">
            Create Traveler Account
          </h1>
          <p className="text-xs text-[#586775]">
            Register to save itineraries, manage bookings, and access tailored quotations.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 leading-relaxed"
          >
            {errorMessage}
          </div>
        )}

        {registrationComplete ? (
          <div className="space-y-6 py-4 text-center">
            <div className="w-12 h-12 bg-teal-50 border border-teal-200 rounded-full flex items-center justify-center mx-auto text-[#087E83]">
              <IconCheck className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h2 className="font-heading text-xl font-bold text-[#10263D]">
                Registration Submitted
              </h2>
              <p className="text-xs text-[#586775] leading-relaxed max-w-sm mx-auto">
                {successNotice}
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full py-3 text-xs font-semibold uppercase tracking-wider text-white bg-[#087E83] hover:bg-[#06676B] rounded transition-colors shadow-sm"
              >
                Proceed to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label
                htmlFor="register-fullname"
                className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5"
              >
                Full Legal Name
              </label>
              <input
                id="register-fullname"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Muhammad Farooq"
                required
                className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3.5 py-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
              />
            </div>

            <div>
              <label
                htmlFor="register-email"
                className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5"
              >
                Email Address
              </label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3.5 py-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
              />
              <span className="text-[11px] text-[#586775] mt-1 block">
                Booking vouchers and flight confirmations will be dispatched to this address.
              </span>
            </div>

            <div>
              <label
                htmlFor="register-phone"
                className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5"
              >
                Phone / WhatsApp Number (Optional)
              </label>
              <input
                id="register-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3.5 py-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="register-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#10263D]"
                >
                  Create Password
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
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
                className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3.5 py-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="register-confirm-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#10263D]"
                >
                  Confirm Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-xs text-[#087E83] hover:text-[#06676B] inline-flex items-center gap-1 font-medium"
                >
                  {showConfirmPassword ? (
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
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3.5 py-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#586775]">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-[#E1E7EB] text-[#087E83] focus:ring-[#087E83]"
                  required
                />
                <span>
                  I agree to the{' '}
                  <Link href="/terms" className="text-[#087E83] underline hover:text-[#06676B]" target="_blank">
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy-policy" className="text-[#087E83] underline hover:text-[#06676B]" target="_blank">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              className="w-full mt-2"
            >
              {loading ? 'Creating Traveler Account...' : 'Register as Customer'}
            </Button>
          </form>
        )}

        {/* Link back to login */}
        <div className="pt-2 text-center text-xs text-[#586775]">
          <span>Already have an account? </span>
          <Link href="/login" className="font-semibold text-[#087E83] hover:underline">
            Sign In Here &rarr;
          </Link>
        </div>

        {/* Security & Role Policy Notice */}
        <div className="pt-4 border-t border-[#E1E7EB] text-center text-xs text-[#586775] space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-[#10263D]">
            <IconShieldCheck className="w-4 h-4 text-[#087E83]" />
            <span>Strict Role Isolation Policy</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Public registration exclusively provisions verified Customer roles. Administrative privileges are strictly governed by server-side elevation.
          </p>
          <div className="pt-2">
            <Link href="/" className="font-semibold text-[#10263D] hover:text-[#087E83]">
              &larr; Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

