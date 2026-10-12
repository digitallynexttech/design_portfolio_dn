"use client";

import { useEffect } from "react";

// The root layout itself failed, so none of the site's CSS or fonts are here: the page carries its
// own few styles, in the same voice as the 404.
const page = {
  margin: 0,
  minHeight: "100svh",
  display: "grid",
  alignContent: "center",
  padding: "6rem clamp(1rem, 4vw, 3rem)",
  background: "#0a0a0a",
  color: "#fafaf8",
  fontFamily: "system-ui, sans-serif",
} as const;
const pill = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "2.875rem",
  padding: "0 1.25rem",
  borderRadius: 999,
  fontSize: "0.875rem",
  fontWeight: 500,
  textDecoration: "none",
  cursor: "pointer",
} as const;

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={page}>
        <title>Something spilled - Digitally Next Design</title>
        <main id="main">
          <p
            style={{
              margin: 0,
              fontFamily: "ui-monospace, monospace",
              fontSize: "0.75rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              opacity: 0.84,
            }}
          >
            Error
          </p>
          <h1
            style={{
              margin: "1rem 0 0",
              fontSize: "clamp(3rem, 10vw, 9rem)",
              lineHeight: 0.9,
              letterSpacing: "-0.035em",
              fontWeight: 600,
            }}
          >
            Something spilled<span style={{ color: "#0ec8c5" }}>.</span>
          </h1>
          <p
            style={{
              margin: "1.5rem 0 0",
              maxWidth: "40ch",
              fontSize: "1.125rem",
              lineHeight: 1.5,
              opacity: 0.84,
            }}
          >
            The site didn&apos;t pour out right. Try it again, or head back to
            calmer water.
          </p>
          <div
            style={{
              marginTop: "2.5rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <button
              type="button"
              onClick={() => retry()}
              style={{
                ...pill,
                border: 0,
                background: "#fafaf8",
                color: "#0a0a0a",
              }}
            >
              Try again
            </button>
            {/* A full page load: the app's router may be what broke. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                ...pill,
                border: "1px solid rgb(250 250 248 / 0.28)",
                color: "inherit",
              }}
            >
              Home <span aria-hidden>←</span>
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
