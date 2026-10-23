import type { Metadata, Viewport } from "next";
import { DepthHome } from "@/features/drafts/depth/depth-home";

// The home page: Depth (Karan, 23 Oct 2026), the fall through space with the astronaut and the X. The
// previous home is at /drafts/depth.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// The void: the browser chrome follows the page.
export const viewport: Viewport = {
  themeColor: "#070708",
  colorScheme: "dark",
};

export default function Home() {
  return <DepthHome />;
}
