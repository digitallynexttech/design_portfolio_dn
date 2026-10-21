"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { pad } from "./dot-engine";

export type MonitorChapter = { start: number; end: number; client: string };

const clock = (s: number) => `${pad(Math.floor(s / 60))}:${pad(Math.floor(s % 60))}`;

/**
 * The showreel on a bezel screen. The muted loop starts when the monitor is in view (the file is
 * fetched only then) and can be paused. Under it, a rail of seven chapter keys, one per site in the
 * reel: press one to cut the monitor to that site; the key of the site on screen fills as it plays.
 * "Play reel" (the site's own player, passed in) opens the full reel with its chapter list.
 * With reduced motion nothing plays by itself: the keys still cut to a site, as a still frame,
 * and the play key runs it.
 */
export function ReelMonitor({
  size,
  src,
  poster,
  length,
  duration,
  chapters,
  play,
}: {
  /** The file's real frame size, for the part label under the screen. */
  size: string;
  src: string;
  poster: string;
  length: string;
  duration: number;
  chapters: MonitorChapter[];
  play: ReactNode;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const rail = useRef<HTMLOListElement>(null);
  const timeOut = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const held = useRef(false); // the visitor paused it
  const ctl = useRef({ seen: false, near: false, wantSeek: -1 });

  const motionOk = () =>
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches && document.documentElement.dataset.motion !== "off";

  const load = () => {
    const v = video.current;
    if (v && !v.getAttribute("src")) {
      v.setAttribute("src", src);
      v.preload = "auto";
    }
  };

  useEffect(() => {
    const v = video.current;
    const list = rail.current;
    if (!v || !list) return;
    v.muted = true;
    const fills = Array.from(list.querySelectorAll<HTMLElement>("[data-fill]"));
    let raf = 0;
    let shownChapter = -1;
    let shownSecond = -1;

    const paint = () => {
      const t = v.currentTime;
      let ch = 0;
      for (let i = 0; i < chapters.length; i++) if (t >= chapters[i].start - 0.05) ch = i;
      fills.forEach((f, i) => {
        const c = chapters[i];
        const p = t >= c.end ? 1 : t <= c.start ? 0 : (t - c.start) / (c.end - c.start);
        f.style.transform = `scaleX(${p.toFixed(4)})`;
      });
      if (ch !== shownChapter) {
        shownChapter = ch;
        setCurrent(ch);
      }
      const sec = Math.floor(t);
      if (sec !== shownSecond && timeOut.current) {
        shownSecond = sec;
        timeOut.current.textContent = clock(t);
      }
    };
    const loop = () => {
      paint();
      raf = !v.paused && ctl.current.seen ? requestAnimationFrame(loop) : 0;
    };
    const onPlay = () => {
      setPlaying(true);
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onPause = () => {
      setPlaying(false);
      paint();
    };
    const onSeeked = () => paint();
    const onMeta = () => {
      const c = ctl.current;
      if (c.wantSeek >= 0) {
        v.currentTime = c.wantSeek;
        c.wantSeek = -1;
      }
    };
    const sync = () => {
      const { seen, near } = ctl.current;
      if (near && motionOk()) load();
      if (seen && !held.current && motionOk() && document.visibilityState === "visible") void v.play().catch(() => undefined);
      else if (!v.paused && (!seen || document.visibilityState !== "visible")) v.pause();
    };
    const io = new IntersectionObserver(
      ([e]) => {
        ctl.current.seen = e.isIntersecting;
        sync();
      },
      { threshold: 0.35 },
    );
    const near = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        ctl.current.near = true;
        // The poster is fetched only as the monitor nears the screen.
        if (!v.getAttribute("poster")) v.setAttribute("poster", poster);
        sync();
      },
      { rootMargin: "80% 0px" },
    );
    io.observe(v);
    near.observe(v);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("seeked", onSeeked);
    v.addEventListener("loadedmetadata", onMeta);
    document.addEventListener("visibilitychange", sync);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      near.disconnect();
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("loadedmetadata", onMeta);
      document.removeEventListener("visibilitychange", sync);
      v.pause();
    };
    // load and motionOk read refs and props that never change for this monitor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapters, poster]);

  const cut = (i: number) => {
    const v = video.current;
    if (!v) return;
    load();
    const at = chapters[i].start + 0.05;
    if (v.readyState >= 1) v.currentTime = at;
    else ctl.current.wantSeek = at;
    setCurrent(i);
    if (!held.current && motionOk()) void v.play().catch(() => undefined);
  };

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    load();
    if (v.paused) {
      held.current = false;
      void v.play().catch(() => undefined);
    } else {
      held.current = true;
      v.pause();
    }
  };

  const now = chapters[current];

  return (
    <div className="ds-reel">
      <div className="ds-reel__screenwrap">
        <div className="ds-reel__bezel ds-screen" data-power>
          <video
            ref={video}
            className="ds-reel__video"
            muted
            loop
            playsInline
            preload="none"
            width={1280}
            height={720}
            aria-hidden
            tabIndex={-1}
            disablePictureInPicture
          />
          <p className="ds-osd" aria-hidden>
            <span className="ds-osd__tag ds-num">
              {pad(current + 1)}/{pad(chapters.length)}
            </span>
            <span className="ds-osd__tag" data-rec={playing || undefined}>
              <span className="ds-osd__rec" />
              {playing ? "Playing" : "Paused"}
            </span>
          </p>
        </div>
        <p className="ds-meta" aria-hidden>
          <span>B1 · Monitor</span>
          <span className="ds-num">{size}</span>
          <span className="ds-meta__rule" />
          <span className="ds-num">{pad(chapters.length)} chapters</span>
        </p>
      </div>

      <div className="ds-reel__deck">
        <p className="ds-reel__now">
          <span className="ds-k ds-num" aria-hidden>
            CH {pad(current + 1)}
          </span>
          <span className="ds-reel__client">{now?.client}</span>
          <span className="ds-k ds-num ds-reel__time" aria-hidden>
            <span ref={timeOut}>00:00</span> / {length}
          </span>
        </p>

        <ol ref={rail} className="ds-reel__rail" aria-label="Reel chapters">
          {chapters.map((c, i) => (
            <li key={c.client} style={{ "--w": (c.end - c.start) / duration } as CSSProperties}>
              <button type="button" className="ds-reel__seg" aria-current={i === current ? "true" : undefined} onClick={() => cut(i)}>
                <span className="ds-reel__track" aria-hidden>
                  <span className="ds-reel__fill" data-fill />
                </span>
                <span className="ds-reel__no ds-num" aria-hidden>
                  {pad(i + 1)}
                </span>
                <span className="ds-reel__name">
                  <span className="sr-only">Show </span>
                  {c.client}
                  <span className="sr-only">, from {clock(c.start)}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div className="ds-reel__keys">
          <button
            type="button"
            className="ds-key ds-key--sq"
            onClick={toggle}
            aria-label={playing ? "Pause the monitor" : "Play the monitor"}
          >
            <span className={playing ? "ds-ico ds-ico--pause" : "ds-ico ds-ico--play"} aria-hidden />
          </button>
          <div className="ds-playkey">{play}</div>
        </div>
      </div>
    </div>
  );
}
