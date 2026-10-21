import type { NextConfig } from "next";

// Files in /public keep their names from one deploy to the next, so a browser can't tell a
// changed file from the one it already has. Rule for everyone: when a file's content changes,
// give it a new name (e.g. poster-v2.webp), or returning visitors may keep the old one for a
// week (31 days for anything shown through next/image).
const WEEK_THEN_REVALIDATE = "public, max-age=604800, stale-while-revalidate=2592000";
const FOREVER = "public, max-age=31536000, immutable";

// Asset folders under /public. The header rule only matches paths that end in a file
// extension, so the /work and /services pages themselves are never cached this way.
const ASSET_DIRS = "world|models|forms|work|services|studio|video|logos|archive|recognition|brand|icons";
const ASSET_EXT = "webp|png|jpg|jpeg|svg|glb|gltf|bin|ktx2|mp4|webm|vtt";

const nextConfig: NextConfig = {
  cacheComponents: true,

  // Disable partial prefetching of URL data
  partialPrefetching: false,

  // Allow development access from your local network IP
  allowedDevOrigins: ["192.168.29.103"],

  // Every page is fully prerendered with its metadata already in <head>. By default Next
  // still sends crawlers and link-preview bots (Bingbot, Applebot, Lighthouse, Slack, WhatsApp,
  // X, LinkedIn, Facebook...) past the static copy to a fresh server render, one function call
  // per bot hit, for an identical page. This pattern matches no real user agent, so every
  // visitor, bot or not, gets the same prerendered page from the CDN.
  htmlLimitedBots: /dn-design-blocking-metadata-opt-in/,

  images: {
    // One format and one quality: each extra one multiplies the variants Vercel transforms
    // (Hobby allows 5,000 a month). AVIF alone doubled the count.
    formats: ["image/webp"],
    qualities: [75],
    // Matched to the sizes the site actually uses (phone 2-3x, column 1120px, full-bleed 100vw)
    // and capped at 1920: nearly every source image is 1600px wide or less.
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920],
    imageSizes: [128, 256, 384],
    // Optimised images are keyed by the source file's content, so a re-exported image still
    // gets fresh variants; anything unchanged is reused for 31 days.
    minimumCacheTTL: 2678400,
    // Local files only, and no query strings: "?v=1", "?v=2"... can't mint new variants.
    localPatterns: [{ pathname: "/**", search: "" }],
  },

  async headers() {
    return [
      {
        // Vendored three.js Draco decoder: third-party binaries, never edited in place.
        source: "/draco/:file*",
        headers: [{ key: "Cache-Control", value: FOREVER }],
      },
      {
        // Self-hosted Stack Sans: each file's name carries a -vN suffix that changes with it.
        source: "/fonts/:file*",
        headers: [{ key: "Cache-Control", value: FOREVER }],
      },
      {
        // Images, 3D models, textures and video.
        source: `/:dir(${ASSET_DIRS})/:path*/:file([^/]+\\.(?:${ASSET_EXT}))`,
        headers: [{ key: "Cache-Control", value: WEEK_THEN_REVALIDATE }],
      },
      {
        // The service worker is checked on every visit so a new version takes over at once.
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
    ];
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
    