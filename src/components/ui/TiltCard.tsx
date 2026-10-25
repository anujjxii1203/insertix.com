"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export default function TiltCard({
  children,
  className = "",
  glowColor = "rgba(212, 0, 0, 0.05)",
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse), (max-width: 768px)").matches) {
      setIsMobile(true);
    }
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Subtle springs (max 6 degrees tilt)
  const mouseXSpring = useSpring(x, { stiffness: 180, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 180, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["6deg", "-6deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-6deg", "6deg"]);

  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);

    setGlarePos({
      x: (mouseX / width) * 100,
      y: (mouseY / height) * 100,
    });
  };

  const handleMouseEnter = () => {
    if (!isMobile) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  if (isMobile) {
    return <div className={`relative h-full w-full ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative will-change-transform ${className}`}
    >
      <div style={{ transform: "translateZ(10px)" }} className="h-full w-full">
        {children}
      </div>

      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[24px] transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 240px at ${glarePos.x}% ${glarePos.y}%, ${glowColor}, transparent 75%)`,
          }}
        />
      )}
    </motion.div>
  );
}
