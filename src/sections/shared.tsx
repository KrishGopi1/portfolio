import { useEffect, type CSSProperties, type ReactNode } from "react";
import { SECTIONS, type SectionId } from "../data/portfolio";

export const sectionLabel = (id: SectionId) => SECTIONS.find((s) => s.id === id)?.label ?? id;
export const sectionNo = (id: SectionId) =>
  String(SECTIONS.findIndex((s) => s.id === id) + 1).padStart(2, "0");

/** CSS custom properties helper (keeps TS happy with --vars). */
export const vars = (v: Record<string, string | number>) => v as CSSProperties;

export function ChapterHead({
  id,
  sub,
  center,
  children,
}: {
  id: SectionId;
  sub: string;
  center?: boolean;
  children?: ReactNode;
}) {
  return (
    <header className={`chapter${center ? " chapter--center" : ""}`} data-reveal={center ? "pop" : "left"}>
      <p className="chapter__kicker">
        <span className="chapter__no">CH.{sectionNo(id)}</span>
        <span>{sub}</span>
      </p>
      <h2 id={`${id}-title`} className="chapter__title misreg glitch">{sectionLabel(id)}</h2>
      {children}
    </header>
  );
}

/** Deterministic jagged starburst polygon. */
function burstPoints(seed: number, spikes = 14) {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const jitter = ((Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453) % 1 + 1) % 1;
    const r = i % 2 === 0 ? 48 + jitter * 6 : 30 + jitter * 6;
    pts.push(`${(60 + Math.cos(a) * r).toFixed(1)},${(60 + Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(" ");
}

export function Starburst({
  text,
  seed = 1,
  size = 150,
  fill = "var(--yellow)",
  className = "",
  style,
}: {
  text: string;
  seed?: number;
  size?: number;
  fill?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const pts = burstPoints(seed);
  return (
    <div className={`burst ${className}`} style={{ ["--burst-size" as string]: `${size}px`, ...style }} aria-hidden="true">
      <svg viewBox="0 0 120 120">
        <polygon points={pts} fill="var(--ink)" transform="translate(5 5)" />
        <polygon points={pts} fill={fill} stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
        <polygon points={pts} fill="none" stroke="var(--paper)" strokeWidth="1.2" transform="translate(60 60) scale(0.78) translate(-60 -60)" opacity="0.7" />
      </svg>
      <span className="burst__text">{text}</span>
    </div>
  );
}

/** Adds .is-in to [data-reveal] elements as they scroll into view. */
export function useReveal() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) return;
    root.classList.add("cv-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0 },
    );
    document.querySelectorAll("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      root.classList.remove("cv-reveal");
    };
  }, []);
}
