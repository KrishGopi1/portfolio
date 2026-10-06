import { useEffect, useRef, useState } from "react";
import { SECTIONS } from "../data/portfolio";
import { scrollTo, scrollState, subscribeScroll } from "../store/scroll";
import { useActiveSection } from "./useActiveSection";

/** Vertical web-thread progress on the right edge, with a tick per section. */
export default function WebProgress() {
  const active = useActiveSection();
  const trackRef = useRef<HTMLDivElement>(null);
  const [ticks, setTicks] = useState<number[]>(() => SECTIONS.map((_, i) => i / (SECTIONS.length - 1)));

  // Per-frame: write --p on the track (fill + spider read it in CSS).
  useEffect(
    () =>
      subscribeScroll((s) => {
        trackRef.current?.style.setProperty("--p", s.progress.toFixed(4));
      }),
    [],
  );

  // Tick positions follow the real section offsets (recomputed on layout changes only).
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const limit = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const next = SECTIONS.map((s) => {
          const el = document.getElementById(s.id);
          if (!el) return 0;
          const top = el.getBoundingClientRect().top + window.scrollY;
          return Math.min(1, Math.max(0, top / limit));
        });
        setTicks((prev) => (prev.every((v, i) => Math.abs(v - next[i]) < 0.002) ? prev : next));
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div className="webprog" aria-hidden="true">
      <div className="webprog__track" ref={trackRef} style={{ ["--p" as string]: scrollState.progress }}>
        <span className="webprog__thread" />
        <span className="webprog__fill" />
        {SECTIONS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            tabIndex={-1}
            className={`webprog__tick${i === active ? " is-active" : ""}${i < active ? " is-done" : ""}`}
            style={{ top: `${ticks[i] * 100}%` }}
            onClick={() => scrollTo(s.id)}
          >
            <span className="webprog__label">
              <b>{String(i + 1).padStart(2, "0")}</b> {s.label}
            </span>
          </button>
        ))}
        <span className="webprog__spider">
          <svg viewBox="0 0 40 40">
            <g stroke="var(--ink)" strokeWidth="2.6" strokeLinecap="round" fill="none">
              <path d="M17 17 L9 9 L5 13 M16 20 L7 18 L3 22 M16 23 L8 27 L5 33 M18 25 L12 32 L12 38" />
              <path d="M23 17 L31 9 L35 13 M24 20 L33 18 L37 22 M24 23 L32 27 L35 33 M22 25 L28 32 L28 38" />
            </g>
            <ellipse cx="20" cy="18" rx="4.5" ry="5" fill="var(--red)" stroke="var(--ink)" strokeWidth="2" />
            <ellipse cx="20" cy="26" rx="5.5" ry="6.5" fill="var(--red)" stroke="var(--ink)" strokeWidth="2" />
          </svg>
        </span>
      </div>
    </div>
  );
}
