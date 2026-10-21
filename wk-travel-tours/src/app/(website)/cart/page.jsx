import React from 'react';
import { CartView } from '@/components/cart/CartView';

export const metadata = {
  title: 'Your Travel Cart & Booking Request',
  description:
    'Review your selected tour packages, specify traveller numbers, and dispatch an instant booking request to WK Travel & Tours.',
};

export default function CartPage() {
  return (
    <main className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full bg-white">
      <div className="border-b border-[#E1E7EB] pb-6 mb-8">
        <span className="text-xs uppercase tracking-widest text-[#087E83] font-semibold">
          Reservation Management
        </span>
        <h1 className="mt-1 font-heading text-3xl sm:text-4xl font-bold text-[#10263D] tracking-tight">
          Review Your Itineraries
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#586775] max-w-2xl leading-relaxed">
          Review your chosen packages, adjust travelers count, and send your booking request directly to our Karachi travel desk.
        </p>
      </div>

      <CartView />
    </main>
  );
}
