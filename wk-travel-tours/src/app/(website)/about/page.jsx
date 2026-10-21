import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { IconMapPin, IconPhone, IconShieldCheck, IconWhatsApp } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'About Us',
  description: 'Learn about WK Travel & Tours, Karachi, Pakistan. Our story, dedication to transparent pricing, and comprehensive travel management.',
};

export default function AboutPage() {
  return (
    <main className="py-16 px-6 sm:px-12 max-w-5xl mx-auto w-full bg-white">
      <div className="border-b border-[#E1E7EB] pb-6 mb-12">
        <span className="text-xs uppercase tracking-widest text-[#087E83] font-semibold">
          Agency Heritage & Vision
        </span>
        <h1 className="mt-1 font-heading text-3xl sm:text-4xl font-bold text-[#10263D]">
          About WK Travel & Tours
        </h1>
        <p className="mt-2 text-sm text-[#586775] max-w-2xl leading-relaxed">
          Headquartered in Karachi, Pakistan, offering dependable international holiday packages, solo travel, group tours, and expert visa assistance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center mb-16">
        <div className="md:col-span-7 space-y-5 text-sm text-[#10263D] leading-relaxed">
          <p>
            Founded with a commitment to straightforward service and verified travel itineraries, WK Travel & Tours has served hundreds of Pakistani travelers heading across Asia, the Middle East, and worldwide destinations.
          </p>
          <p>
            Unlike generic web portals with hidden charges or uncertain itineraries, our agency operates from a physical, accessible office at Royal Defence Mall in Karachi. Every package we publish includes verified return flights, quality accommodations, visa guidance, and transparent inclusions.
          </p>
          <p>
            Whether you are planning a solo exploration of Baku, a multi-country South East Asian expedition, or an intimate honeymoon in Bali or Turkey, our consultants provide tailored attention from initial planning through to your return home.
          </p>
        </div>

        <div className="md:col-span-5 border border-[#E1E7EB] bg-[#F3F6F8] p-8 rounded-2xl text-center shadow-xs">
          <div className="relative w-28 h-28 mx-auto rounded-full overflow-hidden border border-[#087E83]/30 bg-white mb-4 p-1">
            <Image
              src="/images/logo/wk-travel-logo.jpeg"
              alt="WK Travel & Tours"
              fill
              className="object-contain"
            />
          </div>
          <h2 className="font-heading text-lg font-bold text-[#10263D]">
            Journeys Beyond Boundaries
          </h2>
          <p className="text-xs text-[#586775] mt-1">
            Registered Tour Operator & Visa Consultant
          </p>
          <div className="mt-6 pt-6 border-t border-[#E1E7EB] text-xs text-[#10263D] space-y-2 text-left">
            <div className="flex items-start gap-2">
              <IconMapPin className="w-4 h-4 text-[#087E83] mt-0.5 flex-shrink-0" />
              <span>Royal Defence Mall, 3rd Floor, Office 101, Karachi</span>
            </div>
            <div className="flex items-center gap-2">
              <IconPhone className="w-4 h-4 text-[#087E83] flex-shrink-0" />
              <span>{siteConfig.contact.phone} / {siteConfig.contact.altPhone}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-[#E1E7EB] bg-[#F3F6F8] p-8 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
        <div>
          <h3 className="font-heading text-xl font-bold text-[#10263D]">
            Have Questions About an Upcoming Trip?
          </h3>
          <p className="text-xs text-[#586775] mt-1">
            Connect directly with an experienced consultant on WhatsApp or visit our Karachi office.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/packages"
            className="px-5 py-2.5 text-xs font-semibold text-white bg-[#10263D] hover:bg-[#0C1C2E] rounded transition-colors"
          >
            View Packages
          </Link>
          <a
            href={`https://wa.me/${siteConfig.contact.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 text-xs font-semibold text-white bg-[#128C7E] hover:bg-[#075E54] rounded transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <IconWhatsApp className="w-4 h-4" />
            <span>WhatsApp Us</span>
          </a>
        </div>
      </div>
    </main>
  );
}
