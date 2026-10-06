// CSS/SVG fallback when WebGL is unavailable: gradient sky, halftone moon,
// two layers of skyline silhouette with lit windows.
import { useMemo } from "react";
import { mulberry32 } from "./cityLayout";

type Bld = { x: number; w: number; h: number };

function skyline(seed: number, count: number, minH: number, maxH: number): Bld[] {
  const r = mulberry32(seed);
  const out: Bld[] = [];
  let x = -20;
  for (let i = 0; i < count && x < 1460; i++) {
    const w = 34 + r() * 70;
    const h = minH + r() ** 1.6 * (maxH - minH);
    out.push({ x, w, h });
    x += w + r() * 6;
  }
  return out;
}

export default function FallbackCity() {
  const { far, near, windows } = useMemo(() => {
    const far = skyline(11, 60, 120, 420);
    const near = skyline(23, 50, 80, 330);
    const r = mulberry32(5);
    const windows: { x: number; y: number }[] = [];
    near.forEach((b) => {
      for (let y = 900 - b.h + 14; y < 880; y += 16) {
        for (let x = b.x + 6; x < b.x + b.w - 8; x += 12) if (r() < 0.22) windows.push({ x, y });
      }
    });
    return { far, near, windows };
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: "var(--z-scene)" as unknown as number,
        pointerEvents: "none",
        background: "linear-gradient(180deg, #0a0520 0%, #24104a 45%, #4a1866 72%, #ff4f9a 100%)",
        overflow: "hidden",
      }}
    >
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice" width="100%" height="100%">
        <defs>
          <pattern id="fb-dots" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <circle cx="4" cy="4" r="1.6" fill="#ff2bd6" opacity="0.35" />
          </pattern>
          <pattern id="fb-moon" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
            <circle cx="3.5" cy="3.5" r="1.7" fill="#f2a7d8" />
          </pattern>
          <radialGradient id="fb-halo">
            <stop offset="0.45" stopColor="#fff6e0" stopOpacity="0.45" />
            <stop offset="1" stopColor="#fff6e0" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="0" y="420" width="1440" height="480" fill="url(#fb-dots)" />
        <circle cx="1040" cy="230" r="230" fill="url(#fb-halo)" />
        <circle cx="1040" cy="230" r="110" fill="#fff6e0" stroke="#0b0b1a" strokeWidth="5" />
        <path d="M1040 120 a110 110 0 0 1 0 220 a80 110 0 0 0 0 -220z" fill="url(#fb-moon)" />
        <g fill="#2a1450">
          {far.map((b, i) => (
            <rect key={i} x={b.x} y={900 - b.h - 60} width={b.w} height={b.h + 60} />
          ))}
        </g>
        <g fill="#0f0a24" stroke="#0b0b1a" strokeWidth="3">
          {near.map((b, i) => (
            <rect key={i} x={b.x} y={900 - b.h} width={b.w} height={b.h} />
          ))}
        </g>
        <g fill="#ffd27a">
          {windows.map((w, i) => (
            <rect key={i} x={w.x} y={w.y} width="5" height="7" />
          ))}
        </g>
      </svg>
    </div>
  );
}
