import { CASE_STUDIES, chapterHref, chaptersFor } from "@/content/work";
import { SERVICES } from "@/content/studio";
import { CONTACT_URL, FACTS, SITE_URL } from "@/lib/site";

/** A plain-text map of the site for AI assistants (llmstxt.org). Built at compile time. */
export function GET() {
  const lines = [
    "# Digitally Next Design",
    "",
    `> The design and development studio at Digitally Next, New Delhi. ${FACTS.years} years, ${FACTS.brands} brands. We build websites, commerce, platforms and 3D — and each case study documents the hurdles we hit and how we fixed them.`,
    "",
    "## Case studies",
    ...CASE_STUDIES.map((s) => `- [${s.client}](${SITE_URL}/work/${s.slug}): ${s.headline} (${s.industry}; ${s.platform})`),
    "",
    "## Hurdles and fixes",
    ...CASE_STUDIES.flatMap((s) =>
      chaptersFor(s)
        .filter((c) => c.key === "hurdles" || c.key === "systems")
        .map((c) => `- [${s.client}: ${c.label}](${SITE_URL}${chapterHref(s, c)})`),
    ),
    "",
    "## Services",
    ...SERVICES.map((service) => `- [${service.title}](${SITE_URL}/services#${service.id}): ${service.line}`),
    "",
    "## Contact",
    `- [Start a project](${CONTACT_URL})`,
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
