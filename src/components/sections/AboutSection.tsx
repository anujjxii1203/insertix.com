"use client";

import { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";
import { Award, Zap, Compass, Users } from "lucide-react";

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
    const stepTime = Math.abs(Math.floor((duration * 1000) / end));
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
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

const STATS = [
  { label: "Projects Delivered", value: 140, suffix: "+", icon: Award },
  { label: "Happy Clients", value: 65, suffix: "+", icon: Zap },
  { label: "Years of Excellence", value: 6, suffix: "+", icon: Compass },
  { label: "Core Specialists", value: 18, suffix: "", icon: Users },
];

const CLIENT_BRANDS = [
  "ZOMATO DINING",
  "TATA MOTORS",
  "FABINDIA",
  "CRED",
  "BOAT LIFESTYLE",
  "FOREST ESSENTIALS",
  "PERCEPT LIVE",
  "CHAAYOS",
];

export default function AboutSection() {
  return (
    <section id="about" className="relative py-16 sm:py-24 bg-[#FFFFFF] border-t border-[rgba(10,10,10,0.08)] content-auto">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Section Pill */}
        <div className="brand-pill mb-6 text-[#0A0A0A]">
          <span>02 — Our Story</span>
        </div>

        {/* Agency Story */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 items-start mb-16 sm:mb-20">
          <div className="lg:col-span-7">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-[#0A0A0A] leading-tight">
              A New Era Of <br />
              <span className="font-serif italic font-normal tracking-normal text-[#D40000] lowercase first-letter:uppercase">Creative Media</span>
            </h2>
          </div>

          <div className="lg:col-span-5 space-y-4 text-[#6B6B6B] text-base sm:text-lg leading-relaxed">
            <p>
              Born at the intersection of cinematic camera craft and high-impact digital reach,
              <strong className="text-[#0A0A0A] font-semibold"> Insertix Media </strong> was founded to create visual content that commands attention and converts audiences.
            </p>
            <p>
              From cinematic video shoots and studio photoshoots to high-converting product shoots, live event coverage, and targeted marketing, our complete production engine shoots, polishes, and delivers content that makes your brand impossible to ignore.
            </p>
          </div>
        </div>

        {/* 4 Equal-Height Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16 sm:mb-20">
          {STATS.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="brand-card card-glow p-6 sm:p-8 flex flex-col justify-between group bg-white border border-[rgba(10,10,10,0.08)] rounded-[24px] overflow-hidden relative isolate cursor-default select-none"
              >
                <div className="relative z-[1] w-full flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono uppercase text-[#6B6B6B] tracking-wider">
                      {stat.label}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.08)] flex items-center justify-center text-[#0A0A0A] group-hover:text-[#D40000] group-hover:border-[#D40000]/30 transition-all">
                      <Icon className="w-4 h-4 stroke-[1.75]" />
                    </div>
                  </div>
                  <div className="text-3xl sm:text-5xl text-[#0A0A0A] group-hover:text-[#D40000] transition-colors">
                    <Counter end={stat.value} suffix={stat.suffix} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Client Brands Logos Marquee */}
        <div className="pt-8 border-t border-[rgba(10,10,10,0.08)] text-center">
          <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#6B6B6B] mb-6">
            TRUSTED BY INDUSTRY LEADERS & INNOVATIVE BRANDS
          </p>
          <div className="overflow-hidden py-2">
            <div className="animate-marquee-left whitespace-nowrap flex items-center gap-14 font-mono text-base sm:text-lg font-bold tracking-widest text-[#6B6B6B]">
              {[...CLIENT_BRANDS, ...CLIENT_BRANDS].map((brand, bIdx) => (
                <div key={bIdx} className="flex items-center gap-10">
                  <span className="hover:text-[#0A0A0A] transition-colors cursor-default">
                    {brand}
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
      </div>
    </section>
  );
}
