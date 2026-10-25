"use client";

import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#FFFFFF] text-[#0B0B14] p-6 overflow-hidden">
      {/* Soft ambient gradient */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none opacity-40"
        style={{
          background: "radial-gradient(circle, #00C2FF 0%, #3B5BFF 40%, #7B3FF2 70%, transparent 80%)",
          filter: "blur(90px)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 text-center max-w-lg nexo-card bg-white p-10 border border-[rgba(11,11,20,0.08)] shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-[#F7F7FB] border border-[rgba(11,11,20,0.08)] flex items-center justify-center text-[#3B5BFF] mx-auto mb-6">
          <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: "12s" }} />
        </div>

        <span className="text-[#3B5BFF] font-mono text-xs tracking-widest uppercase block mb-2 font-bold">
          ERROR 404
        </span>

        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#0B0B14] mb-3">
          Page Not Found
        </h1>

        <p className="text-[#6A6A78] text-sm mb-8 leading-relaxed font-mono">
          The requested coordinate does not exist or has been relocated.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#0B0B14] hover:bg-[#1a1a2e] text-white font-bold text-sm uppercase tracking-wider transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return To Orbit</span>
        </Link>
      </div>
    </div>
  );
}
