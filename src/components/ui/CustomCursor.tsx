"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Disable in admin or on touch devices or if reduced motion is preferred
    const isAdmin = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isAdmin || isTouch || prefersReducedMotion) {
      return;
    }

    setEnabled(true);

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let isHovered = false;
    let isCardHovered = false;
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const onCard = !!target.closest(".card-glow, .brand-card, .nexo-card, form, input, textarea, select, #contact");
      isCardHovered = onCard;

      if (
        target.closest("a") ||
        target.closest("button") ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) {
        isHovered = true;
      } else {
        isHovered = false;
      }
    };

    // Single requestAnimationFrame loop with translate3d
    const render = () => {
      // Lerp ring towards mouse
      ringX += (mouseX - ringX) * 0.22;
      ringY += (mouseY - ringY) * 0.22;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%) scale(${isHovered ? 1.25 : 1})`;
      }

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${isHovered ? 1.2 : 1})`;
        ringRef.current.style.borderColor = isHovered ? "#D40000" : "rgba(212, 0, 0, 0.35)";
        // Hide ring completely on text-heavy cards to prevent hiding content
        ringRef.current.style.opacity = isCardHovered ? "0" : "1";
      }

      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseover", handleMouseOver, { passive: true });
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      {/* Outer Ring: 28px (w-7 h-7), no mix-blend-mode */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none z-[99999] w-7 h-7 rounded-full border border-[rgba(212,0,0,0.35)] transition-opacity duration-150 will-change-transform"
        aria-hidden="true"
      />
      {/* Center Dot: 8px (w-2 h-2), highest z-index */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none z-[99999] w-2 h-2 rounded-full bg-[#D40000] opacity-90 transition-transform duration-100 will-change-transform"
        aria-hidden="true"
      />
    </>
  );
}
