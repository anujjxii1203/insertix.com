"use client";

import { useEffect, ReactNode } from "react";
import Lenis from "lenis";

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Disable in admin, on mobile/touch screens, or if reduced motion is preferred
    const isAdmin = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
    const isTouchOrSmall =
      window.innerWidth < 768 ||
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isAdmin || isTouchOrSmall) return;

    const lenis = new Lenis({
      lerp: 0.1, // Set Lenis lerp ~0.1 as specified
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.9,
      syncTouch: false, // Disabled on touch
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
