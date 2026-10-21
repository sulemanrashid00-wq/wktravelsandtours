import React from 'react';
import { siteConfig } from '@/config/site';

export const metadata = {
  title: 'Terms of Service',
  description: 'Terms of service, booking policies, and travel disclaimers for WK Travel & Tours.',
};

export default function TermsPage() {
  return (
    <main className="py-16 px-6 sm:px-12 max-w-4xl mx-auto w-full">
      <div className="border-b border-brand-sand-200 pb-6 mb-8">
        <span className="text-xs uppercase tracking-widest text-brand-gold font-semibold">
          Legal Agreement
        </span>
        <h1 className="mt-1 font-heading text-3xl sm:text-4xl font-bold text-brand-navy-900">
          Terms of Service & Booking Conditions
        </h1>
        <p className="mt-2 text-xs text-brand-navy-600">
          Please review the following booking terms before making reservations with WK Travel & Tours.
        </p>
      </div>

      <div className="space-y-8 text-sm text-brand-navy-800 leading-relaxed">
        <section>
          <h2 className="font-heading text-xl font-bold text-brand-navy-900 mb-3">
            1. Booking Requests and Inquiries
          </h2>
          <p>
            Submitting a booking request, cart checkout, or custom trip form via our website or initiating communication via WhatsApp does not constitute a confirmed travel reservation. A booking is considered confirmed only after availability is validated by our agency staff, advance payment is deposited, and an official booking receipt is generated.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold text-brand-navy-900 mb-3">
            2. Package Pricing and Rate Fluctuations
          </h2>
          <p>
            All listed package prices are quoted in Pakistani Rupees (PKR) and are generally calculated on a twin-sharing per-person basis unless specified as a fixed service fee. Airline fares, airport taxes, and currency exchange rates fluctuate continuously; consequently, package rates are subject to reconfirmation until ticket issuance and hotel voucher issuance are completed.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold text-brand-navy-900 mb-3">
            3. Tourist Visa Processing Disclaimer
          </h2>
          <p>
            WK Travel & Tours provides professional visa guidance, application verification, and submission assistance. The authority to grant, reject, or delay any visa rests exclusively with the respective embassy, consulate, or sovereign immigration authority. Processing fees paid to embassies and handling charges are non-refundable regardless of the immigration decision.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold text-brand-navy-900 mb-3">
            4. Traveler Responsibilities
          </h2>
          <p>
            Travelers must ensure their passport holds a minimum validity of 6 months beyond the intended return date. Clients are responsible for providing authentic documents and complying with the health, customs, and immigration laws of destination countries.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold text-brand-navy-900 mb-3">
            5. Cancellations and Refunds
          </h2>
          <p>
            Cancellation charges depend upon individual airline fare rules and hotel supplier conditions. In case of cancellation requests, applicable non-refundable components and administrative processing fees will be deducted prior to any refund.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold text-brand-navy-900 mb-3">
            6. Agency Location and Jurisdiction
          </h2>
          <p>
            These terms are governed by the laws applicable in Karachi, Pakistan. For disputes or official correspondence, visit our corporate office at {siteConfig.contact.address}.
          </p>
        </section>
      </div>
    </main>
  );
}

