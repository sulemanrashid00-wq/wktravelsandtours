'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AdminPackagesManager } from './AdminPackagesManager';
import { AdminCategoriesManager } from './AdminCategoriesManager';
import { AdminBannersManager } from './AdminBannersManager';
import { AdminReviewsModerator } from './AdminReviewsModerator';
import { AdminAgencyWorkManager } from './AdminAgencyWorkManager';
import { AdminBookingsViewer } from './AdminBookingsViewer';
import { signOutUser } from '@/services/authService';
import { IconShieldCheck } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';

export function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('packages');

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch {
      // Ignored
    }
    router.push('/login');
    router.refresh();
  };

  const tabs = [
    { id: 'packages', label: 'Package Catalogue' },
    { id: 'categories', label: 'Categories & Sections' },
    { id: 'banners', label: 'Promotional Banners' },
    { id: 'reviews', label: 'Reviews Moderation' },
    { id: 'work', label: 'Agency Work Gallery' },
    { id: 'bookings', label: 'Inquiries & Bookings' },
  ];

  return (
    <div className="min-h-screen bg-white text-[#10263D] flex flex-col font-sans">
      {/* Admin Top Bar */}
      <header className="bg-[#10263D] text-white border-b border-[#0C1C2E] sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-white p-1 flex-shrink-0 border border-white/20">
              <Image
                src="/images/logo/wk-travel-logo.jpeg"
                alt="WK Travel & Tours"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <span className="font-heading font-bold text-base text-white block leading-tight">
                WK Travel & Tours
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#087E83] font-bold block">
                Administrative Management Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded bg-white/10 text-white/90 border border-white/10">
              <IconShieldCheck className="w-4 h-4 text-[#087E83]" />
              <span className="font-medium">Verified Administrator</span>
            </div>

            <Link
              href="/"
              target="_blank"
              className="px-3 py-1.5 border border-white/20 hover:bg-white/10 text-white rounded transition-colors text-xs font-medium"
            >
              Public Website &rarr;
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded font-semibold transition-colors text-xs"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="border-t border-white/10 bg-[#0C1C2E] overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#087E83] text-[#087E83] bg-[#10263D] font-bold'
                    : 'border-transparent text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Admin Workspace Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'packages' && <AdminPackagesManager />}
        {activeTab === 'categories' && <AdminCategoriesManager />}
        {activeTab === 'banners' && <AdminBannersManager />}
        {activeTab === 'reviews' && <AdminReviewsModerator />}
        {activeTab === 'work' && <AdminAgencyWorkManager />}
        {activeTab === 'bookings' && <AdminBookingsViewer />}
      </main>

      {/* Admin Footer */}
      <footer className="py-4 border-t border-[#E1E7EB] text-center text-xs text-[#586775] bg-[#F3F6F8]">
        WK Travel & Tours Internal Operations Portal • Royal Defence Mall, 3rd Floor, Off 101, Karachi • All operations secured
      </footer>
    </div>
  );
}
