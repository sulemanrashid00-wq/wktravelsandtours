'use client';

import React, { useState } from 'react';
import { siteConfig } from '@/config/site';
import { IconMapPin, IconPhone, IconClock, IconWhatsApp, IconCheck } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const whatsappInquiryUrl = `https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(
    `Hello WK Travel, my name is ${form.name || 'Traveler'}. I would like to inquire about: ${form.message || 'Travel packages and visas'}`
  )}`;

  return (
    <main className="py-16 px-6 sm:px-12 max-w-5xl mx-auto w-full bg-white">
      <div className="border-b border-[#E1E7EB] pb-6 mb-12">
        <span className="text-xs uppercase tracking-widest text-[#087E83] font-semibold">
          Customer Service & Consultation
        </span>
        <h1 className="mt-1 font-heading text-3xl sm:text-4xl font-bold text-[#10263D]">
          Contact WK Travel & Tours
        </h1>
        <p className="mt-2 text-sm text-[#586775] max-w-2xl leading-relaxed">
          Visit our office in Defence Karachi, call our travel desk, or start an immediate chat via WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Office Details */}
        <div className="md:col-span-5 space-y-6">
          <div className="border border-[#E1E7EB] bg-[#F3F6F8] p-6 rounded-2xl space-y-5 shadow-xs">
            <h2 className="font-heading text-lg font-bold text-[#10263D]">
              Karachi Head Office
            </h2>

            <div className="flex items-start gap-3 text-xs text-[#10263D]">
              <IconMapPin className="w-5 h-5 text-[#087E83] mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold block text-[#10263D]">Address</span>
                <p className="mt-0.5 leading-relaxed text-[#586775]">{siteConfig.contact.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs text-[#10263D]">
              <IconPhone className="w-5 h-5 text-[#087E83] mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold block text-[#10263D]">Direct Calling</span>
                <p className="mt-0.5 text-[#586775]">
                  <a href={`tel:${siteConfig.contact.phone}`} className="hover:underline text-[#10263D] font-mono">
                    {siteConfig.contact.phone}
                  </a>
                  {' / '}
                  <a href={`tel:${siteConfig.contact.altPhone}`} className="hover:underline text-[#10263D] font-mono">
                    {siteConfig.contact.altPhone}
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs text-[#10263D]">
              <IconClock className="w-5 h-5 text-[#087E83] mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold block text-[#10263D]">Office Hours</span>
                <p className="mt-0.5 text-[#586775]">
                  Monday to Saturday: 10:00 AM - 7:00 PM (PKT)
                </p>
                <p className="text-[11px] text-[#586775]">Sunday: Closed (WhatsApp Inquiries Open)</p>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={`https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent('Hello WK Travel, I would like to schedule an inquiry regarding a travel package.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 text-xs font-semibold text-white bg-[#128C7E] hover:bg-[#075E54] rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <IconWhatsApp className="w-4 h-4" />
                <span>Message Consultant on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <div className="md:col-span-7 border border-[#E1E7EB] bg-white p-6 sm:p-8 rounded-2xl shadow-sm">
          <h2 className="font-heading text-lg font-bold text-[#10263D] mb-1">
            Send an Online Message
          </h2>
          <p className="text-xs text-[#586775] mb-6">
            Fill out the form below and an agency representative will respond promptly.
          </p>

          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <IconCheck className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-[#10263D]">Message Received</h3>
              <p className="text-xs text-[#586775] leading-relaxed">
                Thank you, {form.name || 'Traveler'}. Our team will review your inquiry and follow up shortly.
              </p>
              <div className="pt-2">
                <a
                  href={whatsappInquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#128C7E] hover:bg-[#075E54] rounded shadow-xs"
                >
                  <IconWhatsApp className="w-4 h-4" />
                  <span>Continue on WhatsApp Directly</span>
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Full Name"
                    className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="03XXXXXXXXX"
                    className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] font-mono focus:outline-none focus:border-[#087E83]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5">
                  Message or Inquiry *
                </label>
                <textarea
                  rows="4"
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Please describe the package, destination, or visa service you need assistance with."
                  className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83] leading-relaxed"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
              >
                Send Inquiry
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
