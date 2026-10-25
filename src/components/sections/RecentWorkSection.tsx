"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { ArrowUpRight, Sparkles, Play, Folder } from "lucide-react";
import AutoCarousel from "@/components/ui/AutoCarousel";
import { InstagramIcon } from "@/components/ui/SocialIcons";
import { IProject } from "@/lib/models";

function ImageWithFallback({
  src,
  alt,
  fallbackTitle,
  fill,
  sizes,
  className,
}: {
  src: string;
  alt: string;
  fallbackTitle: string;
  fill?: boolean;
  sizes?: string;
  className?: string;
}) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#FAF9F7] text-[#6B6B6B] p-4 text-center select-none">
        <Folder className="w-8 h-8 text-[#D40000]/60 mb-2" />
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#0A0A0A]">
          {fallbackTitle}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      className={className}
      onError={() => setError(true)}
    />
  );
}

function getLinkType(url?: string): "video" | "instagram" | "drive" | "other" {
  if (!url) return "other";
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be") || host.includes("vimeo.com")) {
      return "video";
    }
    if (host.includes("instagram.com")) {
      return "instagram";
    }
    if (host.includes("drive.google.com")) {
      return "drive";
    }
    return "other";
  } catch {
    return "other";
  }
}


export default function RecentWorkSection() {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);

  // Pointer drag tracking to avoid triggering links on swipe/drag
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const isDraggingPointer = useRef(false);

  const loadProjects = () => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProjects(data);
        }
      })
      .catch((err) => console.error("Failed to load projects:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProjects();

    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/events");
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "projects-updated") {
            loadProjects();
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
        loadProjects();
      }
    }, 20000);

    return () => {
      if (es) es.close();
      clearInterval(interval);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    isDraggingPointer.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerDownPos.current) return;
    const dx = Math.abs(e.clientX - pointerDownPos.current.x);
    const dy = Math.abs(e.clientY - pointerDownPos.current.y);
    if (dx > 6 || dy > 6) {
      isDraggingPointer.current = true;
    }
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (isDraggingPointer.current) {
      e.preventDefault();
      e.stopPropagation();
    }
    pointerDownPos.current = null;
    isDraggingPointer.current = false;
  };

  return (
    <section id="recent-work" className="relative py-16 sm:py-24 bg-[#FFFFFF] border-t border-[rgba(10,10,10,0.08)] overflow-hidden content-auto">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 mb-12 sm:mb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="brand-pill mb-4 text-[#0A0A0A]">
              <span>04 — Case Studies</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#0A0A0A]">
              Recent <span className="font-serif italic font-normal tracking-normal text-[#D40000] lowercase first-letter:uppercase">Work</span>
            </h2>
          </div>
        </div>
      </div>

      {/* Right to Left Continuous Auto-Scrolling Carousel */}
      {loading ? (
        <div className="flex gap-6 px-6 max-w-[1280px] mx-auto overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-[520px] max-w-[85vw] h-[480px] rounded-[24px] bg-white animate-pulse border border-[rgba(10,10,10,0.08)] flex-shrink-0" />
          ))}
        </div>
      ) : (
        <AutoCarousel
          speed={55}
          cardWidth="w-[520px] max-w-[85vw]"
        >
          {projects.map((project) => {
            const hasLink = Boolean(project.link && project.link.trim() !== "");
            const linkType = getLinkType(project.link);

            const cardContent = (
              <div
                className={`brand-card card-glow overflow-hidden h-[460px] flex flex-col justify-between group/card select-none bg-white border border-[rgba(10,10,10,0.08)] rounded-[24px] relative isolate ${
                  hasLink ? "cursor-pointer" : "cursor-default"
                }`}
              >
                {/* Media Container with Fixed 4:3 Aspect Ratio */}
                <div className="relative z-[1] w-full aspect-[4/3] overflow-hidden bg-[#F5F4F2]">
                  <ImageWithFallback
                    src={project.coverImage}
                    alt={project.title}
                    fallbackTitle={project.title}
                    fill
                    sizes="(max-width: 640px) 85vw, 520px"
                    className={`object-cover transition-transform duration-500 ease-out ${
                      hasLink ? "group-hover/card:scale-[1.03]" : ""
                    }`}
                  />

                  {/* Viewfinder corner brackets on hover for this card only */}
                  {hasLink && (
                    <div className="absolute inset-3 pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
                      <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#D40000]" />
                      <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#D40000]" />
                      <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#D40000]" />
                      <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#D40000]" />
                    </div>
                  )}

                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/95 text-[#0A0A0A] border border-[rgba(10,10,10,0.08)] shadow-xs">
                      {project.category}
                    </span>
                    {project.metrics && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono bg-[#0A0A0A]/90 text-white">
                        <Sparkles className="w-3 h-3 text-[#D40000]" />
                        {project.metrics}
                      </span>
                    )}
                  </div>

                  {/* Circular Button matching link type (only if project has link) */}
                  {hasLink && (
                    <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white text-[#0A0A0A] flex items-center justify-center group-hover/card:bg-[#D40000] group-hover/card:text-white transition-all duration-200 shadow-md">
                      {linkType === "video" ? (
                        <Play className="w-4 h-4 fill-currentColor translate-x-0.5" />
                      ) : linkType === "instagram" ? (
                        <InstagramIcon className="w-4 h-4" />
                      ) : linkType === "drive" ? (
                        <Folder className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5 transition-transform duration-200" />
                      )}
                    </div>
                  )}
                </div>

                {/* Slim Content Area */}
                <div className="p-5 flex-1 flex flex-col justify-center relative z-[1]">
                  <div className="flex items-center justify-between text-xs font-mono text-[#6B6B6B] mb-1">
                    <span className="truncate max-w-[70%]">{project.client}</span>
                    <span>{project.year}</span>
                  </div>
                  <h3 className={`text-lg font-bold text-[#0A0A0A] truncate ${
                    hasLink ? "group-hover/card:text-[#D40000] transition-colors duration-200" : ""
                  }`}>
                    {project.title}
                  </h3>
                </div>
              </div>
            );

            if (hasLink) {
              return (
                <a
                  key={project.id}
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${project.title}`}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onClickCapture={handleClickCapture}
                  className="block w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D40000] rounded-[24px]"
                >
                  {cardContent}
                </a>
              );
            }

            return (
              <div key={project.id} className="w-full h-full">
                {cardContent}
              </div>
            );
          })}
        </AutoCarousel>
      )}
    </section>
  );
}

