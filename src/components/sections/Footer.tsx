"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { LinkedInIcon, InstagramIcon, WhatsAppIcon } from "@/components/ui/SocialIcons";
import { getWhatsAppUrl } from "@/components/ui/WhatsAppFloating";
import { ISiteSettings } from "@/lib/models";
import { DEFAULT_SITE_SETTINGS } from "@/lib/defaultSettings";
import { useLiveEvent } from "@/lib/liveSync";
import { Phone, Mail, MapPin } from "lucide-react";

export default function Footer({ initialSettings }: { initialSettings?: ISiteSettings }) {
  const [settings, setSettings] = useState<ISiteSettings>(initialSettings || DEFAULT_SITE_SETTINGS);

  useLiveEvent("settings-updated", () => {
    fetch("/api/settings")
      .then((r) => r.ok && r.json())
      .then((fresh) => {
        if (fresh && fresh.contact) setSettings(fresh);
      })
      .catch(() => {});
  });

  const contact = settings.contact || DEFAULT_SITE_SETTINGS.contact;
  const waUrl = getWhatsAppUrl();

  const quickLinks = [
    { name: "Insertix Media", href: "#hero" },
    { name: "Work", href: "#work" },
    { name: "About", href: "#about" },
    { name: "Members", href: "#members" },
    { name: "Recent Work", href: "#recent-work" },
  ];

  const serviceLinks = [
    { name: "Video Shoots", href: "#work" },
    { name: "Photoshoots", href: "#work" },
    { name: "Marketing", href: "#work" },
    { name: "Product Shoot", href: "#work" },
    { name: "Event Shoots", href: "#work" },
  ];

  const socialItems = [
    {
      name: "Instagram",
      href: contact.instagram || "https://www.instagram.com/insertixmedia.in/",
      icon: InstagramIcon,
    },
    {
      name: "LinkedIn",
      href: contact.linkedin || "https://www.linkedin.com/company/insertixmedia",
      icon: LinkedInIcon,
    },
    {
      name: "WhatsApp",
      href: waUrl,
      icon: WhatsAppIcon,
    },
  ].filter((item) => Boolean(item.href && item.href.trim() !== ""));

  const phone1 = contact.phone1 || "+91 97171 50055";
  const phone2 = contact.phone2 || "+91 63875 76969";
  const tel1 = `tel:${phone1.replace(/[^0-9+]/g, "")}`;
  const tel2 = `tel:${phone2.replace(/[^0-9+]/g, "")}`;

  return (
    <footer className="relative bg-[#0A0A0A] text-white border-t border-white/10 py-14 sm:py-20 overflow-hidden font-sans">
      {/* Corner ambient static red glow (no blur filter) */}
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(212,0,0,0.15) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Top Grid: Desktop 4 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 pb-14 border-b border-white/[0.08]">
          {/* Column 1: Logo + Short tagline + Social links */}
          <div className="lg:col-span-1 space-y-5">
            <div className="flex items-center">
              <a href="#hero" className="inline-block" aria-label="Insertix Media Home">
                <div className="relative h-[38px] w-[98px]">
                  <Image
                    src="/logo-dark.webp"
                    alt="Insertix Media"
                    fill
                    sizes="98px"
                    className="object-contain object-left"
                  />
                </div>
              </a>
            </div>

            <p className="text-zinc-400 text-[14px] leading-relaxed">
              {contact.footerTagline ||
                "Creative media agency for video shoots, photoshoots, product shoots, event coverage and marketing that turns ideas into unforgettable content."}
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              {socialItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.name}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-[transform,background-color] duration-150 hover:-translate-y-[3px] hover:!bg-[#A80000] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 shrink-0"
                    style={{
                      background: "var(--grad-diag)",
                    }}
                  >
                    <IconComponent className="w-4 h-4 fill-current" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.12em] text-zinc-400 mb-6 font-semibold">
              Quick Links
            </h4>
            <ul className="space-y-3 text-[14px]">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-zinc-300 hover:text-[#D40000] transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Services */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.12em] text-zinc-400 mb-6 font-semibold">
              Services
            </h4>
            <ul className="space-y-3 text-[14px]">
              {serviceLinks.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-zinc-300 hover:text-[#D40000] transition-colors"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact & Phone Numbers */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.12em] text-zinc-400 mb-6 font-semibold">
              Direct Contact
            </h4>
            <div className="space-y-3.5 text-[14px]">
              <div className="flex items-center gap-2.5 text-zinc-300">
                <Phone className="w-4 h-4 text-[#D40000] shrink-0" />
                <a href={tel1} className="hover:text-white transition-colors">
                  {phone1}
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-300">
                <Phone className="w-4 h-4 text-[#D40000] shrink-0" />
                <a href={tel2} className="hover:text-white transition-colors">
                  {phone2}
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-300">
                <Mail className="w-4 h-4 text-[#D40000] shrink-0" />
                <a href={`mailto:${contact.email}`} className="hover:text-white transition-colors">
                  {contact.email}
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-400">
                <MapPin className="w-4 h-4 text-[#D40000] shrink-0" />
                <span>{contact.city}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: NO "BACK TO TOP" text link */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-400">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-center sm:text-left">
            <p>
              © {new Date().getFullYear()} {contact.copyrightCompany || "INSERTIX MEDIA LLC"}. ALL RIGHTS RESERVED.
            </p>
            <span className="hidden sm:inline text-zinc-600">•</span>
            <p className="text-zinc-400">
              {contact.city || "New Delhi, India"}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
