"use client";

import { useEffect, useState } from "react";
import {
  Video,
  Camera,
  Megaphone,
  Package,
  Calendar,
  Film,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import AutoCarousel from "@/components/ui/AutoCarousel";
import { getWhatsAppUrl } from "@/components/ui/WhatsAppFloating";
import { ISiteSettings } from "@/lib/models";
import { DEFAULT_SITE_SETTINGS } from "@/lib/defaultSettings";

const ICON_MAP: Record<string, any> = {
  Video,
  Camera,
  Megaphone,
  Package,
  Calendar,
  Film,
  Sparkles,
};

import { useLiveEvent } from "@/lib/liveSync";

export default function ServicesSection({ initialSettings }: { initialSettings?: ISiteSettings }) {
  const [settings, setSettings] = useState<ISiteSettings>(initialSettings || DEFAULT_SITE_SETTINGS);

  useLiveEvent("settings-updated", () => {
    fetch("/api/settings")
      .then((r) => r.ok && r.json())
      .then((fresh) => {
        if (fresh && fresh.services) setSettings(fresh);
      })
      .catch(() => {});
  });

  const heading = settings.sectionHeadings?.work || DEFAULT_SITE_SETTINGS.sectionHeadings.work;
  const activeServices = (settings.services || DEFAULT_SITE_SETTINGS.services).filter(
    (s) => s.visible !== false
  );

  return (
    <section id="work" className="relative py-16 sm:py-24 bg-[var(--bg-alt)] overflow-hidden content-auto">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 mb-12 sm:mb-16">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="brand-pill mb-4 text-[var(--text)]">
              <span>01 — Capabilities</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[var(--text)]">
              {heading.title || "What We"}{" "}
              <span className="font-serif italic font-normal tracking-normal text-[#D40000] lowercase first-letter:uppercase">
                {heading.accentWord || "Dominate"}
              </span>
            </h2>
          </div>
          <p className="text-[var(--muted)] max-w-md text-sm sm:text-base leading-relaxed">
            {heading.subtext || "Everything you need to shoot it, show it and sell it."}
          </p>
        </div>
      </div>

      {/* Continuously Auto-Scrolling Horizontal Carousel (Right to Left) */}
      <AutoCarousel speed={40} cardWidth="w-[360px] sm:w-[380px] max-w-[85vw]">
        {activeServices.map((srv) => {
          const Icon = ICON_MAP[srv.icon] || Video;
          const waServiceUrl = getWhatsAppUrl(`Hi Insertix Media, I am interested in ${srv.title}`);

          return (
            <div
              key={srv.id}
              className="brand-card card-glow p-6 sm:p-7 flex flex-col justify-between h-[510px] group/card cursor-default select-none bg-[var(--surface)] border border-[var(--border)] rounded-[24px] relative overflow-hidden isolate"
            >
              <div className="relative z-10">
                {/* Top Row: Icon + Tag */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] group-hover/card:text-[#D40000] group-hover/card:border-[#D40000]/30 transition-colors duration-200">
                    <Icon className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-mono tracking-wider uppercase text-[var(--muted)] bg-[var(--surface-2)] px-2.5 py-1 rounded-full border border-[var(--border)] shrink-0">
                    {srv.tag}
                  </span>
                </div>

                {/* Title Area */}
                <div className="min-h-[2.5rem] flex items-center">
                  <h3 className="text-xl sm:text-2xl font-bold text-[var(--text)] leading-tight group-hover/card:text-[#D40000] transition-colors duration-200 text-left">
                    {srv.title}
                  </h3>
                </div>

                {/* Description */}
                <div className="min-h-[5.5rem] mt-2 mb-4">
                  <p className="text-[var(--muted)] text-sm leading-relaxed line-clamp-4">
                    {srv.description}
                  </p>
                </div>

                {/* Features List */}
                <div className="border-t border-[var(--border)] pt-4 mb-2">
                  <div className="space-y-2.5">
                    {srv.features.slice(0, 3).map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2 text-xs text-[var(--text)] pl-0 ml-0">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#D40000]" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pinned to Bottom: Inquire Link opens WhatsApp with service pre-filled */}
              <div className="mt-auto pt-3.5 border-t border-[var(--border)] relative z-10">
                <a
                  href={waServiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full text-xs font-mono font-bold uppercase tracking-wider text-[var(--text)] group-hover/card:text-[#D40000] transition-colors duration-200"
                >
                  <span>Inquire for this service</span>
                  <ArrowUpRight className="w-4 h-4 text-[var(--text)] group-hover/card:text-[#D40000] group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5 transition-transform duration-200" />
                </a>
              </div>
            </div>
          );
        })}
      </AutoCarousel>
    </section>
  );
}
