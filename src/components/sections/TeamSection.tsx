"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { InstagramIcon } from "@/components/ui/SocialIcons";
import { ITeamMember, ISiteSettings } from "@/lib/models";
import { DEFAULT_SITE_SETTINGS } from "@/lib/defaultSettings";
import { normalizeImageUrl } from "@/lib/api";
import { useLiveEvent } from "@/lib/liveSync";
import { MEMBERS_DATA } from "@/constants/members";

function TeamAvatar({ member }: { member: ITeamMember }) {
  const [error, setError] = useState(false);
  const resolvedSrc = normalizeImageUrl(member.avatar);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (error || !resolvedSrc) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--surface-2)] text-[var(--muted)]">
        <div className="w-16 h-16 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
          <span className="text-lg font-mono font-bold text-[#D40000]">
            {getInitials(member.name)}
          </span>
        </div>
      </div>
    );
  }

  // Support per-member focal values or fallback to center 20%
  const focalX = member.focalX ?? 50;
  const focalY = member.focalY ?? 20;
  const zoom = Math.max(1, member.zoom ?? 1);

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        transform: zoom > 1 ? `scale(${zoom})` : "none",
        transformOrigin: `${focalX}% ${focalY}%`,
      }}
    >
      <Image
        src={resolvedSrc}
        alt={member.name}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        quality={80}
        style={{
          objectFit: "cover",
          objectPosition: `${focalX}% ${focalY}%`,
        }}
        className="object-cover object-top filter grayscale group-hover:grayscale-0 transition-all duration-300 ease-out"
        onError={() => setError(true)}
      />
    </div>
  );
}

export default function TeamSection({ initialSettings }: { initialSettings?: ISiteSettings }) {
  const [team, setTeam] = useState<ITeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<ISiteSettings>(initialSettings || DEFAULT_SITE_SETTINGS);

  const loadTeam = () => {
    fetch("/api/team")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTeam(data);
        } else {
          // Fallback to constants if API empty
          setTeam(
            MEMBERS_DATA.map((m, idx) => ({
              id: `team-static-${idx + 1}`,
              name: m.name,
              role: m.role,
              bio: m.description,
              avatar: m.image,
              order: idx + 1,
              visible: true,
              instagram: m.instagram,
              socials: {
                instagram: m.instagram,
              },
              focalX: m.focalX,
              focalY: m.focalY,
              zoom: m.zoom,
            }))
          );
        }
      })
      .catch((err) => {
        console.error("Failed to load team members:", err);
        // Fallback to static config
        setTeam(
          MEMBERS_DATA.map((m, idx) => ({
            id: `team-static-${idx + 1}`,
            name: m.name,
            role: m.role,
            bio: m.description,
            avatar: m.image,
            order: idx + 1,
            visible: true,
            instagram: m.instagram,
            socials: {
              instagram: m.instagram,
            },
            focalX: m.focalX,
            focalY: m.focalY,
            zoom: m.zoom,
          }))
        );
      })
      .finally(() => setLoading(false));
  };

  useLiveEvent("team-updated", () => {
    loadTeam();
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
    loadTeam();

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadTeam();
      }
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  const heading = settings.sectionHeadings?.members || DEFAULT_SITE_SETTINGS.sectionHeadings.members;

  return (
    <section id="members" className="relative py-16 sm:py-24 bg-[var(--bg-alt)] border-t border-[var(--border)] content-auto overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 sm:mb-16 gap-6">
          <div>
            <div className="brand-pill mb-4 text-[var(--text)]">
              <span>03 — The Specialists</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[var(--text)]">
              {heading.title || "Meet The"}{" "}
              <span className="font-serif italic font-normal tracking-normal text-[#D40000] lowercase first-letter:uppercase">
                {heading.accentWord || "Members"}
              </span>
            </h2>
          </div>
          <p className="text-[var(--muted)] max-w-md text-sm sm:text-base leading-relaxed">
            {heading.subtext ||
              "Our core collective unites award-winning cinematographers, photographers, video editors, marketing leads, and production managers operating at peak craft."}
          </p>
        </div>

        {/* Team Grid: 4 columns on desktop (1024px+), 2 on tablet (640px - 1023px), 1 on mobile (<640px) */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7 lg:gap-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-[460px] rounded-[24px] bg-[var(--surface)] animate-pulse border border-[var(--border)]"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7 lg:gap-8 items-stretch">
            {team.map((member) => {
              // Normalize role text (fixing typo if present)
              const cleanRole = (member.role || "")
                .replace(/deginer/gi, "DESIGNER")
                .toUpperCase();

              // Resolve Instagram URL from member object or config
              const matchFromConfig = MEMBERS_DATA.find((m) => {
                const configFirst = m.name.toLowerCase().split(" ")[0];
                const memberFirst = member.name.toLowerCase().split(" ")[0];
                return m.name.toLowerCase() === member.name.toLowerCase() || configFirst === memberFirst;
              });

              const instagramUrl =
                (member.instagram && member.instagram.trim() !== "" ? member.instagram.trim() : null) ||
                (member.socials?.instagram && member.socials.instagram.trim() !== "" ? member.socials.instagram.trim() : null) ||
                (matchFromConfig?.instagram && matchFromConfig.instagram.trim() !== "" ? matchFromConfig.instagram.trim() : null);

              return (
                <div
                  key={member.id}
                  className="group bg-white rounded-[24px] border border-[rgba(10,10,10,0.08)] shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:border-[#D40000]/30 hover:shadow-[0_12px_32px_rgba(212,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden flex flex-col justify-between"
                >
                  {/* Photo Container: aspect-[4/5] with rounded top corners */}
                  <div className="relative w-full aspect-[4/5] overflow-hidden rounded-t-[24px] bg-[#1a1a1a]">
                    <TeamAvatar member={member} />

                    {/* Single circular Instagram button: top-right, 40px, white bg, dark icon, opacity-0 by default on desktop, visible on hover & always visible on mobile */}
                    {instagramUrl && (
                      <div className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 flex items-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-auto">
                        <a
                          href={instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${member.name} on Instagram`}
                          className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#0A0A0A] hover:bg-[#D40000] hover:text-white transition-all duration-200 shadow-md cursor-pointer"
                        >
                          <InstagramIcon className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Below photo: padding ~24px */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* 1. Role label: small, UPPERCASE, monospace, letter-spacing wide, brand red */}
                      <span className="text-xs font-mono uppercase tracking-wider text-[#D40000] font-semibold block mb-1.5">
                        {cleanRole}
                      </span>

                      {/* 2. Name: large, bold, black (~28px), turns red on hover */}
                      <h3 className="text-[26px] sm:text-[28px] font-bold text-[#0A0A0A] group-hover:text-[#D40000] transition-colors duration-300 leading-tight">
                        {member.name}
                      </h3>

                      {/* 3. Short description: gray text (~16px), line-height ~1.7, clamped to 3 lines */}
                      <p className="text-[#6B6B6B] text-[15px] sm:text-[16px] leading-[1.7] mt-3 line-clamp-3">
                        {member.bio}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
