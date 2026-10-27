"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { ArrowUpRight, Sparkles, Play, Folder } from "lucide-react";
import AutoCarousel from "@/components/ui/AutoCarousel";
import { InstagramIcon } from "@/components/ui/SocialIcons";
import { IProject, ISiteSettings } from "@/lib/models";
import { DEFAULT_SITE_SETTINGS } from "@/lib/defaultSettings";
import { useLiveEvent } from "@/lib/liveSync";
import { normalizeImageUrl, getOptimizedImageUrl } from "@/lib/image";

function ImageWithFallback({
  src,
  alt,
  fallbackTitle,
  category,
  fill,
  sizes,
  className,
  focalX = 50,
  focalY = 50,
  zoom = 1,
}: {
  src: string;
  alt: string;
  fallbackTitle: string;
  category?: string;
  fill?: boolean;
  sizes?: string;
  className?: string;
  focalX?: number;
  focalY?: number;
  zoom?: number;
}) {
  const [error, setError] = useState(false);
  const normalized = normalizeImageUrl(src);
  const resolvedSrc = getOptimizedImageUrl(normalized, { width: 720, quality: 75 });

  if (error || !resolvedSrc) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--surface-2)] text-[var(--muted)] p-6 text-center select-none relative overflow-hidden">
        <div className="w-12 h-12 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex items-center justify-center mb-2.5">
          <Folder className="w-6 h-6 text-[#D40000]/70" />
        </div>
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text)] line-clamp-1 max-w-[85%]">
          {fallbackTitle}
        </span>
        {category && (
          <span className="text-[9px] font-mono text-[#D40000] uppercase tracking-widest mt-0.5">
            {category}
          </span>
        )}
      </div>
    );
  }

  const effectiveZoom = Math.max(1, zoom || 1);

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        transform: effectiveZoom > 1 ? `scale(${effectiveZoom})` : "none",
        transformOrigin: `${focalX}% ${focalY}%`,
      }}
    >
      <Image
        src={resolvedSrc}
        alt={alt}
        fill={fill}
        sizes={sizes}
        quality={75}
        style={{
          objectFit: "cover",
          objectPosition: `${focalX}% ${focalY}%`,
        }}
        className={className}
        onError={() => setError(true)}
      />
    </div>
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

export default function RecentWorkSection({
  initialSettings,
  initialProjects = [],
}: {
  initialSettings?: ISiteSettings;
  initialProjects?: IProject[];
}) {
  const [projects, setProjects] = useState<IProject[]>(initialProjects);
  const [loading, setLoading] = useState(initialProjects.length === 0);
  const [settings, setSettings] = useState<ISiteSettings>(initialSettings || DEFAULT_SITE_SETTINGS);

  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const isDraggingPointer = useRef(false);

  const loadProjects = () => {
    fetch("/api/projects?t=" + Date.now())
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setProjects(data);
        }
      })
      .catch((err) => console.error("Failed to load projects:", err))
      .finally(() => setLoading(false));
  };

  useLiveEvent("projects-updated", () => {
    loadProjects();
  });

  useLiveEvent("settings-updated", () => {
    fetch("/api/settings")
      .then((r) => r.ok && r.json())
      .then((fresh) => {
        if (fresh && fresh.sectionHeadings) setSettings(fresh);
      })
      .catch(() => {});
  });

  useEffect(() => {
    loadProjects();

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadProjects();
      }
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  const heading = settings.sectionHeadings?.recentWork || DEFAULT_SITE_SETTINGS.sectionHeadings.recentWork;

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
    <section id="recent-work" className="relative py-16 sm:py-24 bg-[var(--bg)] border-t border-[var(--border)] overflow-hidden content-auto">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 mb-12 sm:mb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="brand-pill mb-4 text-[var(--text)]">
              <span>04 — Case Studies</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[var(--text)]">
              {heading.title || "Recent"}{" "}
              <span className="font-serif italic font-normal tracking-normal text-[#D40000] lowercase first-letter:uppercase">
                {heading.accentWord || "Work"}
              </span>
            </h2>
          </div>
          {heading.subtext && (
            <p className="text-[var(--muted)] text-sm sm:text-base max-w-md">
              {heading.subtext}
            </p>
          )}
        </div>
      </div>

      {/* Right to Left Continuous Auto-Scrolling Carousel */}
      {loading ? (
        <div className="flex gap-6 px-6 max-w-[1280px] mx-auto overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-[520px] max-w-[85vw] h-[480px] rounded-[24px] bg-[var(--surface)] animate-pulse border border-[var(--border)] flex-shrink-0" />
          ))}
        </div>
      ) : (
        <AutoCarousel speed={55} cardWidth="w-[520px] max-w-[85vw]">
          {projects.map((project) => {
            const targetUrl = (project as any).instagram || project.link;
            const hasLink = Boolean(targetUrl && targetUrl.trim() !== "");
            const linkType = getLinkType(targetUrl);

            const cardContent = (
              <div
                className={`brand-card card-glow overflow-hidden h-[460px] flex flex-col justify-between group/card select-none bg-[var(--surface)] border border-[var(--border)] rounded-[24px] relative isolate ${
                  hasLink ? "cursor-pointer" : "cursor-default"
                }`}
              >
                {/* Media Container with Fixed 4:3 Aspect Ratio */}
                <div className="relative z-[1] w-full aspect-[4/3] overflow-hidden bg-[var(--surface-2)]">
                  <ImageWithFallback
                    src={project.coverImage}
                    alt={project.title}
                    fallbackTitle={project.title}
                    category={project.category}
                    fill
                    sizes="(max-width: 640px) 85vw, 520px"
                    focalX={project.focalX ?? 50}
                    focalY={project.focalY ?? 50}
                    zoom={project.zoom ?? 1}
                    className={`object-cover transition-transform duration-500 ease-out ${
                      hasLink ? "group-hover/card:scale-[1.03]" : ""
                    }`}
                  />

                  {/* Viewfinder corner brackets on hover */}
                  {hasLink && (
                    <div className="absolute inset-3 pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
                      <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#D40000]" />
                      <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#D40000]" />
                      <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#D40000]" />
                      <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#D40000]" />
                    </div>
                  )}

                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] shadow-xs">
                      {project.category}
                    </span>
                    {project.metrics && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono bg-[#0A0A0A]/90 text-white">
                        <Sparkles className="w-3 h-3 text-[#D40000]" />
                        {project.metrics}
                      </span>
                    )}
                  </div>

                  {/* Circular Button matching link type */}
                  {hasLink && (
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open on Instagram"
                      className="absolute bottom-3 right-3 z-20 w-10 h-10 rounded-full bg-white text-[#0A0A0A] flex items-center justify-center group-hover/card:bg-[#D40000] group-hover/card:text-white transition-all duration-200 shadow-md cursor-pointer pointer-events-auto"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {linkType === "video" ? (
                        <Play className="w-4 h-4 fill-currentColor translate-x-0.5" />
                      ) : linkType === "instagram" ? (
                        <InstagramIcon className="w-4 h-4" />
                      ) : linkType === "drive" ? (
                        <Folder className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5 transition-transform duration-200" />
                      )}
                    </a>
                  )}
                </div>

                {/* Content Area */}
                <div className="p-5 flex-1 flex flex-col justify-center relative z-[1]">
                  <div className="flex items-center justify-between text-xs font-mono text-[var(--muted)] mb-1">
                    <span className="truncate max-w-[70%]">{project.client}</span>
                    <span>{project.year}</span>
                  </div>
                  <h3
                    className={`text-lg font-bold text-[var(--text)] truncate ${
                      hasLink ? "group-hover/card:text-[#D40000] transition-colors duration-200" : ""
                    }`}
                  >
                    {project.title}
                  </h3>
                </div>
              </div>
            );

            return (
              <div key={project.id} className="w-full h-full relative">
                {cardContent}
                {hasLink && (
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${project.title}`}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onClickCapture={handleClickCapture}
                    className="absolute inset-0 z-10 rounded-[24px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D40000]"
                  />
                )}
              </div>
            );
          })}
        </AutoCarousel>
      )}
    </section>
  );
}
