import { useEffect, useRef } from "react";
import { subscribeScroll } from "../store/scroll";

const RANKS: [number, string][] = [
  [140, "Ultimate!"],
  [80, "Spectacular!"],
  [40, "Amazing!"],
  [15, "Great!"],
  [0, "Nice!"],
];

/** Fighting-game combo meter that climbs with scroll speed. DOM-only updates, no re-renders. */
export default function Combo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLElement>(null);
  const rankRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let combo = 0;
    let shown = -1;
    let rank = "";
    let timer = 0;

    const reset = () => {
      combo = 0;
      shown = -1;
      rootRef.current?.classList.remove("is-on");
    };

    const unsub = subscribeScroll((s) => {
      const v = Math.abs(s.velocity);
      if (v < 2) return;
      combo += Math.min(v, 60) * 0.012;
      const n = Math.floor(combo);
      if (n < 3) return;
      const root = rootRef.current;
      if (!root) return;
      root.classList.add("is-on");
      if (n !== shown && numRef.current) {
        shown = n;
        numRef.current.textContent = String(n);
      }
      const r = RANKS.find(([min]) => n >= min)![1];
      if (r !== rank && rankRef.current) {
        rank = r;
        rankRef.current.textContent = r;
        root.animate([{ scale: "1.35" }, { scale: "1" }], { duration: 260, easing: "cubic-bezier(.34,1.56,.64,1)" });
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(reset, 1100);
    });

    return () => {
      unsub();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="combo" ref={rootRef} aria-hidden="true">
      <span className="combo__x">&times;</span>
      <b className="combo__n" ref={numRef}>
        0
      </b>
      <span className="combo__label">
        Swing combo
        <em ref={rankRef}>Nice!</em>
      </span>
    </div>
  );
}
