"use client";

import Image from "next/image";
import { ArrowUp } from "lucide-react";
import { LinkedInIcon, InstagramIcon, WhatsAppIcon } from "@/components/ui/SocialIcons";
import { getWhatsAppUrl } from "@/components/ui/WhatsAppFloating";
import { SOCIAL_LINKS } from "@/constants/social";

export default function Footer() {
  const waUrl = getWhatsAppUrl();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
      href: SOCIAL_LINKS.instagram,
      icon: InstagramIcon,
    },
    {
      name: "LinkedIn",
      href: SOCIAL_LINKS.linkedin,
      icon: LinkedInIcon,
    },
    {
      name: "WhatsApp",
      href: waUrl,
      icon: WhatsAppIcon,
    },
  ].filter((item) => Boolean(item.href && item.href.trim() !== ""));

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
        {/* Top Grid: Desktop 3 columns (2fr / 1fr / 1fr, gap 64px), tablet 2 columns, mobile 1 column */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 pb-14 border-b border-white/[0.08]">
          {/* Column 1: Logo + Short tagline + Social links (takes 2fr on lg) */}
          <div className="lg:col-span-2 space-y-5">
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

            <p className="text-zinc-400 text-[15px] leading-relaxed max-w-sm">
              Creative media agency for video shoots, photoshoots, product shoots, event coverage and marketing that turns ideas into unforgettable content.
            </p>

            {/* Social Icons: 44px circle, 12px gap, 20px icon, red gradient, no border */}
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
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white transition-[transform,background-color] duration-150 hover:-translate-y-[3px] hover:!bg-[#A80000] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 shrink-0"
                    style={{
                      background: "var(--grad-diag)",
                    }}
                  >
                    <IconComponent className="w-5 h-5 fill-current" />
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
            <ul className="space-y-3 text-[15px]">
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
            <ul className="space-y-3 text-[15px]">
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
        </div>

        {/* Bottom Bar: 1px rgba(255,255,255,0.08) divider above it */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-400">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-center sm:text-left">
            <p>
              © 2026 INSERTIX MEDIA LLC. ALL RIGHTS RESERVED.
            </p>
            <span className="hidden sm:inline text-zinc-600">•</span>
            <p className="text-zinc-400">
              New Delhi, India
            </p>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 hover:text-white transition-colors group cursor-pointer"
          >
            <span>BACK TO TOP</span>
            <ArrowUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
}

