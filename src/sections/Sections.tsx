// All page content, in SECTIONS order. Each section renders <section id data-section>.
import "./comic.css";
import { useReveal } from "./shared";
import Hero from "./Hero";
import About from "./About";
import Skills from "./Skills";
import Projects from "./Projects";
import OpenSource from "./OpenSource";
import Interests from "./Interests";
import Contact from "./Contact";

export default function Sections() {
  useReveal();
  return (
    <div className="cv-root">
      <Hero />
      <About />
      <Skills />
      <Projects />
      <OpenSource />
      <Interests />
      <Contact />
    </div>
  );
}
