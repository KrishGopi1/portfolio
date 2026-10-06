import { profile } from "../data/portfolio";
import { scrollTo } from "../store/scroll";
import { vars } from "./shared";
import "./hero.css";

function Letters({ word, offset }: { word: string; offset: number }) {
  return (
    <span className="hero__word" aria-hidden="true">
      {[...word].map((ch, i) => (
        <span key={i} className="hero__ch" data-hero-in style={vars({ "--d": `${(offset + i) * 45 + 60}ms` })}>
          {ch}
        </span>
      ))}
    </span>
  );
}

export default function Hero() {
  const [first, ...rest] = profile.name.toUpperCase().split(" ");
  const last = rest.join(" ");

  return (
    <section id="hero" data-section="hero" className="cv-section hero" aria-labelledby="hero-title">
      <div className="hero__frame" aria-hidden="true">
        <span className="hero__corner hero__corner--tl" />
        <span className="hero__corner hero__corner--tr" />
        <span className="hero__corner hero__corner--bl" />
        <span className="hero__corner hero__corner--br" />
      </div>

      <div className="cv-container hero__inner">
        <div className="hero__mast" data-hero-in style={vars({ "--d": "0ms" })}>
          <div className="hero__issue">
            <small>Vol. 1</small>
            <b>#01</b>
          </div>
          <div className="hero__publisher">
            <span>KG</span> Comics
          </div>
          <div className="hero__universe">Earth-CS&amp;E</div>
        </div>

        <p className="hero__presents" data-hero-in style={vars({ "--d": "80ms" })}>
          {profile.alias}
        </p>

        <h1 id="hero-title" className="hero__title">
          <span className="sr-only">{profile.name}</span>
          <Letters word={first} offset={0} />
          <Letters word={last} offset={first.length} />
          <span className="hero__rated" data-hero-in style={vars({ "--d": "600ms" })} aria-hidden="true">
            Rated<b>ML</b>
          </span>
        </h1>

        <div className="hero__lower">
          <p className="hero__tagline bubble" data-hero-in style={vars({ "--d": "450ms" })}>
            {profile.tagline}
          </p>
          <p className="hero__role sticker" data-hero-in style={vars({ "--d": "520ms", "--tilt": "-3deg" })}>
            {profile.role}
          </p>
          <p className="hero__focus caption" data-hero-in style={vars({ "--d": "580ms" })}>
            <span className="caption__label">In this issue&hellip;</span>
            {profile.focus}
          </p>
        </div>

        <button
          type="button"
          className="hero__prompt"
          data-hero-in
          style={vars({ "--d": "700ms" })}
          onClick={() => scrollTo("about")}
        >
          <span className="hero__prompt-key">&#9660;</span>
          Scroll to swing
          <span className="hero__prompt-blink" aria-hidden="true">_</span>
        </button>
      </div>

      <div className="hero__cover-corner" aria-hidden="true">
        <div className="hero__price">
          <small>Price</small>
          <b>FREE</b>
          <small>&infin; &cent;</small>
        </div>
        <div className="hero__barcode">
          <span className="hero__bars" />
          <span className="hero__code">0 41011 KG 001 7</span>
        </div>
      </div>
    </section>
  );
}
