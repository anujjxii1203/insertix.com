import type { NextConfig } from "next";

const backendUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  devIndicators: false,
  productionBrowserSourceMaps: false,
  images: {
    localPatterns: [
      {
        pathname: "/**",
        search: "*",
      },
      {
        pathname: "/**",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      {
        protocol: "https",
        hostname: "insertix.onrender.com",
      },
      ...(backendUrl.startsWith("https://")
        ? [
            {
              protocol: "https" as const,
              hostname: new URL(backendUrl).hostname,
            },
          ]
        : []),
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  async rewrites() {
    // Only forward /api/ calls if an external backend URL is explicitly configured (e.g. Render).
    // By default, Next.js internal App Router API routes (/src/app/api/*) handle all requests.
    if (process.env.NEXT_PUBLIC_API_URL && !backendUrl.includes("localhost") && !backendUrl.includes("127.0.0.1")) {
      return [
        {
          source: "/api/revalidate",
          destination: "/api/revalidate",
        },
        {
          source: "/api/:path*",
          destination: `${backendUrl}/api/:path*`,
        },
        {
          source: "/uploads/:path*",
          destination: `${backendUrl}/uploads/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
