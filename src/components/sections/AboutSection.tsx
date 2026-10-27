"use client";

import { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";
import { Award, Zap, Compass, Users } from "lucide-react";
import { ISiteSettings } from "@/lib/models";
import { DEFAULT_SITE_SETTINGS } from "@/lib/defaultSettings";
import { useLiveEvent } from "@/lib/liveSync";

interface CounterProps {
  end: number;
  suffix?: string;
  duration?: number;
}

function Counter({ end, suffix = "", duration = 2 }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const safeEnd = Math.max(1, end);
    const stepTime = Math.abs(Math.floor((duration * 1000) / safeEnd));
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= safeEnd) {
        clearInterval(timer);
        setCount(safeEnd);
      }
    }, Math.max(stepTime, 20));

    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return (
    <span ref={ref} className="font-mono font-black">
      {count}
      {suffix}
    </span>
  );
}

const COUNTER_ICONS = [Award, Zap, Compass, Users];

export default function AboutSection({ initialSettings }: { initialSettings?: ISiteSettings }) {
  const [settings, setSettings] = useState<ISiteSettings>(initialSettings || DEFAULT_SITE_SETTINGS);

  useLiveEvent("settings-updated", () => {
    fetch("/api/settings")
      .then((r) => r.ok && r.json())
      .then((fresh) => {
        if (fresh && fresh.about) setSettings(fresh);
      })
      .catch(() => {});
  });

  const about = settings.about || DEFAULT_SITE_SETTINGS.about;
  const trustedBrands = settings.trustedBrands || DEFAULT_SITE_SETTINGS.trustedBrands;
  const activeBrands = (trustedBrands.brands || []).filter((b) => b.visible !== false);
  const counters = about.counters || DEFAULT_SITE_SETTINGS.about.counters;

  return (
    <section id="about" className="relative py-16 sm:py-24 bg-[var(--bg)] border-t border-[var(--border)] content-auto">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Section Pill */}
        <div className="brand-pill mb-6 text-[var(--text)]">
          <span>02 — Our Story</span>
        </div>

        {/* Agency Story */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 items-start mb-16 sm:mb-20">
          <div className="lg:col-span-7">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-[var(--text)] leading-tight">
              {about.heading || "A New Era Of"} <br />
              <span className="font-serif italic font-normal tracking-normal text-[#D40000] lowercase first-letter:uppercase">
                {about.accentWord || "Creative Media"}
              </span>
            </h2>
          </div>

          <div className="lg:col-span-5 space-y-4 text-[var(--muted)] text-base sm:text-lg leading-relaxed">
            {(about.paragraphs && about.paragraphs.length > 0
              ? about.paragraphs
              : DEFAULT_SITE_SETTINGS.about.paragraphs
            ).map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        </div>

        {/* 4 Equal-Height Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16 sm:mb-20">
          {counters.map((stat, idx) => {
            const Icon = COUNTER_ICONS[idx % COUNTER_ICONS.length];
            return (
              <div
                key={idx}
                className="brand-card card-glow p-6 sm:p-8 flex flex-col justify-between group bg-[var(--surface)] border border-[var(--border)] rounded-[24px] overflow-hidden relative isolate cursor-default select-none"
              >
                <div className="relative z-[1] w-full flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono uppercase text-[var(--muted)] tracking-wider">
                      {stat.label}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] group-hover:text-[#D40000] group-hover:border-[#D40000]/30 transition-all">
                      <Icon className="w-4 h-4 stroke-[1.75]" />
                    </div>
                  </div>
                  <div className="text-3xl sm:text-5xl text-[var(--text)] group-hover:text-[#D40000] transition-colors">
                    <Counter end={stat.number} suffix={stat.suffix || ""} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Client Brands Logos Marquee */}
        {trustedBrands.visible !== false && activeBrands.length > 0 && (
          <div className="pt-8 border-t border-[var(--border)] text-center">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-[var(--muted)] mb-6">
              {trustedBrands.heading || "TRUSTED BY INDUSTRY LEADERS & INNOVATIVE BRANDS"}
            </p>
            <div className="overflow-hidden py-2">
              <div className="animate-marquee-left whitespace-nowrap flex items-center gap-14 font-mono text-base sm:text-lg font-bold tracking-widest text-[var(--muted)]">
                {[...activeBrands, ...activeBrands].map((brand, bIdx) => (
                  <div key={bIdx} className="flex items-center gap-10">
                    <span className="hover:text-[var(--text)] transition-colors cursor-default">
                      {brand.name}
                    </span>
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: "var(--grad)" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
