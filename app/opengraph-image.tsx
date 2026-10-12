import { ImageResponse } from "next/og";

export const alt = "Digitally Next Design - We are water.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        color: "#fafaf8",
        background:
          "radial-gradient(120% 90% at 50% 120%, rgba(14,200,197,0.45), #0a0a0a 60%)",
      }}
    >
      <div
        style={{
          fontSize: 28,
          letterSpacing: 6,
          textTransform: "uppercase",
          opacity: 0.7,
        }}
      >
        Digitally Next · Design studio
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 150,
          fontWeight: 700,
          letterSpacing: -6,
          lineHeight: 0.9,
        }}
      >
        We are water<span style={{ color: "#0ec8c5" }}>.</span>
      </div>
      <div style={{ fontSize: 32, opacity: 0.75 }}>Pour us into anything.</div>
    </div>,
    size,
  );
}
