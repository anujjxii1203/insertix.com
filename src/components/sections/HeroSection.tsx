"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { getWhatsAppUrl } from "@/components/ui/WhatsAppFloating";

const MARQUEE_SERVICES = [
  "VIDEO SHOOTS",
  "PHOTOSHOOTS",
  "MARKETING",
  "PRODUCT SHOOT",
  "EVENT SHOOTS",
];

const HERO_STATS = [
  { value: "140+", label: "Projects Completed" },
  { value: "65+", label: "Brand Partners" },
  { value: "10M+", label: "Audience Views" },
  { value: "99%", label: "Satisfaction Rate" },
];

export default function HeroSection() {
  const waUrl = getWhatsAppUrl();

  const handleScrollToWork = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("recent-work");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative min-h-[100svh] flex flex-col justify-between pt-[88px] pb-0 overflow-hidden bg-[#FFFFFF]"
    >
      {/* 
        Soft, static radial glow in the top-right using rgba(212,0,0,0.10) fading to transparent.
        CSS radial-gradient only, NO filter blur, NO animation.
      */}
      <div
        className="absolute top-0 right-0 w-[600px] sm:w-[750px] lg:w-[900px] h-[550px] sm:h-[700px] pointer-events-none -z-10"
        style={{
          background: "radial-gradient(circle at top right, rgba(212, 0, 0, 0.10) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-[1280px] mx-auto px-6 md:px-12 w-full my-auto flex flex-col items-center text-center">
        {/* REC Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-[rgba(10,10,10,0.08)] shadow-xs mb-8"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D40000]" />
          </span>
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#0A0A0A]">
            REC
          </span>
          <span className="w-1 h-1 rounded-full bg-[rgba(10,10,10,0.25)]" />
          <span className="text-xs font-mono font-semibold tracking-wider uppercase text-[#6B6B6B]">
            Creative Media Agency
          </span>
        </motion.div>

        {/* Headline: We Shoot Stories / That Make Brands / Unforgettable */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[#0A0A0A] font-black uppercase tracking-tight max-w-[960px] text-center"
          style={{
            fontSize: "clamp(2.75rem, 6.2vw, 5.8rem)",
            lineHeight: 1.05,
          }}
        >
          <span>We Shoot Stories</span>
          <br />
          <span>That Make Brands</span>
          <br />
          <span className="font-serif italic font-normal tracking-normal text-[#D40000] lowercase first-letter:uppercase">
            Unforgettable
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-[#6B6B6B] max-w-[640px] text-base sm:text-lg leading-relaxed font-normal"
        >
          Insertix Media is a creative media agency for video shoots, photoshoots, product shoots, event coverage and marketing. We turn ideas into content people remember.
        </motion.p>

        {/* Buttons: Primary "Let's Talk" (red pill) & Secondary "View Our Work" (black pill) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
        >
          {/* Primary Button: Red Pill */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center gap-2.5 h-[56px] px-8 rounded-full bg-[#D40000] hover:bg-[#A80000] text-white font-bold text-sm uppercase tracking-wider transition-all duration-200 shadow-sm hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
            id="hero-whatsapp-cta"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>Let&apos;s Talk</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>

          {/* Secondary Button: Black Pill */}
          <a
            href="#recent-work"
            onClick={handleScrollToWork}
            className="group inline-flex items-center justify-center gap-2.5 h-[56px] px-8 rounded-full bg-[#0A0A0A] hover:bg-[#1a1a1a] text-white font-bold text-sm uppercase tracking-wider transition-all duration-200 shadow-sm hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
            id="hero-view-work-cta"
          >
            <span>View Our Work</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </motion.div>

        {/* Hero Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 pt-8 border-t border-[rgba(10,10,10,0.08)] grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10 max-w-3xl w-full"
        >
          {HERO_STATS.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <span className="font-mono font-black text-2xl sm:text-3xl text-[#0A0A0A]">
                {stat.value}
              </span>
              <span className="text-xs font-mono uppercase tracking-wider text-[#6B6B6B] mt-1">
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Marquee Strip: background --bg-alt, text --muted uppercase small, separator = small red dot */}
      <div className="relative z-10 w-full mt-12 py-4 border-y border-[rgba(10,10,10,0.08)] bg-[#F5F4F2] overflow-hidden">
        <div className="animate-marquee-left whitespace-nowrap flex items-center gap-10 font-mono text-xs font-semibold tracking-[0.2em] text-[#6B6B6B]">
          {[...MARQUEE_SERVICES, ...MARQUEE_SERVICES].map((item, idx) => (
            <div key={idx} className="flex items-center gap-8">
              <span className="hover:text-[#0A0A0A] transition-colors cursor-default">
                {item}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#D40000] flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
