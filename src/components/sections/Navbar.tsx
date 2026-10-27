"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Menu, X, ArrowUpRight, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getWhatsAppUrl } from "@/components/ui/WhatsAppFloating";
import ThemeToggle from "@/components/ui/ThemeToggle";

const NAV_ITEMS = [
  { name: "Insertix Media", href: "#hero" },
  { name: "Work", href: "#work" },
  { name: "About", href: "#about" },
  { name: "Members", href: "#members" },
  { name: "Recent Work", href: "#recent-work" },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  const waUrl = getWhatsAppUrl();

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["hero", "work", "about", "members", "recent-work", "contact"];
      const current = sections.find((sec) => {
        const el = document.getElementById(sec);
        if (el) {
          const rect = el.getBoundingClientRect();
          return rect.top <= 200 && rect.bottom >= 100;
        }
        return false;
      });
      if (current) setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-50 h-[72px] site-navbar backdrop-blur-[12px] border-b transition-colors duration-200">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 h-full flex items-center justify-between gap-4">
        {/* Left: Brand Logo (height 38px, auto width, no extra text) */}
        <div className="flex items-center min-w-[160px]">
          <a
            href="#hero"
            onClick={(e) => handleNavClick(e, "#hero")}
            className="flex items-center group py-1"
            id="navbar-logo"
            aria-label="Insertix Media Home"
          >
            <div className="relative h-[38px] w-[90px] sm:w-[98px]">
              <Image
                src="/logo.webp"
                alt="Insertix Media"
                fill
                priority
                sizes="(max-width: 640px) 90px, 98px"
                className="logo-light object-contain object-left group-hover:opacity-90 transition-opacity"
              />
              <Image
                src="/logo-dark.png"
                alt="Insertix Media"
                fill
                priority
                sizes="(max-width: 640px) 90px, 98px"
                className="logo-dark object-contain object-left group-hover:opacity-90 transition-opacity"
              />
            </div>
          </a>
        </div>

        {/* Center: Desktop Navigation Links Pill */}
        <nav className="hidden lg:flex items-center gap-1 site-nav-pill border px-4 py-1.5 rounded-full shadow-xs transition-colors duration-200">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.href.replace("#", "");
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={`relative px-4 py-1 text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "text-[#D40000] font-semibold"
                    : "text-[#6B6B6B] hover:text-[#0A0A0A]"
                }`}
              >
                {item.name}
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#D40000] rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right: Red Primary CTA Button + Theme Toggle */}
        <div className="hidden lg:flex items-center justify-end gap-3 min-w-[200px]">
          <ThemeToggle />
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            id="navbar-contact-cta"
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D40000] hover:bg-[#A80000] text-white font-semibold text-sm tracking-wide shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Contact Us</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>

        {/* Mobile: Theme toggle + Hamburger Button */}
        <div className="lg:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="p-2 rounded-xl site-nav-pill border text-[#0A0A0A] hover:text-[#D40000] focus:outline-none transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-x-0 top-[72px] site-navbar border-b shadow-xl p-6 flex flex-col gap-4 z-40 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex flex-col gap-2">
              {NAV_ITEMS.map((item, idx) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="px-4 py-3 rounded-xl site-nav-pill hover:opacity-90 text-base font-medium text-[#0A0A0A] hover:text-[#D40000] flex items-center justify-between border transition-colors"
                >
                  <span>{item.name}</span>
                  <ArrowUpRight className="w-4 h-4 text-[#6B6B6B]" />
                </motion.a>
              ))}
            </div>

            {/* Mobile Contact Us CTA -> Red Pill */}
            <motion.a
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              id="mobile-contact-cta"
              className="mt-2 flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-[#D40000] hover:bg-[#A80000] text-white font-bold text-base tracking-wide shadow-sm"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>Contact Us on WhatsApp</span>
              <ArrowUpRight className="w-5 h-5" />
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
