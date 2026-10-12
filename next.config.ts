
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,

  // Disable partial prefetching of URL data
  partialPrefetching: false,

  // Allow development access from your local network IP
  allowedDevOrigins: ["192.168.29.103"],

  images: {
    formats: ["image/avif", "image/webp"],
  },

  async redirects() {
    return [
      {
        source: "/contact",
        destination: "https://www.digitallynext.com/contact",
        permanent: true,
      },
      {
        source: "/careers",
        destination: "https://www.digitallynext.com/careers",
        permanent: true,
      },
    ];
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
