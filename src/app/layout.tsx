import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Great_Vibes } from "next/font/google";
import "./globals.css";
import Preloader from "@/components/ui/Preloader";
import SmoothScroll from "@/components/ui/SmoothScroll";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

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

const greatVibes = Great_Vibes({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
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
      { url: "/favicon.ico" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  verification: {
    google: "3dYlbRK0-dCEmOobph18vaJsThTMh6vIWNxY-kLmbb8",
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
  "telephone": ["+919717150055", "+916387576969"],
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
import Script from "next/script";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://ik.imagekit.io" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://ik.imagekit.io" />
        {/* Google Analytics (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-4M25G57FL8"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-4M25G57FL8');
            `,
          }}
        />
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t);}else if(window.matchMedia("(prefers-color-scheme: dark)").matches){document.documentElement.setAttribute("data-theme","dark");}else{document.documentElement.setAttribute("data-theme","light");}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#FFFFFF] text-[#0A0A0A] overflow-x-clip">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Page Top Scroll Progress (2px var(--grad) via transform scaleX) */}
        <ScrollProgress />

        {/* Page Preloader */}
        <Preloader />

        {/* Smooth Scroll Container */}
        <SmoothScroll>{children}</SmoothScroll>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
