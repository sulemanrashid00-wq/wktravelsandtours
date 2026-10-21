import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { siteConfig } from '@/config/site';
import {
  IconPhone,
  IconMapPin,
  IconWhatsApp,
  IconShieldCheck,
} from '@/components/ui/Icons';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#10263D] text-white border-t border-[#0C1C2E] mt-auto">
      {/* Upper Footer: Brand and Primary Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Brand Presentation */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white p-1">
                <Image
                  src="/images/logo/wk-travel-logo.jpeg"
                  alt="WK Travel & Tours"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <span className="font-heading text-xl font-bold text-white block">
                  WK Travel & Tours
                </span>
                <span className="text-[11px] uppercase tracking-widest text-[#087E83] font-semibold block">
                  Journeys Beyond Boundaries
                </span>
              </div>
            </div>

            <p className="text-xs text-[#C4D1DB] leading-relaxed max-w-sm">
              Karachi-based bespoke travel agency specializing in international holiday packages, solo travel, customized family and group vacations, and transparent tourist visa processing.
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs text-[#9DB3C4]">
              <IconShieldCheck className="w-4 h-4 text-[#087E83] flex-shrink-0" />
              <span>Registered Travel Consultancy & Tour Operator in Pakistan</span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[#087E83]">
              Explore Journeys
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/packages" className="text-[#C4D1DB] hover:text-white transition-colors">
                  International Packages
                </Link>
              </li>
              <li>
                <Link href="/packages?category=solo" className="text-[#C4D1DB] hover:text-white transition-colors">
                  Solo Travelers
                </Link>
              </li>
              <li>
                <Link href="/packages?category=friends" className="text-[#C4D1DB] hover:text-white transition-colors">
                  Friends & Group Tours
                </Link>
              </li>
              <li>
                <Link href="/packages?category=family" className="text-[#C4D1DB] hover:text-white transition-colors">
                  Family Vacations
                </Link>
              </li>
              <li>
                <Link href="/packages?category=honeymoon" className="text-[#C4D1DB] hover:text-white transition-colors">
                  Honeymoon Escapes
                </Link>
              </li>
              <li>
                <Link href="/packages?category=visa" className="text-[#C4D1DB] hover:text-white transition-colors">
                  Visit Visa Services
                </Link>
              </li>
              <li>
                <Link href="/custom-trip" className="text-[#C4D1DB] hover:text-white transition-colors">
                  Custom Itinerary Request
                </Link>
              </li>
            </ul>
          </div>

          {/* Physical Office & Direct Inquiries */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[#087E83]">
              Karachi Office & Inquiries
            </h3>
            <div className="space-y-3 text-xs text-[#C4D1DB]">
              <div className="flex items-start gap-2.5">
                <IconMapPin className="w-4 h-4 text-[#087E83] mt-0.5 flex-shrink-0" />
                <span>{siteConfig.contact.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <IconPhone className="w-4 h-4 text-[#087E83] flex-shrink-0" />
                <span>
                  {siteConfig.contact.phone} / {siteConfig.contact.altPhone}
                </span>
              </div>
              <div className="pt-2">
                <a
                  href={`https://wa.me/${siteConfig.contact.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#128C7E] hover:bg-[#075E54] rounded transition-colors"
                >
                  <IconWhatsApp className="w-4 h-4" />
                  <span>WhatsApp Consultant (+92 337 2614742)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Bar: Copyright & Mandatory Legal Links */}
      <div className="border-t border-[#0C1C2E] bg-[#07121F] py-6 px-4 sm:px-6 lg:px-8 text-xs text-[#9DB3C4]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {currentYear} {siteConfig.legalName}. All rights reserved.</p>
          <div className="flex items-center gap-6 text-xs">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/reviews" className="hover:text-white transition-colors">
              Client Feedback
            </Link>
            <Link href="/our-work" className="hover:text-white transition-colors">
              Completed Tours
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
