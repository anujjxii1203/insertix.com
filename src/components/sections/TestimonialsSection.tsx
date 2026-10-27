"use client";

import { useEffect, useState } from "react";
import { Star, Quote } from "lucide-react";
import AutoCarousel from "@/components/ui/AutoCarousel";
import AvatarPlaceholder from "@/components/ui/AvatarPlaceholder";
import { ITestimonial, ISiteSettings } from "@/lib/models";
import { DEFAULT_SITE_SETTINGS } from "@/lib/defaultSettings";
import { useLiveEvent } from "@/lib/liveSync";

export default function TestimonialsSection({
  initialSettings,
  initialTestimonials = [],
}: {
  initialSettings?: ISiteSettings;
  initialTestimonials?: ITestimonial[];
}) {
  const [testimonials, setTestimonials] = useState<ITestimonial[]>(initialTestimonials);
  const [loading, setLoading] = useState(initialTestimonials.length === 0);
  const [settings, setSettings] = useState<ISiteSettings>(initialSettings || DEFAULT_SITE_SETTINGS);

  const loadTestimonials = () => {
    fetch("/api/testimonials?t=" + Date.now())
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setTestimonials(data);
        }
      })
      .catch((err) => console.error("Failed to load testimonials:", err))
      .finally(() => setLoading(false));
  };

  useLiveEvent("testimonials-updated", () => {
    loadTestimonials();
  });

  useLiveEvent("settings-updated", () => {
    fetch("/api/settings")
      .then((r) => r.ok && r.json())
      .then((fresh) => {
        if (fresh && fresh.sectionHeadings) setSettings(fresh);
      })
      .catch(() => {});
  });

  useEffect(() => {
    loadTestimonials();

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadTestimonials();
      }
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  const heading = settings.sectionHeadings?.partners || DEFAULT_SITE_SETTINGS.sectionHeadings.partners;

  return (
    <section id="testimonials" className="relative py-16 sm:py-24 bg-[var(--bg-alt)] border-t border-[var(--border)] overflow-hidden content-auto">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 mb-12 sm:mb-16">
        {/* Header */}
        <div className="text-left sm:text-left">
          <div className="brand-pill mb-4 text-[var(--text)]">
            <span>05 — Client Proof</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[var(--text)]">
            {heading.title || "Words From Our"}{" "}
            <span className="font-serif italic font-normal tracking-normal text-[#D40000] lowercase first-letter:uppercase">
              {heading.accentWord || "Partners"}
            </span>
          </h2>
          <p className="mt-3 text-[var(--muted)] text-sm sm:text-base max-w-xl">
            {heading.subtext || "Industry CMOs, venture-backed founders, and visionary leaders on the Insertix impact."}
          </p>
        </div>
      </div>

      {/* Continuously Auto-Scrolling Testimonials Marquee */}
      {loading ? (
        <div className="flex gap-6 px-6 max-w-[1280px] mx-auto overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-[420px] h-[320px] rounded-[24px] bg-[var(--surface)] animate-pulse border border-[var(--border)] flex-shrink-0" />
          ))}
        </div>
      ) : (
        <AutoCarousel speed={60} cardWidth="w-[360px] sm:w-[440px] max-w-[85vw]">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="brand-card card-glow p-7 sm:p-8 flex flex-col justify-between h-[360px] group/card select-none bg-[var(--surface)] border border-[var(--border)] rounded-[24px] relative overflow-hidden isolate"
            >
              <div className="relative z-10">
                {/* Brand Red Quote Mark + 5 Red Stars */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] group-hover/card:border-[#D40000]/30 flex items-center justify-center transition-colors duration-200">
                    <Quote className="w-5 h-5 text-[#D40000] fill-[#D40000]/15" />
                  </div>
                  <div className="flex items-center gap-1 text-[#D40000]">
                    {[...Array(t.rating || 5)].map((_, rIdx) => (
                      <Star key={rIdx} className="w-3.5 h-3.5 fill-[#D40000] text-[#D40000]" />
                    ))}
                  </div>
                </div>

                {/* Quote text */}
                <div className="min-h-[7rem]">
                  <p className="text-[var(--text)] text-sm sm:text-base leading-relaxed line-clamp-5 italic">
                    &ldquo;{t.content}&rdquo;
                  </p>
                </div>
              </div>

              {/* Company Row */}
              <div className="flex items-center gap-3.5 border-t border-[var(--border)] pt-4 mt-auto relative z-10 min-w-0">
                <AvatarPlaceholder size={58} />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm sm:text-base font-bold text-[var(--text)] group-hover/card:text-[#D40000] transition-colors duration-200 truncate sm:whitespace-normal break-words leading-snug">
                    {t.company || t.clientName || "Partner"}
                  </h4>
                </div>
              </div>
            </div>
          ))}
        </AutoCarousel>
      )}
    </section>
  );
}
