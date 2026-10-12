import { ImageResponse } from "next/og";
import { CASE_STUDIES, getCaseStudy } from "@/content/work";

export const alt = "Digitally Next case study";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return CASE_STUDIES.map((study) => ({ slug: study.slug }));
}

/** Each case study shares in its own colours. */
export default async function StudyImage({ params }: { params: Promise<{ slug: string }> }) {
  const study = getCaseStudy((await params).slug);
  const t = study?.theme;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: t?.bg ?? "#0a0a0a",
          color: t?.text ?? "#fafaf8",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, letterSpacing: 4, textTransform: "uppercase", opacity: 0.75 }}>
          <span>Case study</span>
          <span>{study?.industry ?? ""}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 128, fontWeight: 700, letterSpacing: -4, lineHeight: 0.9 }}>
            {study?.client ?? "Digitally Next"}
            <span style={{ color: t?.accent ?? "#0ec8c5" }}>.</span>
          </div>
          <div style={{ fontSize: 36, lineHeight: 1.2, maxWidth: 980, opacity: 0.85 }}>{study?.headline ?? ""}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26 }}>
          <div style={{ width: 48, height: 6, background: t?.accent ?? "#0ec8c5" }} />
          Digitally Next Design · design.digitallynext.com
        </div>
      </div>
    ),
    size,
  );
}
