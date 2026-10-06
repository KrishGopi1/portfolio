// Scroll-driven web-swinging spider-hero overlay. Fixed, full-viewport,
// pointer-events: none, z-index var(--z-hero). All per-frame work happens in a
// single requestAnimationFrame loop (./animator) that mutates SVG attributes.
import { useEffect, useRef } from "react";
import "./hero.css";
import { startHero } from "./animator";
import { HeroDefs, HeroParts, burstPoints } from "./HeroFigure";

const SPEED_LINES = 14;

function Splat() {
  const spokes = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    return `M 0 0 L ${(Math.cos(a) * 9).toFixed(1)} ${(Math.sin(a) * 7).toFixed(1)}`;
  }).join(" ");
  const ring = "M -5 -1.5 Q 0 1 5 -1.5 M -4 2.6 Q 0 4.6 4.6 2.2";
  return (
    <g data-hs="splat">
      <path className="hs-splat-ink" d={spokes + " " + ring} />
      <path className="hs-splat" d={spokes + " " + ring} />
    </g>
  );
}

export default function SwingingHero() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    return startHero(svg);
  }, []);

  return (
    <div className="hs-root" aria-hidden="true">
      <svg ref={svgRef} className="hs-svg" style={{ visibility: "hidden" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <HeroDefs />
        </defs>

        <g className="hs-speed" data-hs="speed" style={{ display: "none" }}>
          {Array.from({ length: SPEED_LINES }, (_, i) => (
            <line
              key={i}
              stroke={i % 3 === 0 ? "var(--web)" : "var(--ink)"}
              strokeWidth={i % 3 === 0 ? 1.6 : 2.6}
            />
          ))}
        </g>

        <g data-hs="ropes">
          {[0, 1].map((k) => (
            <g key={k} data-hs={`rope${k}`} style={{ display: "none" }}>
              <path className="hs-rope-ink" />
              <path className="hs-rope" />
              <circle data-hs="tip" fill="var(--web)" stroke="var(--ink)" strokeWidth={1.4} />
              <Splat />
            </g>
          ))}
        </g>

        <g data-hs="smear" style={{ display: "none" }}>
          <use href="#hs-body" data-hs="smear2" />
          <use href="#hs-body" data-hs="smear1" />
        </g>
        <use href="#hs-body" className="hs-ghost hs-ghost-c" data-hs="ghostC" />
        <use href="#hs-body" className="hs-ghost hs-ghost-m" data-hs="ghostM" />

        <g data-hs="main">
          <g id="hs-body">
            <use href="#hs-parts" className="hs-outline" />
            <HeroParts />
          </g>
        </g>

        <g data-hs="thwip" style={{ display: "none" }}>
          <polygon className="hs-thwip-burst" points={burstPoints(13, 30, 18)} />
          <polygon className="hs-thwip-burst2" points={burstPoints(9, 15, 11)} transform="translate(-3 -2)" />
          <text className="hs-thwip-text" textAnchor="middle" dominantBaseline="central" y={1} transform="rotate(-4)">
            THWIP!
          </text>
        </g>
      </svg>
    </div>
  );
}
