"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AutoCarouselProps {
  children: React.ReactNode[];
  speed?: number; // duration in seconds (e.g. 40, 55, 60)
  className?: string;
  cardWidth?: string;
}

export default function AutoCarousel({
  children,
  speed = 45,
  className = "",
  cardWidth = "w-[380px] max-w-[85vw]",
}: AutoCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const [isVisible, setIsVisible] = useState(true);
  const [isTabVisible, setIsTabVisible] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(media.matches);

    // Pause when document is hidden (tab switched)
    const handleVisibility = () => {
      setIsTabVisible(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Pause when off-screen via IntersectionObserver
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: "100px" }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      observer.disconnect();
    };
  }, []);

  // Duplicate items for seamless continuous right-to-left loop (4x for small sets <=6, 2x otherwise)
  const duplicatedItems =
    children.length <= 6
      ? [...children, ...children, ...children, ...children]
      : [...children, ...children];

  // Nudge left or right
  const nudge = (direction: "left" | "right") => {
    if (!containerRef.current) return;
    const scrollAmount = direction === "left" ? -350 : 350;
    containerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  // Drag handlers for mouse/touch (auto-scroll resumes on release)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => setIsDragging(false);

  // Play continuously; do NOT pause on card hover. Only pause when dragging, tab is hidden, offscreen, or reduced motion
  const shouldPlay = isVisible && isTabVisible && !isDragging && !prefersReducedMotion;

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      {/* Edge Fade Masks via CSS mask-image so it works seamlessly on any section background */}
      <div className="carousel-mask w-full">
        {/* Scrolling Container: No onMouseEnter/onMouseLeave pause handlers */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="w-full overflow-x-auto no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing py-4 px-4 sm:px-8"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div
            ref={trackRef}
            className={`flex items-stretch gap-6 will-change-transform ${
              prefersReducedMotion ? "" : "animate-marquee-left"
            }`}
            style={{
              ["--marquee-duration" as any]: `${speed}s`,
              animationPlayState: shouldPlay ? "running" : "paused",
              width: "max-content",
            }}
          >
            {duplicatedItems.map((child, index) => (
              <div
                key={`carousel-card-${index}`}
                className={`flex-shrink-0 flex flex-col items-stretch ${cardWidth}`}
              >
                {child}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Arrow Controls (Top-right or hoverable) */}
      <div className="absolute right-6 -top-14 hidden sm:flex items-center gap-2 z-20">
        <button
          onClick={() => nudge("left")}
          aria-label="Previous slide"
          className="w-10 h-10 rounded-full bg-white border border-[rgba(10,10,10,0.08)] flex items-center justify-center text-[#0A0A0A] hover:bg-[#D40000] hover:border-[#D40000] hover:text-white transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => nudge("right")}
          aria-label="Next slide"
          className="w-10 h-10 rounded-full bg-white border border-[rgba(10,10,10,0.08)] flex items-center justify-center text-[#0A0A0A] hover:bg-[#D40000] hover:border-[#D40000] hover:text-white transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
