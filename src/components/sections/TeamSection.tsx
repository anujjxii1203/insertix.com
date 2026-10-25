"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import TiltCard from "@/components/ui/TiltCard";
import { LinkedInIcon, InstagramIcon, TwitterXIcon, DribbbleIcon } from "@/components/ui/SocialIcons";
import { ITeamMember } from "@/lib/models";

function TeamAvatar({ member }: { member: ITeamMember }) {
  const [error, setError] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (error || !member.avatar) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#FAF9F7] text-[#6B6B6B]">
        <div className="w-20 h-20 rounded-full bg-[#EFECE6] border border-[rgba(10,10,10,0.1)] flex items-center justify-center">
          <span className="text-xl font-mono font-bold text-[#D40000]">
            {getInitials(member.name)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={member.avatar}
      alt={member.name}
      fill
      className="object-cover object-top filter grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 ease-out"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      onError={() => setError(true)}
    />
  );
}
export default function TeamSection() {
  const [team, setTeam] = useState<ITeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTeam = () => {
    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTeam(data);
        }
      })
      .catch((err) => console.error("Failed to load team members:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTeam();

    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/events");
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "team-updated") {
            loadTeam();
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
        loadTeam();
      }
    }, 20000);

    return () => {
      if (es) es.close();
      clearInterval(interval);
    };
  }, []);

  return (
    <section id="members" className="relative py-16 sm:py-24 bg-[#F5F4F2] border-t border-[rgba(10,10,10,0.08)] content-auto">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 sm:mb-16 gap-6">
          <div>
            <div className="brand-pill mb-4 text-[#0A0A0A]">
              <span>03 — The Specialists</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#0A0A0A]">
              Meet The <span className="font-serif italic font-normal tracking-normal text-[#D40000] lowercase first-letter:uppercase">Members</span>
            </h2>
          </div>
          <p className="text-[#6B6B6B] max-w-md text-sm sm:text-base leading-relaxed">
            Our core collective unites award-winning cinematographers, photographers,
            video editors, marketing leads, and production managers operating at peak craft.
          </p>
        </div>

        {/* Team Grid: 4 columns desktop, 2 tablet, 1 mobile with equal heights */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-96 rounded-[24px] bg-white animate-pulse border border-[rgba(10,10,10,0.08)]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <TiltCard key={member.id} className="h-full">
                <div className="brand-card card-glow overflow-hidden h-full flex flex-col justify-between group bg-white border border-[rgba(10,10,10,0.08)] rounded-[24px] relative isolate">
                  {/* Photo Container */}
                  <div className="relative z-[1] w-full h-72 sm:h-80 overflow-hidden bg-[#FAF9F7]">
                    <TeamAvatar member={member} />

                    {/* Social links hover overlay */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {member.socials?.linkedin && (
                        <a
                          href={member.socials.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs border border-[rgba(10,10,10,0.1)] flex items-center justify-center text-[#0A0A0A] hover:text-[#D40000] hover:border-[#D40000]/40 transition-colors shadow-xs"
                          aria-label="LinkedIn"
                        >
                          <LinkedInIcon className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {member.socials?.instagram && (
                        <a
                          href={member.socials.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs border border-[rgba(10,10,10,0.1)] flex items-center justify-center text-[#0A0A0A] hover:text-[#D40000] hover:border-[#D40000]/40 transition-colors shadow-xs"
                          aria-label="Instagram"
                        >
                          <InstagramIcon className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {member.socials?.twitter && (
                        <a
                          href={member.socials.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs border border-[rgba(10,10,10,0.1)] flex items-center justify-center text-[#0A0A0A] hover:text-[#D40000] hover:border-[#D40000]/40 transition-colors shadow-xs"
                          aria-label="Twitter"
                        >
                          <TwitterXIcon className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {member.socials?.dribbble && (
                        <a
                          href={member.socials.dribbble}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs border border-[rgba(10,10,10,0.1)] flex items-center justify-center text-[#0A0A0A] hover:text-[#D40000] hover:border-[#D40000]/40 transition-colors shadow-xs"
                          aria-label="Dribbble"
                        >
                          <DribbbleIcon className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Member Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between relative z-[1]">
                    <div>
                      <span className="text-[11px] font-mono text-[#D40000] tracking-wider uppercase block mb-1 font-semibold">
                        {member.role}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-[#0A0A0A] group-hover:text-[#D40000] transition-colors">
                        {member.name}
                      </h3>
                      <p className="text-[#6B6B6B] text-xs sm:text-sm mt-2 leading-relaxed line-clamp-3">
                        {member.bio}
                      </p>
                    </div>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
