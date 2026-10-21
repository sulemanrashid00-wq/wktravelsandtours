import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FloatingWhatsApp } from '@/components/layout/FloatingWhatsApp';

export default function WebsiteLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-brand-sand-50 text-brand-navy-900">
      <Header />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}

