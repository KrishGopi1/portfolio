import { lazy, Suspense, useEffect } from "react";
import { initSmoothScroll } from "./store/scroll";
import SwingingHero from "./hero/SwingingHero";
import Sections from "./sections/Sections";
import Hud from "./ui/Hud";

// three.js is most of the bundle; load it after the comic content so text paints first.
const CityBackground = lazy(() => import("./scene/CityBackground"));
const sceneFallback = (
  <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, background: "linear-gradient(180deg, #0a0520 0%, #2a1250 60%, #4a1866 100%)" }} />
);

export default function App() {
  useEffect(() => initSmoothScroll(), []);

  return (
    <>
      <Suspense fallback={sceneFallback}>
        <CityBackground />
      </Suspense>
      {/* HUD first in DOM so keyboard users reach the nav before content; z-index keeps it on top. */}
      <Hud />
      <main style={{ position: "relative", zIndex: "var(--z-content)" as unknown as number }}>
        <Sections />
      </main>
      <SwingingHero />
    </>
  );
}
