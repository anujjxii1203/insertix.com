"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const current = document.documentElement.getAttribute("data-theme") as "light" | "dark";
    if (current === "dark" || current === "light") {
      setTheme(current);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    try {
      localStorage.setItem("theme", nextTheme);
    } catch {
      // ignore in private browsing
    }
  };

  if (!mounted) {
    return (
      <div className={`w-10 h-10 rounded-full border border-[rgba(10,10,10,0.08)] ${className}`} />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D40000] ${
        theme === "dark"
          ? "bg-[#161616] border-white/10 text-amber-300 hover:bg-[#222222]"
          : "bg-[#FAF9F7] border-[rgba(10,10,10,0.08)] text-[#0A0A0A] hover:bg-white"
      } ${className}`}
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 stroke-[2.2]" />
      ) : (
        <Moon className="w-4 h-4 stroke-[2.2]" />
      )}
    </button>
  );
}
