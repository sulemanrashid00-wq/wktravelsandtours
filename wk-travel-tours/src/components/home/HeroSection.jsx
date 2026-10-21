'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { siteConfig } from '@/config/site';
import { IconSearch, IconMapPin, IconShieldCheck, IconPhone } from '@/components/ui/Icons';

export function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/packages?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/packages');
    }
  };

  const quickDestinations = ['Thailand', 'Baku', 'Turkey', 'Dubai', 'Malaysia', 'Bali'];

  return (
    <section className="relative bg-white text-[#10263D] py-16 sm:py-24 border-b border-[#E1E7EB] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Main Hero Copy & Discovery Search */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#F3F6F8] border border-[#E1E7EB] text-[#087E83] text-xs font-semibold uppercase tracking-wider">
              <span>WK Travel & Tours</span>
              <span>•</span>
              <span>Defence Karachi Desk</span>
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#10263D] leading-[1.1]">
              Journeys Beyond Boundaries
            </h1>

            <p className="text-sm sm:text-base text-[#586775] leading-relaxed max-w-xl">
              Curated international tours, customized family & group holidays, and dependable visit visa services with clear, upfront pricing from Karachi.
            </p>

            {/* Destination Search Box */}
            <form onSubmit={handleSearch} className="max-w-xl">
              <div className="flex items-center bg-[#F3F6F8] rounded p-1.5 border border-[#E1E7EB] focus-within:border-[#087E83] transition-colors">
                <div className="pl-3 pr-2 text-[#586775]">
                  <IconSearch className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Where would you like to travel? (e.g. Baku, Thailand, Turkey)"
                  className="w-full text-xs sm:text-sm bg-transparent text-[#10263D] placeholder:text-[#586775]/70 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-[#087E83] hover:bg-[#06676B] rounded transition-colors whitespace-nowrap shadow-sm"
                >
                  Search
                </button>
              </div>

              {/* Quick Destination Tags */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#586775]">
                <span className="text-[11px] text-[#087E83] uppercase tracking-wider font-semibold">
                  Popular:
                </span>
                {quickDestinations.map((dest) => (
                  <Link
                    key={dest}
                    href={`/packages?search=${encodeURIComponent(dest)}`}
                    className="hover:text-[#087E83] hover:underline transition-colors text-xs"
                  >
                    {dest}
                  </Link>
                ))}
              </div>
            </form>

            {/* Agency Trust Credentials */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-[#E1E7EB] text-xs text-[#586775]">
              <div className="flex items-center gap-2">
                <IconMapPin className="w-4 h-4 text-[#087E83] flex-shrink-0" />
                <span>Royal Defence Mall, Karachi</span>
              </div>
              <div className="flex items-center gap-2">
                <IconPhone className="w-4 h-4 text-[#087E83] flex-shrink-0" />
                <span>{siteConfig.contact.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <IconShieldCheck className="w-4 h-4 text-[#087E83] flex-shrink-0" />
                <span>Verified Tour Operator</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Frame */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-2xl border border-[#E1E7EB] p-4 bg-[#F3F6F8] shadow-sm flex items-center justify-center">
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-white p-4 shadow-sm border border-[#E1E7EB]">
                <Image
                  src="/images/logo/wk-travel-logo.jpeg"
                  alt="WK Travel & Tours Official Brandmark"
                  fill
                  className="object-contain p-2"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
