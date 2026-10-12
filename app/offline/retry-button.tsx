"use client";

/** Reloads the page the visitor was trying to open; the service worker serves this page while offline. */
export function RetryButton({ className = "" }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.location.reload()} className={className}>
      Try again
    </button>
  );
}
