import { profile } from "../data/portfolio";
import { ChapterHead, Starburst, vars } from "./shared";
import "./contact.css";

/** Original web + spider emblem (not any official logo). */
function SignalEmblem() {
  const c = 100;
  const spokes = 10;
  const angle = (i: number) => (i / spokes) * Math.PI * 2 - Math.PI / 2;
  const pt = (i: number, r: number) => [c + Math.cos(angle(i)) * r, c + Math.sin(angle(i)) * r];
  const rings = [26, 46, 66, 86].map((r) => {
    let d = "";
    for (let i = 0; i < spokes; i++) {
      const [x1, y1] = pt(i, r);
      const [x2, y2] = pt(i + 1, r);
      const mid = (angle(i) + angle(i + 1)) / 2;
      const cx = c + Math.cos(mid) * r * 0.86;
      const cy = c + Math.sin(mid) * r * 0.86;
      d += `${i === 0 ? `M${x1.toFixed(1)} ${y1.toFixed(1)}` : ""} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)} `;
    }
    return d;
  });
  const legs = [
    "M94 86 L70 66 L58 40",
    "M93 90 L64 82 L44 64",
    "M93 96 L62 104 L46 128",
    "M95 100 L72 120 L64 150",
  ];

  return (
    <svg className="signal__emblem" viewBox="0 0 200 200" role="img" aria-label="Web signal emblem">
      <g fill="none" stroke="var(--ink)" strokeWidth="2.2" opacity="0.55">
        {Array.from({ length: spokes }, (_, i) => {
          const [x, y] = pt(i, 94);
          return <line key={i} x1={c} y1={c} x2={x} y2={y} />;
        })}
        {rings.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g stroke="var(--ink)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {legs.map((d) => (
          <path key={d} d={d} />
        ))}
        <g transform="translate(200 0) scale(-1 1)">
          {legs.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </g>
      <g fill="var(--ink)">
        <ellipse cx="100" cy="88" rx="10" ry="12" />
        <circle cx="100" cy="72" r="7" />
        <path d="M100 98 C 116 100 118 124 100 140 C 82 124 84 100 100 98 Z" />
      </g>
      <path d="M100 106 L107 116 L100 130 L93 116 Z" fill="var(--red)" />
    </svg>
  );
}

export default function Contact() {
  const others = profile.links.filter((l) => !l.href.startsWith("mailto:"));
  const year = new Date().getFullYear();

  return (
    <section id="contact" data-section="contact" className="cv-section signal" aria-labelledby="contact-title">
      <div className="signal__beam" aria-hidden="true" />
      <div className="cv-container signal__inner">
        <ChapterHead id="contact" sub="Light up the sky" center />

        <div className="signal__lamp" data-reveal="pop">
          <div className="signal__disc">
            <SignalEmblem />
          </div>
          <Starburst text="PING!" seed={33} size={118} fill="var(--red)" className="signal__burst" />
        </div>

        <p className="signal__pitch bubble" data-reveal="up">
          Research problem, retrieval pipeline, or a dataset that refuses to behave? Send up the signal and
          I&rsquo;ll swing by.
        </p>

        <a className="cbtn signal__mail" href={`mailto:${profile.email}`} data-reveal="slam" style={vars({ "--rd": "120ms" })}>
          <span className="signal__mail-label">Email</span>
          <span className="signal__mail-addr">{profile.email}</span>
        </a>

        <ul className="signal__links">
          {others.map((l, i) => (
            <li key={l.label} data-reveal="pop" style={vars({ "--rd": `${200 + i * 90}ms` })}>
              <a
                className={`cbtn signal__link signal__link--${i % 3}`}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {l.label}
                <span aria-hidden="true">&#8599;</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <footer className="signal__footer">
        <div className="cv-container signal__footer-inner">
          <p>
            &copy; {year} {profile.name}
          </p>
          <p className="signal__footer-joke">
            No spiders were harmed in the training of these models. <span aria-hidden="true">// to be continued&hellip;</span>
          </p>
        </div>
      </footer>
    </section>
  );
}
