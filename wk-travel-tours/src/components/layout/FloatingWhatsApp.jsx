'use client';

import React from 'react';
import { IconWhatsApp } from '@/components/ui/Icons';
import { siteConfig } from '@/config/site';

export function FloatingWhatsApp() {
  const whatsappUrl = `https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(
    'Hello WK Travel & Tours, I have an inquiry about international tour packages and visa assistance.'
  )}`;

  return (
    <aside aria-label="Quick WhatsApp Contact" className="fixed bottom-6 right-6 z-40">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 bg-[#128C7E] hover:bg-[#075E54] text-white px-4 py-3 rounded-full border border-[#0A5C52] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-azure-600"
        aria-label="Direct WhatsApp Chat with WK Travel Consultant"
      >
        <IconWhatsApp className="w-5 h-5" />
        <span className="text-xs font-semibold tracking-wide hidden sm:inline">
          Chat on WhatsApp
        </span>
      </a>
    </aside>
  );
}

