// Development harness for the world engine: renders it bare, with ?tier, ?time, ?season, ?weather,
// ?at=<island> and ?zoom, for screenshots (scripts/world-shot.mjs). Not part of the production site.
import { notFound } from "next/navigation";
import { worldData } from "@/content/world";
import { Harness } from "./harness";

export const metadata = { robots: { index: false, follow: false } };

export default function WorldTest() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Harness data={worldData()} />;
}
