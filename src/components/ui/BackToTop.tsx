"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  // Hidden on admin pages
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return;

    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY || document.documentElement.scrollTop;
          setVisible(scrollY > 600);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Check initial position
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, [isAdmin]);

  const scrollToTop = () => {
    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Check if Lenis smooth scroll instance is available on window
    const lenis = (window as any).lenis;
    if (lenis && typeof lenis.scrollTo === "function") {
      lenis.scrollTo(0, { immediate: prefersReducedMotion });
      return;
    }

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  if (isAdmin) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      id="back-to-top-btn"
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center w-12 h-12 rounded-full text-white shadow-lg cursor-pointer transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D40000] focus-visible:ring-offset-2 ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto hover:brightness-110 hover:scale-105 active:scale-95"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      style={{
        background: "var(--grad-diag, linear-gradient(135deg, #FF5A4D 0%, #D40000 55%, #7A0000 100%))",
      }}
    >
      <ArrowUp className="w-5 h-5 stroke-[2.5]" />
    </button>
  );
}
