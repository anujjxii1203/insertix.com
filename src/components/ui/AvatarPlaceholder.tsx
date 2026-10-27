import React from "react";
import { User } from "lucide-react";

interface AvatarPlaceholderProps {
  /**
   * Outer circle diameter in pixels or css class. Defaults to 58px.
   */
  size?: number | string;
  className?: string;
  iconClassName?: string;
}

export default function AvatarPlaceholder({
  size = 58,
  className = "",
  iconClassName = "",
}: AvatarPlaceholderProps) {
  const isNumber = typeof size === "number";
  const style = isNumber
    ? { width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, minHeight: `${size}px` }
    : undefined;

  const sizeClass = isNumber ? "" : size;

  return (
    <div
      style={style}
      className={`rounded-full flex items-center justify-center shrink-0 border transition-colors duration-200 select-none bg-[#EEEEEE] border-[#DDDDDD] dark:bg-white/[0.08] dark:border-white/[0.12] ${sizeClass} ${className}`}
    >
      <User
        aria-hidden="true"
        className={`w-1/2 h-1/2 text-[#6B7280] dark:text-[#9CA3AF] ${iconClassName}`}
        strokeWidth={2}
      />
    </div>
  );
}
