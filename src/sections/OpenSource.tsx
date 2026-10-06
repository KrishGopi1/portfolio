import { openSource, profile } from "../data/portfolio";
import { ChapterHead, Starburst } from "./shared";
import "./opensource.css";

export default function OpenSource() {
  const first = profile.name.split(" ")[0];
  return (
    <section id="opensource" data-section="opensource" className="cv-section teamup" aria-labelledby="opensource-title">
      <div className="cv-container">
        <ChapterHead id="opensource" sub="A very special crossover event" />

        <div className="teamup__wrap" data-reveal="slam">
          <p className="teamup__banner" aria-hidden="true">
            <span className="teamup__name">{first}</span>
            <span className="teamup__x">&times;</span>
            <span className="teamup__name teamup__name--alt">Open Source</span>
          </p>

          <div className="teamup__split">
            <article className="teamup__panel teamup__panel--a">
              <h3 className="teamup__h">The Crossover</h3>
              <p className="teamup__text">{openSource.summary}</p>
            </article>

            <div className="teamup__vs" aria-hidden="true">
              <Starburst text="TEAM-UP!" seed={21} size={150} fill="var(--yellow)" />
            </div>

            <article className="teamup__panel teamup__panel--b">
              <h3 className="teamup__h">Latest Issue</h3>
              <p className="teamup__text">{openSource.recent}</p>
              <ul className="teamup__badges" aria-label="Focus areas">
                <li className="sticker">Docs QA</li>
                <li className="sticker">Dependency checks</li>
                <li className="sticker">Broken links</li>
              </ul>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
