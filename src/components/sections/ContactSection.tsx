"use client";

import {
  Mail,
  Phone,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import { getWhatsAppUrl } from "@/components/ui/WhatsAppFloating";
import { WhatsAppIcon } from "@/components/ui/SocialIcons";

export default function ContactSection() {
  const waUrl = getWhatsAppUrl("Hi Insertix Media, I want to discuss a project");
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@insertixmedia.com";
  const contactPhone = "+919717150055";
  const displayPhone = "+91 97171 50055";

  return (
    <section
      id="contact"
      className="relative bg-[#0A0A0A] text-white overflow-hidden scroll-mt-[90px] py-16 sm:py-20 lg:py-[120px]"
    >
      {/* Background ambient lighting */}
      <div
        className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(212,0,0,0.09) 0%, transparent 68%)",
        }}
        aria-hidden="true"
      />

      {/* Global Container max-w 1280px */}
      <div className="relative z-10 max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Balanced 6fr / 6fr grid on desktop, centered alignment, stacked under 1024px */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">

          {/* ════════ LEFT COLUMN ════════ */}
          <div className="lg:col-span-6 flex flex-col items-start">

            {/* Badge pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono uppercase tracking-wider text-white shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D40000]" />
              <span>06 — Start A Project</span>
            </div>

            {/* Heading: clamp(2.5rem, 5vw, 4.5rem), line-height 1.05, 2 lines */}
            <h2 className="mt-6 text-[clamp(2.5rem,5vw,4.5rem)] font-black uppercase tracking-tight leading-[1.05] text-white">
              Let&apos;s Create <br />
              something{" "}
              <span className="font-serif italic font-normal tracking-normal text-[#D40000] lowercase first-letter:uppercase">
                iconic
              </span>
            </h2>

            {/* Paragraph (max-width 460px) */}
            <p className="mt-6 text-[16px] sm:text-[17px] leading-[1.7] text-white/75 max-w-[460px]">
              Have a bold vision? Whether it&apos;s a cinematic brand shoot, photoshoot, product catalogue, event coverage, or high-growth marketing campaign, we are ready to bring it to life.
            </p>

            {/* Contact list (3 rows, icon circle + text, 20px between rows) */}
            <div className="mt-10 w-full pt-10 border-t border-white/[0.08] flex flex-col gap-5 text-[15px] text-white/90">
              {/* Row 1: Email (mailto:) */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center flex-shrink-0 text-[#D40000]">
                  <Mail className="w-4 h-4" />
                </div>
                <a
                  href={`mailto:${contactEmail}`}
                  className="hover:text-white hover:underline transition-colors font-medium"
                >
                  {contactEmail}
                </a>
              </div>

              {/* Row 2: Phone (tel:) tap-to-call link */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center flex-shrink-0 text-[#D40000]">
                  <Phone className="w-4 h-4" />
                </div>
                <a
                  href={`tel:${contactPhone}`}
                  className="hover:text-white hover:underline transition-colors font-medium"
                >
                  {displayPhone}
                </a>
              </div>

              {/* Row 3: Location */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center flex-shrink-0 text-[#D40000]">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-white/80">New Delhi, India</span>
              </div>
            </div>

          </div>

          {/* ════════ RIGHT COLUMN: WHATSAPP CARD ════════ */}
          <div className="lg:col-span-6 w-full">
            <div className="relative isolate overflow-hidden bg-[#141414] text-white rounded-[24px] p-6 sm:p-10 border border-white/10 shadow-2xl flex flex-col gap-6">

              {/* Soft static red radial glow in top-right corner (no blur filter, no animation) */}
              <div
                className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(circle, rgba(212,0,0,0.18) 0%, transparent 70%)",
                }}
                aria-hidden="true"
              />

              {/* 1. Small label */}
              <p className="text-[12px] uppercase tracking-[0.12em] text-zinc-400 font-semibold font-mono">
                Prefer instant communication?
              </p>

              {/* 2. Heading */}
              <h3 className="text-[clamp(1.75rem,3vw,2.25rem)] font-bold text-white leading-tight">
                Chat with us on WhatsApp
              </h3>

              {/* 3. Paragraph */}
              <p className="text-[16px] text-zinc-400 leading-relaxed max-w-[420px]">
                Tell us about your shoot or campaign and get a reply within minutes. Quick, simple and no forms.
              </p>

              {/* 4. Primary WhatsApp Button */}
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                id="contact-whatsapp-direct-btn"
                className="group inline-flex items-center justify-center gap-3 w-full h-[56px] px-6 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-base tracking-wide shadow-md transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <WhatsAppIcon className="w-5 h-5 fill-current" />
                <span>Chat on WhatsApp Directly</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>

              {/* 5. Two secondary buttons side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* Call Us Button */}
                <a
                  href={`tel:${contactPhone}`}
                  className="h-[52px] rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/12 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-white/25 active:scale-[0.99]"
                >
                  <Phone className="w-4 h-4 text-[#D40000]" />
                  <span>Call Us</span>
                </a>

                {/* Email Us Button */}
                <a
                  href={`mailto:${contactEmail}`}
                  className="h-[52px] rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/12 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-white/25 active:scale-[0.99]"
                >
                  <Mail className="w-4 h-4 text-[#D40000]" />
                  <span>Email Us</span>
                </a>
              </div>

              {/* 6. Working hours line */}
              <p className="text-[13px] text-zinc-400 text-center font-mono pt-1">
                Available Mon to Sat, 10 AM to 8 PM IST
              </p>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

