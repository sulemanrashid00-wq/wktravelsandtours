import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 py-24 bg-white">
      <div className="max-w-md w-full text-center border border-[#E1E7EB] bg-[#F3F6F8] p-8 rounded-2xl shadow-xs">
        <span className="text-xs uppercase tracking-widest text-[#087E83] font-semibold">
          Error 404
        </span>
        <h1 className="mt-2 font-heading text-3xl font-bold text-[#10263D]">
          Destination Not Found
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-[#586775] leading-relaxed">
          The page or package you are looking for has been moved, archived, or is currently unavailable.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-[#10263D] hover:bg-[#0C1C2E] rounded transition-colors shadow-xs"
          >
            Return to Homepage
          </Link>
          <Link
            href="/packages"
            className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#10263D] bg-white border border-[#E1E7EB] hover:bg-[#F3F6F8] rounded transition-colors"
          >
            Browse All Packages
          </Link>
        </div>
      </div>
    </main>
  );
}
