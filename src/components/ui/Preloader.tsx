"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function Preloader() {
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
      setIsLoaded(true);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsLoaded(true), 200);
          return 100;
        }
        const increment = Math.floor(Math.random() * 16) + 12;
        return Math.min(prev + increment, 100);
      });
    }, 28);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {!isLoaded && (
        <motion.div
          key="preloader"
          id="global-preloader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.35, ease: "easeOut" },
          }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#FFFFFF] text-[#0A0A0A]"
        >
          {/* Brand Logo only (no text subtitle) */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative mb-6"
          >
            <div className="relative w-48 h-20">
              <Image
                src="/logo.webp"
                alt="Insertix Media"
                fill
                priority
                className="object-contain"
              />
            </div>
          </motion.div>

          {/* Progress bar and counter */}
          <div className="w-48 max-w-[80vw]">
            <div className="flex justify-between items-center text-xs font-mono text-[#6B6B6B] mb-2">
              <span className="tracking-wider text-[10px]">LOADING</span>
              <span className="text-[#D40000] font-bold">{progress}%</span>
            </div>
            <div className="h-1 w-full bg-[#F5F4F2] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#D40000] transition-all duration-100 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
