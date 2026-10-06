import { projects } from "../data/portfolio";
import { ChapterHead, Starburst, vars } from "./shared";
import "./projects.css";

const ACCENTS = [
  { a: "var(--red)", ink: "var(--paper)", burst: "var(--yellow)" },
  { a: "var(--blue)", ink: "var(--paper)", burst: "var(--cyan)" },
  { a: "var(--yellow)", ink: "var(--ink)", burst: "var(--magenta)" },
  { a: "var(--magenta)", ink: "var(--ink)", burst: "var(--yellow)" },
  { a: "var(--cyan)", ink: "var(--ink)", burst: "var(--red)" },
  { a: "var(--red-deep)", ink: "var(--paper)", burst: "var(--yellow)" },
];

export default function Projects() {
  return (
    <section id="projects" data-section="projects" className="cv-section missions" aria-labelledby="projects-title">
      <div className="cv-container">
        <ChapterHead id="projects" sub="Case files, declassified">
          <p className="missions__count" aria-hidden="true">
            <b>{projects.length}</b> issues on file &middot; tap in, true believer
          </p>
        </ChapterHead>

        <ol className="missions__list">
          {projects.map((p, i) => {
            const acc = ACCENTS[i % ACCENTS.length];
            const side = i % 2 === 0 ? "l" : "r";
            const long = p.bullets.length > 6;
            return (
              <li
                key={p.id}
                className={`mission mission--${side}`}
                style={vars({ "--acc": acc.a, "--acc-ink": acc.ink, "--skew": side === "l" ? "-1.6deg" : "1.6deg" })}
              >
                <article className="mission__panel" data-reveal="slam" aria-labelledby={`m-${p.id}`}>
                  <div className="mission__inner">
                    <header className="mission__head">
                      <div className="mission__issue">
                        <small>Issue</small>
                        <b>{p.issue}</b>
                      </div>
                      <p className="mission__kicker">{p.kicker}</p>
                    </header>

                    <h3 id={`m-${p.id}`} className="mission__title">
                      {p.title}
                    </h3>

                    <div className={`mission__body${p.quote ? "" : " mission__body--noquote"}`}>
                      <div className="mission__story">
                        <p className="mission__summary">{p.summary}</p>
                        {p.quote && (
                          <figure className="mission__quote">
                            <blockquote className="bubble">
                              <p>&ldquo;{p.quote}&rdquo;</p>
                            </blockquote>
                            <figcaption>&mdash; an example query, on demand</figcaption>
                          </figure>
                        )}
                        <ul className="mission__tags" aria-label="Tech">
                          {p.tags.map((t, k) => (
                            <li key={t} className="sticker" style={vars({ "--tilt": `${((k * 37 + i * 11) % 7) - 3}deg` })}>
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className={`mission__obj${long ? " mission__obj--long" : ""}`}>
                        <h4 className="mission__obj-title">
                          <span aria-hidden="true">&#9670;</span> Mission objectives
                        </h4>
                        <ul>
                          {p.bullets.map((b) => (
                            <li key={b}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </article>

                <div className="mission__sfx" data-reveal="pop" style={vars({ "--rd": "280ms" })}>
                  <Starburst text={p.sfx} seed={i + 3} size={150} fill={acc.burst} />
                </div>
                <span className="mission__pg" aria-hidden="true">
                  pg.{String(i * 4 + 12).padStart(2, "0")}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
