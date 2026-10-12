// three r186 deprecates THREE.Clock, which React Three Fiber still constructs internally. The notice
// is not actionable from app code, so drop that single message and let every other warning through.
const NOTICE = "THREE.Clock: This module has been deprecated";

declare global {
  var __dnQuietThree: boolean | undefined;
}

if (typeof window !== "undefined" && !globalThis.__dnQuietThree) {
  globalThis.__dnQuietThree = true;
  const warn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].startsWith(NOTICE)) return;
    warn(...args);
  };
}

export {};
