"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "off";

/**
 * The feel shared by the dial and the thumbwheel. A position in detent units (0 … count-1) that the
 * hand drags freely; what is drawn is pulled toward the nearest detent (it sticks, then jumps), and
 * past either end it stretches like rubber. Crossing halfway selects the next detent at once, with a
 * click (`tick`). Let go, or change the value any other way, and a slightly springy return settles
 * it on the detent. Frames run only while it is moving.
 */
function useDetentMotor({
  count,
  index,
  onChange,
  apply,
  tick,
}: {
  count: number;
  index: number;
  onChange: (i: number) => void;
  apply: (shown: number) => void;
  tick: () => void;
}) {
  const state = useRef({
    raw: index,
    shown: index,
    vel: 0,
    target: index,
    dragging: false,
    raf: 0,
    idx: index,
    last: 0,
  });
  const handlers = useRef({ onChange, apply, tick });
  useEffect(() => {
    handlers.current = { onChange, apply, tick };
  });

  const spring = useRef<(now: number) => void>(() => undefined);
  useEffect(() => {
    spring.current = (now: number) => {
      const s = state.current;
      s.raf = 0;
      const dt = Math.min(0.05, s.last ? (now - s.last) / 1000 : 1 / 60);
      s.last = now;
      // Slightly under-damped: the detent lands with the smallest overshoot, like a sprung ball.
      const K = 240;
      const C = 23;
      s.vel += (-K * (s.shown - s.target) - C * s.vel) * dt;
      s.shown += s.vel * dt;
      if (Math.abs(s.shown - s.target) < 0.002 && Math.abs(s.vel) < 0.01) {
        s.shown = s.target;
        s.vel = 0;
        s.last = 0;
        handlers.current.apply(s.shown);
        return;
      }
      handlers.current.apply(s.shown);
      s.raf = requestAnimationFrame(spring.current);
    };
  });

  const settle = () => {
    const s = state.current;
    s.raw = s.target;
    if (still()) {
      s.shown = s.target;
      s.vel = 0;
      handlers.current.apply(s.shown);
      return;
    }
    if (!s.raf) {
      s.last = 0;
      s.raf = requestAnimationFrame((t) => spring.current(t));
    }
  };

  // A value set from outside (keys, the other control, a swipe): travel to it.
  useEffect(() => {
    const s = state.current;
    s.idx = index;
    if (s.dragging) return;
    s.target = index;
    settle();
  }, [index]);

  useEffect(() => {
    const s = state.current;
    handlers.current.apply(s.shown);
    return () => cancelAnimationFrame(s.raf);
  }, []);

  return {
    get raw() {
      return state.current.raw;
    },
    begin() {
      const s = state.current;
      cancelAnimationFrame(s.raf);
      s.raf = 0;
      s.dragging = true;
      s.raw = s.shown;
      s.vel = 0;
    },
    move(raw: number) {
      const s = state.current;
      s.raw = raw;
      const max = count - 1;
      const c = clamp(raw, 0, max);
      const n = Math.round(c);
      const f = c - n;
      // Sticky near a detent, quick between them.
      const magnet = n + (Math.sign(f) * Math.pow(Math.abs(f) * 2, 1.9)) / 2;
      const over = raw - c;
      const stretch = over ? Math.sign(over) * 0.32 * (1 - 1 / (1 + Math.abs(over) * 1.6)) : 0;
      s.shown = magnet + stretch;
      handlers.current.apply(s.shown);
      if (n !== s.idx) {
        s.idx = n;
        handlers.current.tick();
        handlers.current.onChange(n);
      }
    },
    end() {
      const s = state.current;
      s.dragging = false;
      s.target = s.idx;
      settle();
    },
  };
}

function stepKeys(e: ReactKeyboardEvent, index: number, count: number, onChange: (i: number) => void) {
  const next =
    e.key === "ArrowRight" || e.key === "ArrowUp"
      ? index + 1
      : e.key === "ArrowLeft" || e.key === "ArrowDown"
        ? index - 1
        : e.key === "PageUp"
          ? index + 1
          : e.key === "PageDown"
            ? index - 1
            : e.key === "Home"
              ? 0
              : e.key === "End"
                ? count - 1
                : null;
  if (next === null) return;
  e.preventDefault();
  onChange(clamp(next, 0, count - 1));
}

/** The mouse wheel turns the control while it has focus (and only then: the page still scrolls). */
function useFocusedWheel(ref: RefObject<HTMLElement | null>, step: (dir: 1 | -1) => void) {
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let acc = 0;
    let lastT = 0;
    const onWheel = (e: WheelEvent) => {
      if (document.activeElement !== el) return;
      e.preventDefault();
      const now = performance.now();
      if (now - lastT > 260) acc = 0;
      lastT = now;
      acc += Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(acc) >= 60) {
        stepRef.current(acc > 0 ? 1 : -1);
        acc = 0;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [ref]);
}

type ControlProps = {
  index: number;
  count: number;
  marks: { no: string; name: string }[];
  onChange: (i: number) => void;
  /** The control's accessible name. */
  label: string;
  /** What a screen reader hears for a value, e.g. "02 of 04: Know Your Genes". */
  valueText: (i: number) => string;
};

// ---------------------------------------------------------------------------------------------

const SWEEP = 210; // degrees from the first detent to the last
const deg = (rad: number) => (rad * 180) / Math.PI;

/**
 * A rotary selector with detents. Drag the knob round (it follows the hand's angle), press a mark
 * on the scale to jump there, or focus it and use the arrow keys, Home/End or the wheel. An ARIA
 * slider: the value is the channel, announced by name.
 */
export function Dial({ index, count, marks, onChange, label, valueText }: ControlProps) {
  const root = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const turn = useRef<HTMLSpanElement[]>([]);
  const drag = useRef({ on: false, last: 0, id: -1 });
  const step = count > 1 ? SWEEP / (count - 1) : 0;
  const a0 = -SWEEP / 2;

  const motor = useDetentMotor({
    count,
    index,
    onChange,
    apply: (shown) => {
      const t = `rotate(${(a0 + shown * step).toFixed(2)}deg)`;
      for (const el of turn.current) if (el) el.style.transform = t;
    },
    tick: () => {
      if (still()) return;
      knob.current?.animate([{ transform: "scale(0.975)" }, { transform: "scale(1)" }], {
        duration: 160,
        easing: "cubic-bezier(0.2, 0.9, 0.3, 1)",
      });
    },
  });

  useFocusedWheel(knob, (dir) => onChange(clamp(index + dir, 0, count - 1)));

  const angleOf = (e: ReactPointerEvent) => {
    const r = root.current!.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    return {
      a: deg(Math.atan2(dx, -dy)),
      d: Math.hypot(dx, dy),
      size: r.width,
    };
  };

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const { a, d, size } = angleOf(e);
    const k = knob.current;
    const kr = (k?.getBoundingClientRect().width ?? size * 0.5) / 2;
    k?.focus({ preventScroll: true });
    if (d <= kr * 1.12) {
      e.preventDefault();
      drag.current = { on: true, last: a, id: e.pointerId };
      e.currentTarget.setPointerCapture(e.pointerId);
      motor.begin();
      root.current?.setAttribute("data-dragging", "");
      return;
    }
    // A press on the scale: jump to the mark nearest that angle.
    const p = (a - a0) / step;
    if (p > -0.8 && p < count - 0.2) onChange(clamp(Math.round(p), 0, count - 1));
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = drag.current;
    if (!g.on || e.pointerId !== g.id) return;
    const { a } = angleOf(e);
    let delta = a - g.last;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    g.last = a;
    motor.move(motor.raw + delta / step);
  };
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = drag.current;
    if (!g.on || e.pointerId !== g.id) return;
    g.on = false;
    root.current?.removeAttribute("data-dragging");
    motor.end();
  };

  // The scale: a tick every 5°, a long tick and a lamp at each detent.
  const ticks: { a: number; major: boolean }[] = [];
  for (let a = Math.ceil((a0 - 15) / 5) * 5; a <= -a0 + 15; a += 5) {
    const major = marks.some((_, i) => Math.abs(a0 + i * step - a) < 0.01);
    ticks.push({ a, major });
  }

  return (
    <div ref={root} className="ds-dial" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      <svg className="ds-dial__scale" viewBox="-100 -100 200 200" aria-hidden>
        {ticks.map((t) => (
          <line
            key={t.a}
            x1="0"
            x2="0"
            y1={t.major ? -66 : -66}
            y2={t.major ? -75 : -70}
            transform={`rotate(${t.a})`}
            className={t.major ? "ds-dial__tick ds-dial__tick--major" : "ds-dial__tick"}
          />
        ))}
      </svg>
      {marks.map((m, i) => (
        <span
          key={m.no}
          className="ds-dial__mark"
          data-on={i === index || undefined}
          data-side={a0 + i * step < 0 ? "l" : "r"}
          style={{ "--a": `${a0 + i * step}deg` } as CSSProperties}
          aria-hidden
        >
          <span className="ds-dial__lamp" />
          <span className="ds-dial__no ds-num">{m.no}</span>
          <span className="ds-dial__name">{m.name}</span>
        </span>
      ))}
      <div
        ref={knob}
        className="ds-dial__knob"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={1}
        aria-valuemax={count}
        aria-valuenow={index + 1}
        aria-valuetext={valueText(index)}
        aria-orientation="horizontal"
        onKeyDown={(e) => stepKeys(e, index, count, onChange)}
      >
        <span
          className="ds-dial__knurl"
          ref={(el) => {
            if (el) turn.current[0] = el;
          }}
        />
        <span className="ds-dial__cap" />
        <span
          className="ds-dial__turn"
          ref={(el) => {
            if (el) turn.current[1] = el;
          }}
        >
          <span className="ds-dial__pointer" />
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

const RIDGES = 26; // ridges across the visible half of the drum

/**
 * The same selector for a thumb: a ridged drum seen edge on, rolled sideways. The ridges are placed
 * on a real half-cylinder (bunched at the edges, wide in the middle), so it reads as a wheel; one
 * detent is a short roll under the finger. A tap on the left or right of the drum steps once; the
 * marks above it jump. Also an ARIA slider, with the same keys.
 */
export function Thumbwheel({ index, count, marks, onChange, label, valueText }: ControlProps) {
  const drum = useRef<HTMLDivElement>(null);
  const ridges = useRef<HTMLSpanElement[]>([]);
  const caret = useRef<HTMLSpanElement>(null);
  const g = useRef({ on: false, id: -1, x0: 0, raw0: 0, moved: false, w: 0 });
  const DETENT_PX = 58;

  const place = (shown: number) => {
    const el = drum.current;
    if (!el) return;
    const w = g.current.w || el.clientWidth;
    g.current.w = w;
    const R = w / 2;
    const span = Math.PI / RIDGES;
    const rot = (shown * DETENT_PX) / R; // radians rolled
    const off = ((rot % span) + span) % span;
    for (let k = 0; k < ridges.current.length; k++) {
      const r = ridges.current[k];
      if (!r) continue;
      const th = -Math.PI / 2 + k * span - off + span;
      if (th <= -Math.PI / 2 || th >= Math.PI / 2) {
        r.style.opacity = "0";
        continue;
      }
      const cos = Math.cos(th);
      r.style.transform = `translate3d(${(R + R * Math.sin(th)).toFixed(2)}px,0,0) scaleX(${Math.max(0.15, cos).toFixed(3)})`;
      r.style.opacity = (0.18 + 0.82 * cos).toFixed(3);
    }
    if (caret.current) caret.current.style.transform = `translateX(${(shown * 100).toFixed(2)}%)`;
  };

  const motor = useDetentMotor({
    count,
    index,
    onChange,
    apply: place,
    tick: () => {
      if (still()) return;
      caret.current?.animate([{ opacity: 0.4 }, { opacity: 1 }], {
        duration: 180,
      });
    },
  });

  useFocusedWheel(drum, (dir) => onChange(clamp(index + dir, 0, count - 1)));

  // Re-place the ridges when the drum changes width.
  useEffect(() => {
    const el = drum.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      g.current.w = el.clientWidth;
      place(motor.raw);
    });
    ro.observe(el);
    return () => ro.disconnect();
    // place and motor read refs only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="ds-wheel">
      <div
        className="ds-wheel__scale"
        style={{ "--n": count } as CSSProperties}
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          onChange(clamp(Math.floor(((e.clientX - r.left) / r.width) * count), 0, count - 1));
        }}
        aria-hidden
      >
        {marks.map((m, i) => (
          <span key={m.no} className="ds-wheel__mark ds-num" data-on={i === index || undefined}>
            {m.no}
          </span>
        ))}
        <span className="ds-wheel__caretbox">
          <span ref={caret} className="ds-wheel__caret" />
        </span>
      </div>
      <div
        ref={drum}
        className="ds-wheel__drum"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={1}
        aria-valuemax={count}
        aria-valuenow={index + 1}
        aria-valuetext={valueText(index)}
        onKeyDown={(e) => stepKeys(e, index, count, onChange)}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          g.current = {
            ...g.current,
            on: true,
            id: e.pointerId,
            x0: e.clientX,
            raw0: motor.raw,
            moved: false,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
          motor.begin();
        }}
        onPointerMove={(e) => {
          const s = g.current;
          if (!s.on || e.pointerId !== s.id) return;
          const dx = e.clientX - s.x0;
          if (Math.abs(dx) > 5) s.moved = true;
          if (s.moved) motor.move(s.raw0 - dx / DETENT_PX);
        }}
        onPointerUp={(e) => {
          const s = g.current;
          if (!s.on || e.pointerId !== s.id) return;
          s.on = false;
          motor.end();
          if (!s.moved) {
            // A tap: step toward the side that was touched.
            const r = e.currentTarget.getBoundingClientRect();
            onChange(clamp(index + (e.clientX - r.left < r.width / 2 ? -1 : 1), 0, count - 1));
          }
        }}
        onPointerCancel={() => {
          g.current.on = false;
          motor.end();
        }}
      >
        {Array.from({ length: RIDGES + 1 }, (_, k) => (
          <span
            key={k}
            className="ds-wheel__ridge"
            ref={(el) => {
              if (el) ridges.current[k] = el;
            }}
          />
        ))}
        <span className="ds-wheel__shade" aria-hidden />
        <span className="ds-wheel__index" aria-hidden />
      </div>
    </div>
  );
}
