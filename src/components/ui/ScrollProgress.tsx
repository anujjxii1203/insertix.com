"use client";

import { useEffect, useState } from "react";

export default function ScrollProgress() {
  const [scaleX, setScaleX] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = totalHeight > 0 ? window.scrollY / totalHeight : 0;
          setScaleX(Math.min(1, Math.max(0, progress)));
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left pointer-events-none"
      style={{
        background: "var(--grad)",
        transform: `scaleX(${scaleX}) translateZ(0)`,
        willChange: "transform",
      }}
    />
  );
}
