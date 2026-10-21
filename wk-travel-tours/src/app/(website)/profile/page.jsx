import React from 'react';
import { ProfileView } from '@/components/profile/ProfileView';

export const metadata = {
  title: 'Customer Profile & Travel Preferences | WK Travel & Tours',
  description:
    'Manage your traveler profile, prefilled booking credentials, and saved itinerary preferences with WK Travel & Tours Karachi.',
};

export default function ProfilePage() {
  return (
    <main className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full bg-white">
      <div className="border-b border-[#E1E7EB] pb-6 mb-8 text-center sm:text-left">
        <span className="text-xs uppercase tracking-widest text-[#087E83] font-semibold">
          Customer Portal
        </span>
        <h1 className="mt-1 font-heading text-3xl sm:text-4xl font-bold text-[#10263D]">
          My Travel Profile
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#586775] max-w-2xl leading-relaxed">
          Keep your traveler information up to date for instantaneous booking requests, custom proposal dispatch, and visa documentation.
        </p>
      </div>

      <ProfileView />
    </main>
  );
}
