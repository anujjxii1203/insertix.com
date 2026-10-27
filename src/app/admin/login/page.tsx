"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import { storeAdminToken, getReturnTab, clearDraft } from "@/lib/adminAuth";


export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Authentication failed");
        setLoading(false);
        return;
      }

      // Persist token in localStorage for Bearer auth on all subsequent write requests
      if (data.token) {
        storeAdminToken(data.token);
      }

      // Return to the tab they were editing (set when session expired mid-edit)
      const returnTab = getReturnTab();
      window.location.href = returnTab ? `/admin?tab=${returnTab}` : "/admin";
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F4F2] text-[#0A0A0A] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Soft static red radial ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(255, 90, 77, 0.08) 0%, rgba(212, 0, 0, 0.03) 45%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="w-full max-w-md bg-white p-8 sm:p-10 border border-[rgba(10,10,10,0.08)] rounded-[24px] shadow-[0_10px_30px_rgba(10,10,10,0.05)] relative z-10">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative h-10 w-28 mb-4">
            <Image
              src="/logo.webp"
              alt="Insertix Media"
              fill
              sizes="112px"
              className="object-contain"
              priority
            />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF9F7] border border-[rgba(10,10,10,0.08)] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#D40000]" />
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#0A0A0A]">
              Command Center
            </span>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#0A0A0A]">
            Admin <span className="font-serif italic font-normal text-[#D40000] lowercase first-letter:uppercase">Login</span>
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Sign in to manage projects, specialists, reviews, and leads
          </p>
        </div>

        {error && (
          <div className="p-3.5 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#D40000]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-[#6B6B6B] uppercase tracking-wider mb-2 font-bold">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6B6B6B] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@insertixmedia.com"
                className="w-full h-14 pl-11 pr-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] placeholder-[#6B6B6B]/60 focus:outline-none focus:border-[#D40000] focus:ring-2 focus:ring-[#D40000]/10 text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#6B6B6B] uppercase tracking-wider mb-2 font-bold">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6B6B6B] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-14 pl-11 pr-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] placeholder-[#6B6B6B]/60 focus:outline-none focus:border-[#D40000] focus:ring-2 focus:ring-[#D40000]/10 text-sm transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 mt-4 rounded-full text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:brightness-105 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #FF5A4D 0%, #D40000 55%, #7A0000 100%)",
            }}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Enter Admin Studio</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[rgba(10,10,10,0.08)] text-center">
          <p className="text-[11px] font-mono text-[#6B6B6B]">
            Default credentials: <br />
            <span className="text-[#0A0A0A] font-bold">admin@insertixmedia.com / admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
