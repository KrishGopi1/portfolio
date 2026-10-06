import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type Phase = "on" | "out" | "gone";
const HOLD_MS = 900; // panel shown
const OUT_MS = 480; // wipe-out duration (total <= 1.4s)

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Comic panel-wipe intro. Sets html[data-intro] = pending|done so the hero can choreograph. */
export default function Loader() {
  const [phase, setPhase] = useState<Phase>(() => (reduced() ? "gone" : "on"));
  const timers = useRef<number[]>([]);

  useLayoutEffect(() => {
    document.documentElement.dataset.intro = phase === "gone" ? "done" : "pending";
  }, []);

  const finish = useCallback(() => {
    setPhase((p) => (p === "on" ? "out" : p));
  }, []);

  useEffect(() => {
    if (phase === "on") {
      timers.current.push(window.setTimeout(finish, HOLD_MS));
    } else if (phase === "out") {
      document.documentElement.dataset.intro = "done";
      timers.current.push(window.setTimeout(() => setPhase("gone"), OUT_MS));
    }
  }, [phase, finish]);

  useEffect(() => {
    if (phase === "gone") return;
    const onKey = () => finish();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, finish]);

  useEffect(() => {
    const t = timers.current;
    return () => {
      t.forEach(clearTimeout);
      document.documentElement.dataset.intro = "done";
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div className={`loader loader--${phase}`} onClick={finish} aria-hidden="true">
      <div className="loader__half loader__half--a" />
      <div className="loader__half loader__half--b" />
      <div className="loader__slashes">
        <span />
        <span />
        <span />
      </div>
      <div className="loader__content">
        <p className="loader__small">Entering the</p>
        <p className="loader__big" data-text="SPIDER-VERSE">
          SPIDER-VERSE
        </p>
        <div className="loader__bar">
          <span />
        </div>
        <p className="loader__meta">Loading universe: Earth-KG &middot; click to skip</p>
      </div>
    </div>
  );
}
