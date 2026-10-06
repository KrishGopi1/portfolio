import { profile } from "../data/portfolio";
import { ChapterHead, Starburst, vars } from "./shared";
import "./about.css";

export default function About() {
  const [first, ...more] = profile.about;

  return (
    <section id="about" data-section="about" className="cv-section about" aria-labelledby="about-title">
      <div className="cv-container">
        <ChapterHead id="about" sub="Meanwhile, behind the mask…" />

        <div className="about__grid">
          <article className="panel about__p1" data-reveal="left">
            <span className="about__tag sticker" style={vars({ "--tilt": "-4deg" })}>
              Page 02
            </span>
            <h3 className="about__ptitle">The Story So Far</h3>
            <p className="caption about__cap">
              <span className="caption__label">Our hero&hellip;</span>
              {first}
            </p>
            <div className="about__silhouette" aria-hidden="true">
              <svg viewBox="0 0 200 120" preserveAspectRatio="none">
                <path
                  d="M0 120 L0 70 L18 70 L18 40 L40 40 L40 80 L58 80 L58 20 L82 20 L82 60 L100 60 L100 30 L126 30 L126 75 L144 75 L144 10 L168 10 L168 55 L184 55 L184 85 L200 85 L200 120 Z"
                  fill="var(--ink)"
                />
                <g fill="var(--yellow)">
                  <rect x="22" y="46" width="5" height="5" />
                  <rect x="62" y="28" width="5" height="5" />
                  <rect x="70" y="40" width="5" height="5" />
                  <rect x="130" y="40" width="5" height="5" />
                  <rect x="150" y="22" width="5" height="5" />
                  <rect x="158" y="36" width="5" height="5" />
                </g>
              </svg>
            </div>
          </article>

          <article className="panel about__p2" data-reveal="right" style={vars({ "--rd": "120ms" })}>
            <h3 className="sr-only">In his own words</h3>
            {more.map((para, i) => (
              <p key={i} className="bubble bubble--right about__bubble">
                {para}
              </p>
            ))}
            <p className="about__speaker">
              <span aria-hidden="true">&mdash;</span> {profile.name.split(" ")[0]}, probably mid-swing
            </p>
            <Starburst text="FWIP!" seed={7} size={108} fill="var(--cyan)" className="about__burst" />
          </article>

          <article className="panel panel--ink about__mission" data-reveal="slam" style={vars({ "--rd": "200ms" })}>
            <div className="about__mission-head">
              <span className="about__blip" aria-hidden="true" />
              <span className="about__mission-label">Incoming transmission</span>
            </div>
            <h3 className="about__mission-title misreg">Current Mission</h3>
            <p className="about__mission-text">{profile.currentFocus}</p>
            <span className="about__stamp" aria-hidden="true">
              Priority
              <br />
              One
            </span>
          </article>
        </div>
      </div>
    </section>
  );
}
