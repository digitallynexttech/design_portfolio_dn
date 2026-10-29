import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import { JsonLd } from "@/components/ui/json-ld";
import { ServiceWorker } from "@/components/ui/service-worker";
import { SiteFooter, SiteHeader } from "@/features/drafts/depth/site-chrome";
import { WorldRoot } from "@/features/world/ui/world-root";
import { MAIN_SITE, SITE_URL, SOCIALS } from "@/lib/site";
import "./globals.css";

// Stack Sans (headline and text) is self-hosted from /fonts/ and declared in globals.css, next to
// its metric-matched fallbacks. Through next/font, its preload travelled in a `Link` header whose URL
// Next rewrites per deployment (?dpl=, /immutable/), while the stylesheet asked for the file by its
// own URL, so the browser could fetch each face twice. Here the preload and the @font-face rule name
// the same literal path, so each face downloads exactly once. Only the latin files are preloaded:
// they are what the first paint sets. Bump the -vN suffix if a file ever changes.
const PRELOAD_FONTS = ["/fonts/stack-sans-headline-latin-v1.woff2", "/fonts/stack-sans-text-latin-v1.woff2"];

// Mono only sets labels, never the first paint's largest text, so it doesn't compete for preload.
const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://design.digitallynext.com"),
  title: {
    default: "Digitally Next Design - We are water.",
    template: "%s - Digitally Next Design",
  },
  description:
    "The design and development studio at Digitally Next. 12+ years, 50+ brands: websites, platforms, commerce and 3D that take the shape of what each brand needs.",
  openGraph: {
    siteName: "Digitally Next Design",
    type: "website",
    locale: "en_IN",
  },
  appleWebApp: {
    capable: true,
    title: "DN Design",
    statusBarStyle: "black",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
  // Edge to edge on notched phones; the Menu pill and sheets pad for the home indicator.
  viewportFit: "cover",
};

// Runs before first paint: decides whether scroll-driven motion is on, so the hero never flashes
// between its stacked (no-motion) and sequenced layouts.
const motionFlag = `(function(){try{var r=window.matchMedia('(prefers-reduced-motion: reduce)').matches;document.documentElement.dataset.motion=r?'off':'on'}catch(e){}})()`;

// Page transitions live in each page (<PageFlow> around its <main>), not here: layouts persist
// across navigations, so a wrapper here never sees an enter or an exit.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      data-header="shown"
      className={`${mono.variable} antialiased`}
    >
      <head>
        {PRELOAD_FONTS.map((href) => (
          <link key={href} rel="preload" href={href} as="font" type="font/woff2" crossOrigin="anonymous" />
        ))}
        <script dangerouslySetInnerHTML={{ __html: motionFlag }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Digitally Next Design",
            url: SITE_URL,
            logo: `${SITE_URL}/icons/icon-512.png`,
            description:
              "The design and development studio at Digitally Next, New Delhi.",
            parentOrganization: {
              "@type": "Organization",
              name: "Digitally Next",
              url: MAIN_SITE,
            },
            sameAs: SOCIALS.map((s) => s.href),
          }}
        />
        <SiteHeader />
        {children}
        <SiteFooter />
        <WorldRoot />
        <ServiceWorker />
      </body>
    </html>
  );
}
