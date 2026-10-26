import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Preloader from "@/components/ui/Preloader";
import SmoothScroll from "@/components/ui/SmoothScroll";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Insertix Media | Video Shoots, Photoshoots, Product & Event Shoots, Marketing",
  description:
    "Insertix Media is a creative media agency for video shoots, photoshoots, product shoots, event coverage and marketing. We turn ideas into content people remember.",
  keywords: [
    "Insertix Media",
    "Video Shoots",
    "Photoshoots",
    "Marketing",
    "Product Shoot",
    "Event Shoots",
    "Commercial Films",
    "Reels",
    "Fashion Photography",
    "Corporate Photography",
    "Event Coverage",
    "Ad Films",
  ],
  authors: [{ name: "Insertix Media Team" }],
  openGraph: {
    title: "Insertix Media | Video Shoots, Photoshoots, Product & Event Shoots, Marketing",
    description:
      "Insertix Media is a creative media agency for video shoots, photoshoots, product shoots, event coverage and marketing. We turn ideas into content people remember.",
    url: "https://insertixmedia.com",
    siteName: "Insertix Media",
    images: [
      {
        url: "/og-image.webp",
        width: 1200,
        height: 630,
        alt: "Insertix Media",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Insertix Media | Video Shoots, Photoshoots, Product & Event Shoots, Marketing",
    description:
      "Insertix Media is a creative media agency for video shoots, photoshoots, product shoots, event coverage and marketing.",
    images: ["/og-image.webp"],
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Insertix Media",
  "image": "https://insertixmedia.com/logo.webp",
  "description":
    "Insertix Media is a creative media agency for video shoots, photoshoots, product shoots, event coverage and marketing.",
  "url": "https://insertixmedia.com",
  "telephone": "+15551234567",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "IN",
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Creative Media Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Video Shoots",
          "description": "Brand films, commercials, ad films, reels and corporate videos shot with cinema cameras.",
        },
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Photoshoots",
          "description": "Portrait, fashion, corporate and lifestyle photography with professional retouching.",
        },
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Marketing",
          "description": "Social media and digital marketing that gets your content in front of the right audience and turns views into customers.",
        },
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Product Shoot",
          "description": "Clean, high-quality product photos and videos for e-commerce, catalogues and ads that make your products sell.",
        },
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Event Shoots",
          "description": "Weddings, concerts, corporate events and launches covered with photo, video, highlight reels and drone shots.",
        },
      },
    ],
  },
};

import ScrollProgress from "@/components/ui/ScrollProgress";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#FFFFFF] text-[#0A0A0A] overflow-x-clip">
        {/* Page Top Scroll Progress (2px var(--grad) via transform scaleX) */}
        <ScrollProgress />

        {/* Page Preloader */}
        <Preloader />

        {/* Smooth Scroll Container */}
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
