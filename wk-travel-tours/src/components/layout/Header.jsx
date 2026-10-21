'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/config/site';
import { useCartStore } from '@/stores/cartStore';
import { CartDrawer } from '@/components/cart/CartDrawer';
import {
  IconPhone,
  IconMapPin,
  IconShoppingBag,
  IconUser,
  IconMenu,
  IconClose,
  IconWhatsApp,
} from '@/components/ui/Icons';

export function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const items = useCartStore((state) => state.items);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const packageCount = mounted ? items.length : 0;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#E1E7EB] bg-white/95 backdrop-blur">
      {/* Top Utility Bar */}
      <div className="bg-[#10263D] text-[#C4D1DB] text-xs py-2 px-4 sm:px-8 border-b border-[#0C1C2E]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-[11px] sm:text-xs">
            <span className="flex items-center gap-1.5">
              <IconMapPin className="w-3.5 h-3.5 text-[#087E83]" />
              <span>Royal Defence Mall, 3rd Floor, Off 101, Karachi</span>
            </span>
            <span className="hidden md:inline-block text-[#586775]">|</span>
            <a
              href={`tel:${siteConfig.contact.phone}`}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <IconPhone className="w-3.5 h-3.5 text-[#087E83]" />
              <span>{siteConfig.contact.phone}</span>
            </a>
            <span className="hidden lg:inline text-[#586775]">/</span>
            <a
              href={`tel:${siteConfig.contact.altPhone}`}
              className="hidden lg:inline hover:text-white transition-colors"
            >
              {siteConfig.contact.altPhone}
            </a>
          </div>

          <div className="flex items-center gap-4 text-[11px] sm:text-xs">
            <span className="text-white font-medium">Journeys Beyond Boundaries</span>
            <a
              href={`https://wa.me/${siteConfig.contact.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#25D366] hover:text-emerald-300 font-semibold"
            >
              <IconWhatsApp className="w-3.5 h-3.5" />
              <span>WhatsApp Us</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Logo and Brand Title */}
        <Link href="/" className="flex items-center gap-3 group focus-visible:outline-none">
          <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-[#E1E7EB] bg-white flex-shrink-0 shadow-sm">
            <Image
              src="/images/logo/wk-travel-logo.jpeg"
              alt="WK Travel & Tours"
              fill
              className="object-contain p-1"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-bold text-lg sm:text-xl tracking-tight text-[#10263D] group-hover:text-[#087E83] transition-colors">
              WK Travel & Tours
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#586775] font-semibold">
              Karachi, Pakistan
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-1 xl:gap-2">
          {siteConfig.navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-xs uppercase tracking-wider font-semibold px-3 py-2 rounded transition-colors ${
                  isActive
                    ? 'text-[#087E83] bg-[#F3F6F8] font-bold'
                    : 'text-[#586775] hover:text-[#10263D] hover:bg-[#F3F6F8]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Cart, Profile & Custom Trip CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/profile"
            aria-label="My Traveler Profile"
            title="My Profile & Preferences"
            className={`p-2.5 text-[#10263D] hover:text-[#087E83] bg-[#F3F6F8] border border-[#E1E7EB] hover:bg-white rounded transition-colors ${
              pathname === '/profile' ? 'bg-white text-[#087E83] ring-1 ring-[#087E83]' : ''
            }`}
          >
            <IconUser className="w-5 h-5" />
          </Link>

          <button
            type="button"
            onClick={openDrawer}
            aria-label={`Open cart with ${packageCount} selected packages`}
            className="relative p-2.5 text-[#10263D] hover:text-[#087E83] bg-[#F3F6F8] border border-[#E1E7EB] hover:bg-white rounded transition-colors"
          >
            <IconShoppingBag className="w-5 h-5" />
            {packageCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#087E83] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-white">
                {packageCount}
              </span>
            )}
          </button>

          <Link
            href="/custom-trip"
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#087E83] hover:bg-[#06676B] rounded transition-colors shadow-sm"
          >
            Plan Custom Trip
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-2 text-[#10263D] hover:bg-[#F3F6F8] rounded transition-colors"
          >
            {isMobileMenuOpen ? <IconClose className="w-6 h-6" /> : <IconMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E1E7EB] bg-white px-4 py-6 space-y-4">
          <nav aria-label="Mobile Navigation" className="flex flex-col space-y-1">
            {siteConfig.navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-semibold px-3 py-2.5 rounded transition-colors ${
                    isActive
                      ? 'bg-[#F3F6F8] text-[#087E83] font-bold'
                      : 'text-[#10263D] hover:bg-[#F3F6F8]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/profile"
              className={`text-sm font-semibold px-3 py-2.5 rounded transition-colors flex items-center justify-between ${
                pathname === '/profile'
                  ? 'bg-[#F3F6F8] text-[#087E83] font-bold'
                  : 'text-[#10263D] hover:bg-[#F3F6F8]'
              }`}
            >
              <span>My Traveler Profile</span>
              <span className="text-[11px] font-normal text-[#586775]">Preferences</span>
            </Link>
          </nav>

          <div className="pt-4 border-t border-[#E1E7EB] flex flex-col gap-2.5">
            <Link
              href="/custom-trip"
              className="w-full py-3 text-center text-xs font-semibold uppercase tracking-wider text-white bg-[#087E83] hover:bg-[#06676B] rounded transition-colors"
            >
              Plan Custom Trip
            </Link>
            <a
              href={`https://wa.me/${siteConfig.contact.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 text-center text-xs font-semibold text-white bg-[#128C7E] rounded flex items-center justify-center gap-2"
            >
              <IconWhatsApp className="w-4 h-4" />
              <span>Contact Consultant via WhatsApp</span>
            </a>
          </div>
        </div>
      )}

      {/* Cart Drawer Modal */}
      <CartDrawer />
    </header>
  );
}
