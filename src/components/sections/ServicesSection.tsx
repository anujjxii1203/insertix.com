"use client";

import {
  Video,
  Camera,
  Megaphone,
  Package,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import AutoCarousel from "@/components/ui/AutoCarousel";
import { getWhatsAppUrl } from "@/components/ui/WhatsAppFloating";

const SERVICES = [
  {
    id: "video-shoots",
    title: "Video Shoots",
    icon: Video,
    tag: "CINEMATIC FILMS",
    description:
      "Brand films, commercials, ad films, reels and corporate videos shot with cinema cameras, pro lighting and polished editing.",
    features: [
      "Ad Films & Commercials",
      "Reels & Short-Form Videos",
      "Editing, Color Grading & Sound",
    ],
  },
  {
    id: "photoshoots",
    title: "Photoshoots",
    icon: Camera,
    tag: "STUDIO & OUTDOOR",
    description:
      "Portrait, fashion, corporate and lifestyle photography, in our studio or on location, with professional retouching.",
    features: [
      "Portrait & Fashion Shoots",
      "Corporate & Team Photos",
      "Professional Retouching",
    ],
  },
  {
    id: "marketing",
    title: "Marketing",
    icon: Megaphone,
    tag: "GROWTH & REACH",
    description:
      "Social media and digital marketing that gets your content in front of the right audience and turns views into customers.",
    features: [
      "Social Media Management",
      "Paid Ads (Meta & Google)",
      "Content Strategy & Reach",
    ],
  },
  {
    id: "product-shoot",
    title: "Product Shoot",
    icon: Package,
    tag: "E-COMMERCE READY",
    description:
      "Clean, high-quality product photos and videos for e-commerce, catalogues and ads that make your products sell.",
    features: [
      "White-Background & Lifestyle Shots",
      "Product Videos & 360° Views",
      "Catalogue & Marketplace Ready",
    ],
  },
  {
    id: "event-shoots",
    title: "Event Shoots",
    icon: Calendar,
    tag: "LIVE COVERAGE",
    description:
      "Weddings, concerts, corporate events and launches covered with photo, video, highlight reels and drone shots.",
    features: [
      "Photo & Video Coverage",
      "Highlight Reels & Aftermovies",
      "Drone & Multi-Camera Setup",
    ],
  },
];

export default function ServicesSection() {
  return (
    <section id="work" className="relative py-16 sm:py-24 bg-[#F5F4F2] overflow-hidden content-auto">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 mb-12 sm:mb-16">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="brand-pill mb-4 text-[#0A0A0A]">
              <span>01 — Capabilities</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#0A0A0A]">
              What We <span className="font-serif italic font-normal tracking-normal text-[#D40000] lowercase first-letter:uppercase">Dominate</span>
            </h2>
          </div>
          <p className="text-[#6B6B6B] max-w-md text-sm sm:text-base leading-relaxed">
            Everything you need to shoot it, show it and sell it.
          </p>
        </div>
      </div>

      {/* Continuously Auto-Scrolling Horizontal Carousel (Right to Left) */}
      <AutoCarousel speed={40} cardWidth="w-[360px] sm:w-[380px] max-w-[85vw]">
        {SERVICES.map((srv) => {
          const Icon = srv.icon;
          const waServiceUrl = getWhatsAppUrl(`Hi Insertix Media, I am interested in ${srv.title}`);

          return (
            <div
              key={srv.id}
              className="brand-card card-glow p-6 sm:p-7 flex flex-col justify-between h-[510px] group/card cursor-default select-none bg-white border border-[rgba(10,10,10,0.08)] rounded-[24px] relative overflow-hidden isolate"
            >
              <div className="relative z-10">
                {/* Top Row: Icon + Tag */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.08)] flex items-center justify-center text-[#0A0A0A] group-hover/card:text-[#D40000] group-hover/card:border-[#D40000]/30 transition-colors duration-200">
                    <Icon className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-mono tracking-wider uppercase text-[#6B6B6B] bg-[#FAF9F7] px-2.5 py-1 rounded-full border border-[rgba(10,10,10,0.08)] shrink-0">
                    {srv.tag}
                  </span>
                </div>

                {/* Title Area: Clean 1-line title with fixed min-height */}
                <div className="min-h-[2.5rem] flex items-center">
                  <h3 className="text-xl sm:text-2xl font-bold text-[#0A0A0A] leading-tight group-hover/card:text-[#D40000] transition-colors duration-200 text-left">
                    {srv.title}
                  </h3>
                </div>

                {/* Description: 4-line description with fixed min-height */}
                <div className="min-h-[5.5rem] mt-2 mb-4">
                  <p className="text-[#6B6B6B] text-sm leading-relaxed line-clamp-4">
                    {srv.description}
                  </p>
                </div>

                {/* Features List: identical starting position, spacing, and left alignment */}
                <div className="border-t border-[rgba(10,10,10,0.08)] pt-4 mb-2">
                  <div className="space-y-2.5">
                    {srv.features.slice(0, 3).map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2 text-xs text-[#0A0A0A] pl-0 ml-0">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#D40000]" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pinned to Bottom: Inquire Link opens WhatsApp with service pre-filled */}
              <div className="mt-auto pt-3.5 border-t border-[rgba(10,10,10,0.08)] relative z-10">
                <a
                  href={waServiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full text-xs font-mono font-bold uppercase tracking-wider text-[#0A0A0A] group-hover/card:text-[#D40000] transition-colors duration-200"
                >
                  <span>Inquire for this service</span>
                  <ArrowUpRight className="w-4 h-4 text-[#0A0A0A] group-hover/card:text-[#D40000] group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5 transition-transform duration-200" />
                </a>
              </div>
            </div>
          );
        })}
      </AutoCarousel>
    </section>
  );
}
