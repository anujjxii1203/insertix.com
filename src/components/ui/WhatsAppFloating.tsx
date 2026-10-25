"use client";

import { WhatsAppIcon } from "@/components/ui/SocialIcons";

export const getWhatsAppUrl = (customText?: string) => {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919717150055";
  const cleanNumber = number.replace(/[^0-9]/g, "");
  const text = customText
    ? encodeURIComponent(customText)
    : "Hi%20Insertix%20Media%2C%20I%20want%20to%20discuss%20a%20project";
  return `https://wa.me/${cleanNumber}?text=${text}`;
};

export default function WhatsAppFloating() {
  const waUrl = getWhatsAppUrl();

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Insertix Media on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#25D366] text-white shadow-2xl whatsapp-pulse hover:scale-110 active:scale-95 transition-transform duration-300 group"
      id="floating-whatsapp-btn"
    >
      <WhatsAppIcon className="w-7 h-7 md:w-8 md:h-8 fill-current group-hover:rotate-12 transition-transform duration-300" />
      {/* Tooltip on hover */}
      <span className="absolute right-full mr-3 px-3 py-1.5 rounded-lg bg-zinc-900/90 text-xs font-semibold text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 border border-white/10 shadow-lg">
        Chat on WhatsApp
      </span>
    </a>
  );
}
