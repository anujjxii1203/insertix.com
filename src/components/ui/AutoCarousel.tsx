"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AutoCarouselProps {
  children: React.ReactNode[];
  speed?: number; // duration in seconds for one full set (e.g. 40, 55, 60)
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
  const setRef = useRef<HTMLDivElement>(null);

  const [isPointerDown, setIsPointerDown] = useState(false);

  // Animation & position state
  const singleSetWidthRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const targetNudgeRef = useRef<number | null>(null);

  // Pointer drag state
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const lastPointerPos = useRef<{ x: number; time: number }>({ x: 0, time: 0 });
  const hasMovedPastThreshold = useRef<boolean>(false);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Environment flags
  const isVisibleRef = useRef<boolean>(true);
  const isTabVisibleRef = useRef<boolean>(true);
  const prefersReducedMotionRef = useRef<boolean>(false);

  // Calculate width of one single set of cards
  const measureSetWidth = useCallback(() => {
    if (setRef.current) {
      const rect = setRef.current.getBoundingClientRect();
      if (rect.width > 0) {
        singleSetWidthRef.current = rect.width;
      }
    }
  }, []);

  // Set up listeners for visibility & reduced motion
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotionRef.current = media.matches;

    const handleMediaChange = (e: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = e.matches;
    };
    media.addEventListener("change", handleMediaChange);

    const handleVisibility = () => {
      isTabVisibleRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { rootMargin: "150px" }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    measureSetWidth();
    window.addEventListener("resize", measureSetWidth);

    return () => {
      media.removeEventListener("change", handleMediaChange);
      document.removeEventListener("visibilitychange", handleVisibility);
      observer.disconnect();
      window.removeEventListener("resize", measureSetWidth);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [measureSetWidth]);

  // Main rAF continuous animation loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const setWidth = singleSetWidthRef.current;

      if (setWidth > 0 && isVisibleRef.current && isTabVisibleRef.current) {
        // Base auto-speed: moves right-to-left (increasing offset)
        // Respect prefers-reduced-motion: 0 auto speed, but manual works
        const baseSpeed = prefersReducedMotionRef.current ? 0 : setWidth / Math.max(10, speed);

        // Target smooth nudge animation (from arrows or keyboard ~450ms smooth interpolation)
        if (targetNudgeRef.current !== null) {
          const diff = targetNudgeRef.current - offsetRef.current;
          if (Math.abs(diff) < 0.5) {
            offsetRef.current = targetNudgeRef.current;
            targetNudgeRef.current = null;
          } else {
            // ~450ms spring-like convergence
            offsetRef.current += diff * Math.min(1, dt * 7);
          }
        } else if (isDraggingRef.current) {
          // While actively dragging, manual position is set by pointer move
        } else {
          // Apply velocity with friction / momentum
          if (Math.abs(velocityRef.current) > 0.5) {
            offsetRef.current += velocityRef.current * dt;
            velocityRef.current *= Math.pow(0.88, dt * 60); // friction
          } else {
            velocityRef.current = 0;
            // Always auto-scroll continuously unless within a short 1s window after button click
            if (!resumeTimerRef.current) {
              offsetRef.current += baseSpeed * dt;
            }
          }
        }

        // Infinite wrap-around in BOTH directions seamlessly
        // Normal range: [0, setWidth)
        if (offsetRef.current >= setWidth) {
          offsetRef.current = offsetRef.current % setWidth;
          if (targetNudgeRef.current !== null) {
            targetNudgeRef.current = targetNudgeRef.current % setWidth;
          }
        } else if (offsetRef.current < 0) {
          offsetRef.current = (offsetRef.current % setWidth) + setWidth;
          if (targetNudgeRef.current !== null) {
            targetNudgeRef.current = (targetNudgeRef.current % setWidth) + setWidth;
          }
        }

        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [speed]);

  // Nudge by card width in either direction (one card step)
  const nudge = useCallback(
    (direction: "left" | "right") => {
      measureSetWidth();
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);

      // Estimate card width based on set width and card count
      const cardCount = children.length || 1;
      const cardStep = singleSetWidthRef.current > 0 ? singleSetWidthRef.current / cardCount : 400;

      const current = targetNudgeRef.current !== null ? targetNudgeRef.current : offsetRef.current;
      targetNudgeRef.current = direction === "left" ? current - cardStep : current + cardStep;
      velocityRef.current = 0;

      // Smoothly resume auto-scroll ~1s after click
      resumeTimerRef.current = setTimeout(() => {
        resumeTimerRef.current = null;
      }, 1000);
    },
    [children.length, measureSetWidth]
  );

  // Wheel handling: horizontal wheel moves track, vertical passes through to window
  const handleWheel = (e: React.WheelEvent) => {
    // Check if horizontal delta or shiftKey is active
    const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;
    if (isHorizontal) {
      e.preventDefault();
      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
      offsetRef.current += delta;
      targetNudgeRef.current = null;
      velocityRef.current = delta * 15;

      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(() => {
        resumeTimerRef.current = null;
      }, 1000);
    }
  };

  // Pointer drag events (Mouse & Touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only handle primary button / touch
    if (e.button !== 0 && e.pointerType === "mouse") return;

    measureSetWidth();
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);

    isDraggingRef.current = true;
    setIsPointerDown(true);
    hasMovedPastThreshold.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    lastPointerPos.current = { x: e.clientX, time: performance.now() };
    velocityRef.current = 0;
    targetNudgeRef.current = null;

    // Do NOT capture pointer if user is pressing on an interactive link/button
    // This allows child anchors to receive standard pointerup / click events
    const targetEl = e.target as HTMLElement | null;
    const isInteractive = Boolean(targetEl && targetEl.closest("a, button, [role='button']"));

    if (!isInteractive) {
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !dragStartPos.current) return;

    const dx = e.clientX - lastPointerPos.current.x;
    const totalDx = Math.abs(e.clientX - dragStartPos.current.x);
    const totalDy = Math.abs(e.clientY - dragStartPos.current.y);

    if (totalDx > 6 || totalDy > 6) {
      hasMovedPastThreshold.current = true;
    }

    const now = performance.now();
    const dt = Math.max(1, now - lastPointerPos.current.time);

    // Update offset (dragging left = increasing offset; dragging right = decreasing offset)
    offsetRef.current -= dx;

    // Track instantaneous velocity (px / sec)
    velocityRef.current = (-dx / dt) * 1000;
    lastPointerPos.current = { x: e.clientX, time: now };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsPointerDown(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // Clamp launch velocity
    velocityRef.current = Math.max(-2500, Math.min(2500, velocityRef.current));

    // Smoothly resume auto-scroll after ~1s
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      resumeTimerRef.current = null;
    }, 1000);
  };

  // Suppress clicks on child links if dragged > 6px
  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasMovedPastThreshold.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Keyboard navigation when container has focus
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      nudge("left");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nudge("right");
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Edge Fade Masks via CSS */}
      <div className="carousel-mask w-full overflow-hidden">
        {/* Interactive Viewport */}
        <div
          ref={containerRef}
          tabIndex={0}
          role="region"
          aria-label="Interactive carousel"
          onKeyDown={handleKeyDown}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClickCapture={handleClickCapture}
          className={`w-full overflow-hidden select-none outline-none focus-visible:ring-2 focus-visible:ring-[#D40000] py-4 px-4 sm:px-8 touch-pan-y ${
            isPointerDown ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{ touchAction: "pan-y" }}
        >
          {/* Continuous Track (Translating via single rAF loop) */}
          <div
            ref={trackRef}
            className="flex items-stretch gap-6 will-change-transform"
            style={{ width: "max-content" }}
          >
            {/* Set 1: Measured reference */}
            <div ref={setRef} className="flex items-stretch gap-6 flex-shrink-0">
              {children.map((child, index) => (
                <div
                  key={`set1-${index}`}
                  className={`flex-shrink-0 flex flex-col items-stretch ${cardWidth}`}
                >
                  {child}
                </div>
              ))}
            </div>

            {/* Set 2: Duplicate for seamless right-to-left loop */}
            <div className="flex items-stretch gap-6 flex-shrink-0" aria-hidden="true">
              {children.map((child, index) => (
                <div
                  key={`set2-${index}`}
                  className={`flex-shrink-0 flex flex-col items-stretch ${cardWidth}`}
                >
                  {child}
                </div>
              ))}
            </div>

            {/* Set 3: Extra duplicate for ultra-wide displays (1920px+) */}
            <div className="flex items-stretch gap-6 flex-shrink-0" aria-hidden="true">
              {children.map((child, index) => (
                <div
                  key={`set3-${index}`}
                  className={`flex-shrink-0 flex flex-col items-stretch ${cardWidth}`}
                >
                  {child}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Left Arrow Button (z-30 on top of the left edge fade) */}
      <button
        type="button"
        onClick={() => nudge("left")}
        aria-label="Previous"
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/15 flex items-center justify-center text-[#0A0A0A] dark:text-white hover:bg-[#D40000] dark:hover:bg-[#D40000] hover:border-[#D40000] dark:hover:border-[#D40000] hover:text-white dark:hover:text-white transition-all duration-200 shadow-md cursor-pointer hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D40000]"
      >
        <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
      </button>

      {/* Right Arrow Button (z-30 on top of the right edge fade) */}
      <button
        type="button"
        onClick={() => nudge("right")}
        aria-label="Next"
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/15 flex items-center justify-center text-[#0A0A0A] dark:text-white hover:bg-[#D40000] dark:hover:bg-[#D40000] hover:border-[#D40000] dark:hover:border-[#D40000] hover:text-white dark:hover:text-white transition-all duration-200 shadow-md cursor-pointer hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D40000]"
      >
        <ChevronRight className="w-5 h-5 stroke-[2.2]" />
      </button>
    </div>
  );
}

