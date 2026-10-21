"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { MODE_EVENT, type Mode } from "./chrome";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const hex2 = (n: number) => n.toString(16).padStart(2, "0");

/**
 * The X-ray lens. A circle that follows the pointer over a study's screen and shows, inside it,
 * the build layer drawn over the same frame (children): the column overlay, the client's colour
 * tokens, its type and its stack. The rulers on the frame's edges track the lens in the screen's own
 * pixels, and the lens reads the colour of the pixel under its centre.
 *
 * - Mouse: hover to X-ray, press and hold to open the whole layer.
 * - Touch: the lens stays out as a handle; drag it, or tap where it should go.
 * - Keyboard: focusing the frame opens the whole layer. Build mode opens every lens.
 *
 * One rAF loop eases position and radius (a clip-path circle and a transformed ring) and stops as
 * soon as both have settled. Reduced motion snaps instead of easing.
 */
export function Lens({
  w,
  h,
  label,
  descId,
  intro = false,
  design,
  children,
}: {
  w: number;
  h: number;
  label: string;
  descId?: string;
  /** Show the lens once, gliding across, the first time this frame is in view (pointer devices). */
  intro?: boolean;
  design: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fr = ref.current;
    const wrap = fr?.parentElement;
    const root = fr?.closest<HTMLElement>(".d-xray");
    const build = fr?.querySelector<HTMLElement>("[data-build]");
    const ring = fr?.querySelector<HTMLElement>("[data-ring]");
    const handle = fr?.querySelector<HTMLElement>("[data-handle]");
    if (!fr || !wrap || !root || !build || !ring || !handle) return;
    const outX = ring.querySelector<HTMLElement>("[data-rx]");
    const outY = ring.querySelector<HTMLElement>("[data-ry]");
    const outHex = ring.querySelector<HTMLElement>("[data-hex]");
    const chip = ring.querySelector<HTMLElement>("[data-chip]");
    const markX = wrap.querySelector<HTMLElement>("[data-mx]");
    const markY = wrap.querySelector<HTMLElement>("[data-my]");
    const valX = wrap.querySelector<HTMLElement>("[data-vx]");
    const valY = wrap.querySelector<HTMLElement>("[data-vy]");
    const still = document.documentElement.dataset.motion === "off";

    let fw = 0;
    let fh = 0;
    let R = 0;
    const cur = { x: 0, y: 0, r: 0 };
    const to = { x: 0, y: 0, r: 0 };
    let hovering = false;
    let pressing = false;
    let focused = false;
    let dragging = false;
    let touch = window.matchMedia("(hover: none)").matches;
    let seen = false;
    let demo = false;
    let demoTimer = 0;
    let built = root.dataset.mode === "build";
    let raf = 0;
    let last = 0;
    const shown = { x: "", y: "", hex: "" };
    let pixels: Uint8ClampedArray | null = null;
    let pw = 0;
    let ph = 0;
    const grab = { dx: 0, dy: 0 };

    const sizeUp = () => {
      const r = fr.getBoundingClientRect();
      if (!r.width) return;
      const kx = fw ? r.width / fw : 1;
      const ky = fh ? r.height / fh : 1;
      fw = r.width;
      fh = r.height;
      R = clamp(fw * 0.15, 58, 150);
      ring.style.width = ring.style.height = `${R * 2}px`;
      ring.style.margin = `${-R}px 0 0 ${-R}px`;
      cur.x *= kx;
      to.x *= kx;
      cur.y *= ky;
      to.y *= ky;
    };

    const radius = () => {
      if (built || pressing || focused) return Math.hypot(fw, fh) + 4;
      if (hovering || demo || (touch && seen)) return R;
      return 0;
    };

    // The screen's pixels, sampled small, for the lens's colour readout. Read from the image that is
    // already on screen (same origin), so nothing downloads twice.
    const sample = () => {
      if (pixels) return;
      const img = fr.querySelector<HTMLImageElement>(".dx-xr__design img");
      if (!img) return;
      const read = () => {
        try {
          pw = 200;
          ph = Math.max(1, Math.round((200 * h) / w));
          const c = document.createElement("canvas");
          c.width = pw;
          c.height = ph;
          const ctx = c.getContext("2d", { willReadFrequently: true });
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, pw, ph);
          pixels = ctx.getImageData(0, 0, pw, ph).data;
          kick();
        } catch {
          pixels = null;
        }
      };
      if (img.complete && img.naturalWidth) read();
      else img.addEventListener("load", read, { once: true });
    };

    const write = () => {
      build.style.clipPath = `circle(${cur.r.toFixed(1)}px at ${cur.x.toFixed(1)}px ${cur.y.toFixed(1)}px)`;
      const s = R ? Math.min(cur.r, R) / R : 0;
      const fade = cur.r <= R * 1.02 ? 1 : clamp(1 - (cur.r - R) / (R * 0.9), 0, 1);
      ring.style.transform = `translate3d(${cur.x.toFixed(1)}px,${cur.y.toFixed(1)}px,0) scale(${s.toFixed(3)})`;
      ring.style.opacity = s > 0.02 ? fade.toFixed(3) : "0";
      handle.style.transform = `translate3d(${cur.x.toFixed(1)}px,${cur.y.toFixed(1)}px,0)`;
      handle.style.opacity = fade.toFixed(3);
      if (markX) markX.style.transform = `translate3d(${cur.x.toFixed(1)}px,0,0)`;
      if (markY) markY.style.transform = `translate3d(0,${cur.y.toFixed(1)}px,0)`;
      wrap.toggleAttribute("data-lens", cur.r > 1 && fade > 0.05);

      const nx = String(Math.round(clamp(cur.x / fw, 0, 1) * w));
      const ny = String(Math.round(clamp(cur.y / fh, 0, 1) * h));
      if (nx !== shown.x) {
        shown.x = nx;
        if (outX) outX.textContent = nx;
        if (valX) valX.textContent = nx;
      }
      if (ny !== shown.y) {
        shown.y = ny;
        if (outY) outY.textContent = ny;
        if (valY) valY.textContent = ny;
      }
      if (pixels) {
        const sx = Math.min(pw - 1, Math.max(0, Math.floor((cur.x / fw) * pw)));
        const sy = Math.min(ph - 1, Math.max(0, Math.floor((cur.y / fh) * ph)));
        const i = (sy * pw + sx) * 4;
        const hex = `#${hex2(pixels[i])}${hex2(pixels[i + 1])}${hex2(pixels[i + 2])}`.toUpperCase();
        if (hex !== shown.hex) {
          shown.hex = hex;
          if (outHex) outHex.textContent = hex;
          if (chip) chip.style.background = hex;
        }
      }
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      to.r = radius();
      const k = still || dragging ? 1 : 1 - Math.exp(-dt * 16);
      const kr = still ? 1 : 1 - Math.exp(-dt * 10);
      const dx = to.x - cur.x;
      const dy = to.y - cur.y;
      const dr = to.r - cur.r;
      cur.x += dx * k;
      cur.y += dy * k;
      cur.r += dr * kr;
      write();
      if (Math.abs(dx) + Math.abs(dy) > 0.15 || Math.abs(dr) > 0.3) raf = requestAnimationFrame(frame);
      else {
        cur.x = to.x;
        cur.y = to.y;
        cur.r = to.r;
        write();
        last = 0;
      }
    };
    function kick() {
      if (!raf) raf = requestAnimationFrame(frame);
    }

    const local = (e: PointerEvent) => {
      const r = fr.getBoundingClientRect();
      return { x: clamp(e.clientX - r.left, 0, r.width), y: clamp(e.clientY - r.top, 0, r.height) };
    };

    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      touch = false;
      hovering = true;
      demo = false;
      sample();
      const p = local(e);
      to.x = p.x;
      to.y = p.y;
      // From closed, the lens opens where the pointer is rather than gliding in from elsewhere.
      if (cur.r < 2) {
        cur.x = p.x;
        cur.y = p.y;
      }
      kick();
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        if (!hovering) onEnter(e);
        const p = local(e);
        to.x = p.x;
        to.y = p.y;
        kick();
      } else if (dragging) {
        const p = local(e);
        to.x = clamp(p.x - grab.dx, 0, fw);
        to.y = clamp(p.y - grab.dy, 0, fh);
        kick();
      }
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      hovering = false;
      pressing = false;
      kick();
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        if (e.button !== 0) return;
        pressing = true;
        kick();
        return;
      }
      // Touch and pen: the lens is a handle. Grab it to drag; tap anywhere else to send it there.
      touch = true;
      seen = true;
      sample();
      const p = local(e);
      if (e.target instanceof Element && e.target.closest("[data-handle]")) {
        dragging = true;
        grab.dx = p.x - cur.x;
        grab.dy = p.y - cur.y;
        handle.setPointerCapture(e.pointerId);
        e.preventDefault();
      } else {
        to.x = p.x;
        to.y = p.y;
      }
      kick();
    };
    const onUp = () => {
      dragging = false;
      if (pressing) {
        pressing = false;
        kick();
      }
    };
    const onFocus = () => {
      if (!fr.matches(":focus-visible")) return;
      focused = true;
      if (cur.r < 2) {
        cur.x = to.x = fw / 2;
        cur.y = to.y = fh / 2;
      }
      kick();
    };
    const onBlur = () => {
      focused = false;
      kick();
    };
    const onMode = (e: Event) => {
      built = (e as CustomEvent<Mode>).detail === "build";
      kick();
    };

    sizeUp();
    cur.x = to.x = fw * 0.62;
    cur.y = to.y = fh * 0.48;
    write();

    // Near the screen: the specimen's fonts may load (data-live). On a touch screen, the first time
    // the frame is properly in view, the lens comes out and glides across once, so it's found.
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        wrap.dataset.live = "";
        near.disconnect();
      },
      { rootMargin: "600px 0px" },
    );
    const inView = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        inView.disconnect();
        if (still) {
          if (touch) seen = true;
          kick();
          return;
        }
        sample();
        cur.x = fw * 0.3;
        to.x = fw * 0.62;
        if (touch) seen = true;
        else if (intro && !hovering) {
          // Once, on a pointer device: the lens opens, glides across the screen, and closes.
          demo = true;
          cur.y = to.y = fh * 0.5;
          to.x = fw * 0.7;
          demoTimer = window.setTimeout(() => {
            demo = false;
            kick();
          }, 1700);
        }
        kick();
      },
      { threshold: 0.6 },
    );
    near.observe(fr);
    inView.observe(fr);
    const ro = new ResizeObserver(() => {
      sizeUp();
      kick();
    });
    ro.observe(fr);

    fr.addEventListener("pointerenter", onEnter);
    fr.addEventListener("pointermove", onMove);
    fr.addEventListener("pointerleave", onLeave);
    fr.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    fr.addEventListener("focus", onFocus);
    fr.addEventListener("blur", onBlur);
    window.addEventListener(MODE_EVENT, onMode);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(demoTimer);
      near.disconnect();
      inView.disconnect();
      ro.disconnect();
      fr.removeEventListener("pointerenter", onEnter);
      fr.removeEventListener("pointermove", onMove);
      fr.removeEventListener("pointerleave", onLeave);
      fr.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      fr.removeEventListener("focus", onFocus);
      fr.removeEventListener("blur", onBlur);
      window.removeEventListener(MODE_EVENT, onMode);
    };
  }, [w, h, intro]);

  // Ruler labels in the screen's own pixels.
  const stepX = w > 1000 ? 400 : 200;
  const stepY = h > 600 ? 200 : 100;
  const xs = Array.from({ length: Math.floor(w / stepX) + 1 }, (_, i) => i * stepX);
  const ys = Array.from({ length: Math.floor(h / stepY) + 1 }, (_, i) => i * stepY);

  return (
    <div
      className="dx-fr"
      style={{ "--ar": `${w} / ${h}`, "--tx": `${(100 * 100) / w}%`, "--ty": `${(100 * 100) / h}%` } as CSSProperties}
    >
      <span className="dx-fr__corner" aria-hidden>
        px
      </span>
      <div className="dx-fr__rx" aria-hidden>
        {xs.map((v, i) => (
          <span key={v} className={`dx-fr__lx${i === xs.length - 1 && v / w > 0.9 ? " dx-fr__lx--end" : ""}`} style={{ left: `${(v / w) * 100}%` }}>
            {v}
          </span>
        ))}
        <span className="dx-fr__mx" data-mx>
          <b data-vx>0</b>
        </span>
      </div>
      <div className="dx-fr__ry" aria-hidden>
        {ys.map((v) => (
          <span key={v} className="dx-fr__ly" style={{ top: `${(v / h) * 100}%` }}>
            {v}
          </span>
        ))}
        <span className="dx-fr__my" data-my>
          <b data-vy>0</b>
        </span>
      </div>
      <div ref={ref} className="dx-xr" tabIndex={0} role="group" aria-label={label} aria-describedby={descId}>
        <div className="dx-xr__design">{design}</div>
        <div className="dx-xr__build" data-build aria-hidden>
          {children}
        </div>
        <div className="dx-xr__ring" data-ring aria-hidden>
          <span className="dx-xr__cross" />
          <span className="dx-xr__read">
            <span>
              x <b data-rx>0</b> y <b data-ry>0</b>
            </span>
            <span className="dx-xr__hex">
              <i data-chip />
              <b data-hex>#——————</b>
            </span>
          </span>
        </div>
        <span className="dx-xr__handle" data-handle aria-hidden>
          <span />
        </span>
      </div>
    </div>
  );
}
