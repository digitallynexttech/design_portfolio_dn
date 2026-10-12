// Heavy WebGL waits for the visitor to engage (first mouse move, touch, scroll or key press), then for
// an idle moment. Text and posters - real frames of each scene - paint immediately; the water arrives
// the moment someone is actually there. (SKELMET's live site uses the same rule for its 3D hero.)

const EVENTS = [
  "pointermove",
  "pointerdown",
  "touchstart",
  "scroll",
  "wheel",
  "keydown",
] as const;

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/** Calls `start` once the page may afford WebGL. Returns a cancel function. */
export function whenEngaged(start: () => void, idleTimeout = 1200): () => void {
  const w = window as IdleWindow;
  let cancelled = false;
  let idleId: number | undefined;
  let timer: number | undefined;

  const onIdle = () => {
    if (cancelled) return;
    if (w.requestIdleCallback)
      idleId = w.requestIdleCallback(() => !cancelled && start(), {
        timeout: idleTimeout,
      });
    else timer = window.setTimeout(() => !cancelled && start(), 300);
  };

  const engage = () => {
    for (const name of EVENTS) window.removeEventListener(name, engage);
    onIdle();
  };
  for (const name of EVENTS)
    window.addEventListener(name, engage, { passive: true });

  return () => {
    cancelled = true;
    for (const name of EVENTS) window.removeEventListener(name, engage);
    if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
    if (timer !== undefined) window.clearTimeout(timer);
  };
}
