import { interests } from "../data/portfolio";
import { ChapterHead, vars } from "./shared";
import "./interests.css";

/** "Graph Neural Networks" -> "GNN", "Bioinformatics" -> "BIO". */
function code(name: string) {
  const words = name.split(/[\s/-]+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").toUpperCase();
}

const STYLES = ["pop", "noir", "glitch", "manga", "pixel", "punk"] as const;
const ROWS = 3;

export default function Interests() {
  const rows = Array.from({ length: ROWS }, (_, r) =>
    interests
      .filter((_, i) => i % ROWS === r)
      .map((name, j) => ({ name, code: code(name), style: STYLES[(r * 2 + j) % STYLES.length] })),
  );

  return (
    <section id="interests" data-section="interests" className="cv-section verse" aria-labelledby="interests-title">
      <div className="cv-container">
        <ChapterHead id="interests" sub="Infinite dimensions, one curious mind">
          <p className="verse__intro caption">
            <span className="caption__label">Dimension scanner online</span>
            Every interest is its own universe. Pick one &mdash; it&rsquo;s a rabbit hole worth falling into.
          </p>
        </ChapterHead>

        <ul className="sr-only">
          {interests.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>

      <div className="verse__rows" aria-hidden="true" data-reveal="up">
        {rows.map((row, r) => {
          const half = [...row, ...row];
          return (
            <div
              key={r}
              className={`marquee${r % 2 ? " marquee--rev" : ""}`}
              style={vars({ "--dur": `${34 + r * 7}s`, "--tilt": `${r === 1 ? 2 : -2.5}deg` })}
            >
              <div className="marquee__track">
                {[0, 1].map((copy) => (
                  <div key={copy} className={`marquee__half${copy ? " marquee__dup" : ""}`}>
                    {half.map((it, k) => (
                      <span key={`${it.name}-${k}`} className={`portal portal--${it.style}${k >= row.length ? " marquee__dup" : ""}`}>
                        <small>Earth-{it.code}</small>
                        <b>{it.name}</b>
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
