"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Star, Quote } from "lucide-react";
import AutoCarousel from "@/components/ui/AutoCarousel";
import { ITestimonial } from "@/lib/models";

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<ITestimonial[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTestimonials = () => {
    fetch("/api/testimonials")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTestimonials(data);
        }
      })
      .catch((err) => console.error("Failed to load testimonials:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTestimonials();

    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/events");
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "testimonials-updated") {
            loadTestimonials();
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadTestimonials();
      }
    }, 20000);

    return () => {
      if (es) es.close();
      clearInterval(interval);
    };
  }, []);

  return (
    <section id="testimonials" className="relative py-16 sm:py-24 bg-[#F5F4F2] border-t border-[rgba(10,10,10,0.08)] overflow-hidden content-auto">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 mb-12 sm:mb-16">
        {/* Header */}
        <div className="text-left sm:text-left">
          <div className="brand-pill mb-4 text-[#0A0A0A]">
            <span>05 — Client Proof</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#0A0A0A]">
            Words From Our <span className="font-serif italic font-normal tracking-normal text-[#D40000] lowercase first-letter:uppercase">Partners</span>
          </h2>
          <p className="mt-3 text-[#6B6B6B] text-sm sm:text-base max-w-xl">
            Industry CMOs, venture-backed founders, and visionary leaders on the Insertix impact.
          </p>
        </div>
      </div>

      {/* Continuously Auto-Scrolling Testimonials Marquee (Right to Left) */}
      {loading ? (
        <div className="flex gap-6 px-6 max-w-[1280px] mx-auto overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-[420px] h-[320px] rounded-[24px] bg-white animate-pulse border border-[rgba(10,10,10,0.08)] flex-shrink-0" />
          ))}
        </div>
      ) : (
        <AutoCarousel speed={60} cardWidth="w-[360px] sm:w-[440px] max-w-[85vw]">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="brand-card card-glow p-7 sm:p-8 flex flex-col justify-between h-[360px] group/card select-none bg-white border border-[rgba(10,10,10,0.08)] rounded-[24px] relative overflow-hidden isolate"
            >
              <div className="relative z-10">
                {/* Brand Red Quote Mark + 5 Red Stars */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.08)] group-hover/card:border-[#D40000]/30 flex items-center justify-center transition-colors duration-200">
                    <Quote className="w-5 h-5 text-[#D40000] fill-[#D40000]/15" />
                  </div>
                  <div className="flex items-center gap-1 text-[#D40000]">
                    {[...Array(t.rating || 5)].map((_, rIdx) => (
                      <Star key={rIdx} className="w-3.5 h-3.5 fill-[#D40000] text-[#D40000]" />
                    ))}
                  </div>
                </div>

                {/* Quote text clamped to 5 lines with consistent min-height */}
                <div className="min-h-[7rem]">
                  <p className="text-[#0A0A0A] text-sm sm:text-base leading-relaxed line-clamp-5 italic">
                    &ldquo;{t.content}&rdquo;
                  </p>
                </div>
              </div>

              {/* Author Row pinned to bottom with divider directly above */}
              <div className="flex items-center gap-3.5 border-t border-[rgba(10,10,10,0.08)] pt-4 mt-auto relative z-10">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[rgba(10,10,10,0.1)] bg-[#FAF9F7] flex-shrink-0">
                  <Image
                    src={t.avatar}
                    alt={t.clientName}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0A0A0A] group-hover/card:text-[#D40000] transition-colors duration-200">
                    {t.clientName}
                  </h4>
                  <p className="text-xs font-mono text-[#6B6B6B]">
                    {t.role}, <span className="text-[#0A0A0A] font-semibold">{t.company}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </AutoCarousel>
      )}
    </section>
  );
}
