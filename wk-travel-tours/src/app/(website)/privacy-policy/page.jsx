import React from 'react';
import { siteConfig } from '@/config/site';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy and data protection practices of WK Travel & Tours.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="py-16 px-6 sm:px-12 max-w-4xl mx-auto w-full">
      <div className="border-b border-brand-sand-200 pb-6 mb-8">
        <span className="text-xs uppercase tracking-widest text-brand-gold font-semibold">
          Customer Data Protection
        </span>
        <h1 className="mt-1 font-heading text-3xl sm:text-4xl font-bold text-brand-navy-900">
          Privacy Policy
        </h1>
        <p className="mt-2 text-xs text-brand-navy-600">
          Effective Date: January 1, 2026. Last updated: October 2026.
        </p>
      </div>

      <div className="space-y-8 text-sm text-brand-navy-800 leading-relaxed">
        <section>
          <h2 className="font-heading text-xl font-bold text-brand-navy-900 mb-3">
            1. Information We Collect
          </h2>
          <p>
            WK Travel & Tours collects information necessary to arrange international flight bookings, hotel reservations, visa processing, and customized itineraries. This includes your name, contact telephone numbers, email address, passport identification details for visa filing, and travel preferences submitted via our request forms or direct communication channels.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold text-brand-navy-900 mb-3">
            2. Purpose and Use of Information
          </h2>
          <p>
            Your details are utilized solely for:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-brand-navy-700">
            <li>Processing flight tickets and hotel vouchers with verified travel suppliers</li>
            <li>Preparing and submitting tourist visa documentation to embassies and immigration portals</li>
            <li>Communicating booking updates, itinerary details, and flight schedules via phone or WhatsApp</li>
            <li>Responding to customized group and family holiday inquiries</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold text-brand-navy-900 mb-3">
            3. Data Sharing and Third Parties
          </h2>
          <p>
            We do not sell, rent, or monetize client personal data. Information is shared strictly with authorized airlines, overseas destination management companies (DMCs), and official visa filing centers exclusively as required to execute your booked travel arrangements.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold text-brand-navy-900 mb-3">
            4. Storage and Data Security
          </h2>
          <p>
            We apply technical safeguards, restricted administrative access, and encrypted transport protocols. Sensitive personal documents submitted for visa assistance are retained only for the duration required to complete the filing and administrative review.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold text-brand-navy-900 mb-3">
            5. Contact for Privacy Inquiries
          </h2>
          <p>
            For questions regarding your personal information or to request data removal, contact our data administrator at {siteConfig.contact.email} or visit our registered office at {siteConfig.contact.address}.
          </p>
        </section>
      </div>
    </main>
  );
}

