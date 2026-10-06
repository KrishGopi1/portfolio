import { useRef, type PointerEvent } from "react";
import { skills, type SkillGroup } from "../data/portfolio";
import { ChapterHead, vars } from "./shared";
import "./skills.css";

const ACCENTS = [
  { a: "var(--red)", ink: "var(--paper)" },
  { a: "var(--cyan)", ink: "var(--ink)" },
  { a: "var(--yellow)", ink: "var(--ink)" },
  { a: "var(--blue)", ink: "var(--paper)" },
  { a: "var(--magenta)", ink: "var(--ink)" },
  { a: "var(--blue-deep)", ink: "var(--paper)" },
];

/** Small original glyphs, one per power card. */
function Glyph({ i }: { i: number }) {
  const common = { fill: "none", stroke: "var(--ink)", strokeWidth: 5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (i % 6) {
    case 0: // code brackets
      return (
        <svg viewBox="0 0 100 100">
          <path d="M34 26 L12 50 L34 74 M66 26 L88 50 L66 74 M56 18 L44 82" {...common} />
        </svg>
      );
    case 1: // spider-sense waves
      return (
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="56" r="10" fill="var(--ink)" />
          <path d="M30 38 Q22 30 26 18 M70 38 Q78 30 74 18 M24 52 Q12 48 8 36 M76 52 Q88 48 92 36 M30 68 Q18 72 10 82 M70 68 Q82 72 90 82" {...common} />
        </svg>
      );
    case 2: // web-shooter target
      return (
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="34" {...common} />
          <circle cx="50" cy="50" r="18" {...common} />
          <circle cx="50" cy="50" r="5" fill="var(--ink)" />
          <path d="M50 6 V22 M50 78 V94 M6 50 H22 M78 50 H94" {...common} />
        </svg>
      );
    case 3: // wall grid
      return (
        <svg viewBox="0 0 100 100">
          <path d="M12 20 H88 M12 44 H88 M12 68 H88 M12 92 H88 M36 20 V44 M64 20 V44 M24 44 V68 M52 44 V68 M80 44 V68 M36 68 V92 M64 68 V92" {...common} />
          <circle cx="52" cy="32" r="6" fill="var(--ink)" />
        </svg>
      );
    case 4: // processor cores
      return (
        <svg viewBox="0 0 100 100">
          <rect x="24" y="24" width="52" height="52" {...common} />
          <rect x="38" y="38" width="24" height="24" fill="var(--ink)" />
          <path d="M36 10 V24 M50 10 V24 M64 10 V24 M36 76 V90 M50 76 V90 M64 76 V90 M10 36 H24 M10 50 H24 M10 64 H24 M76 36 H90 M76 50 H90 M76 64 H90" {...common} />
        </svg>
      );
    default: // utility belt
      return (
        <svg viewBox="0 0 100 100">
          <path d="M6 44 H94 V60 H6 Z" {...common} />
          <rect x="40" y="38" width="20" height="28" fill="var(--ink)" />
          <rect x="14" y="60" width="16" height="18" {...common} />
          <rect x="70" y="60" width="16" height="18" {...common} />
        </svg>
      );
  }
}

function PowerCard({ g, i }: { g: SkillGroup; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const acc = ACCENTS[i % ACCENTS.length];

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--ry", `${(x - 0.5) * 16}deg`);
    el.style.setProperty("--rx", `${(0.5 - y) * 14}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <li className="pcard" data-reveal="pop" style={vars({ "--rd": `${(i % 3) * 90}ms`, "--acc": acc.a, "--acc-ink": acc.ink })}>
      <div className="pcard__inner" ref={ref} onPointerMove={onMove} onPointerLeave={onLeave}>
        <div className="pcard__top">
          <span className="pcard__no">{String(i + 1).padStart(2, "0")}</span>
          <span className="pcard__type">Power card</span>
          <span className="pcard__p1" aria-hidden="true">P1</span>
        </div>
        <div className="pcard__art" aria-hidden="true">
          <Glyph i={i} />
        </div>
        <h3 className="pcard__power">{g.power}</h3>
        <p className="pcard__title">{g.title}</p>
        <ul className="pcard__chips">
          {g.items.map((it) => (
            <li key={it} className="chip">
              {it}
            </li>
          ))}
        </ul>
        <div className="pcard__foot" aria-hidden="true">
          <span>Abilities</span>
          <span className="pcard__pips">
            {g.items.map((it) => (
              <i key={it} />
            ))}
          </span>
        </div>
        <span className="pcard__sheen" aria-hidden="true" />
      </div>
    </li>
  );
}

export default function Skills() {
  return (
    <section id="skills" data-section="skills" className="cv-section skills" aria-labelledby="skills-title">
      <div className="cv-container">
        <ChapterHead id="skills" sub="Choose your loadout">
          <p className="skills__prompt" aria-hidden="true">
            <span className="skills__arrow">&#9654;</span> Select your power <span className="skills__blink">_</span>
          </p>
        </ChapterHead>
        <ul className="skills__grid">
          {skills.map((g, i) => (
            <PowerCard key={g.title} g={g} i={i} />
          ))}
        </ul>
      </div>
    </section>
  );
}
