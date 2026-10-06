// Global, render-free scroll state shared by the WebGL scene, the swinging hero
// and the UI. One Lenis RAF loop writes it; consumers read it inside their own
// animation frames (useFrame / requestAnimationFrame) without React re-renders.
import Lenis from "lenis";

export type ScrollState = {
  /** Current scroll offset in px. */
  y: number;
  /** 0..1 progress over the whole document. */
  progress: number;
  /** Smoothed velocity in px/frame from Lenis (signed). */
  velocity: number;
  /** 1 scrolling down, -1 scrolling up. */
  direction: 1 | -1;
  /** Max scrollable distance in px. */
  limit: number;
  /** Viewport size in CSS px. */
  vw: number;
  vh: number;
  /** Index into SECTIONS of the section nearest the viewport centre. */
  sectionIndex: number;
  /** User prefers reduced motion. */
  reducedMotion: boolean;
};

export const scrollState: ScrollState = {
  y: 0,
  progress: 0,
  velocity: 0,
  direction: 1,
  limit: 1,
  vw: typeof window !== "undefined" ? window.innerWidth : 1280,
  vh: typeof window !== "undefined" ? window.innerHeight : 800,
  sectionIndex: 0,
  reducedMotion:
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
};

type Listener = (s: ScrollState) => void;
const listeners = new Set<Listener>();

/** Subscribe to every scroll update. Returns an unsubscribe fn. */
export function subscribeScroll(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

let lenis: Lenis | null = null;
export const getLenis = () => lenis;

/** Smooth-scroll to a section id or y offset. */
export function scrollTo(target: string | number) {
  const dest = typeof target === "string" ? `#${target}` : target;
  if (lenis) lenis.scrollTo(dest, { duration: 1.6 });
  else if (typeof target === "string") document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
  else window.scrollTo({ top: target, behavior: "smooth" });
}

function updateSectionIndex() {
  const els = document.querySelectorAll<HTMLElement>("[data-section]");
  const mid = scrollState.vh * 0.5;
  let best = 0;
  let bestDist = Infinity;
  els.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const d = r.top <= mid && r.bottom >= mid ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  scrollState.sectionIndex = best;
}

function emit() {
  listeners.forEach((fn) => fn(scrollState));
}

/** Starts Lenis + the shared RAF loop. Call once from App. Returns cleanup. */
export function initSmoothScroll(): () => void {
  lenis = new Lenis({
    duration: 1.25,
    smoothWheel: !scrollState.reducedMotion,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.4,
  });

  const onResize = () => {
    scrollState.vw = window.innerWidth;
    scrollState.vh = window.innerHeight;
    if (lenis) scrollState.limit = Math.max(1, lenis.limit);
    emit();
  };
  window.addEventListener("resize", onResize);

  lenis.on("scroll", (l: Lenis) => {
    scrollState.y = l.scroll;
    scrollState.limit = Math.max(1, l.limit);
    scrollState.progress = l.progress || 0;
    scrollState.velocity = l.velocity;
    scrollState.direction = l.direction === -1 ? -1 : 1;
    updateSectionIndex();
    emit();
  });

  let raf = 0;
  const loop = (t: number) => {
    lenis?.raf(t);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  // Prime state once layout settles.
  requestAnimationFrame(() => {
    if (!lenis) return;
    scrollState.limit = Math.max(1, lenis.limit);
    updateSectionIndex();
    emit();
  });

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    lenis?.destroy();
    lenis = null;
  };
}
