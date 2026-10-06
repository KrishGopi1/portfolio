import { useEffect, useRef, useState, type MouseEvent } from "react";
import { SECTIONS } from "../data/portfolio";
import { getLenis, scrollTo, subscribeScroll, scrollState } from "../store/scroll";
import { useActiveSection } from "./useActiveSection";

export default function Nav() {
  const active = useActiveSection();
  const [open, setOpen] = useState(false);
  const strandRef = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Per-frame strand fill via ref (no re-render).
  useEffect(
    () =>
      subscribeScroll((s) => {
        if (strandRef.current) strandRef.current.style.transform = `scaleX(${s.progress})`;
      }),
    [],
  );

  // Mobile menu: lock scroll, focus, Escape.
  useEffect(() => {
    if (!open) return;
    getLenis()?.stop();
    const first = menuRef.current?.querySelector<HTMLElement>("a");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab" && menuRef.current) {
        const f = menuRef.current.querySelectorAll<HTMLElement>("a, button");
        const a = f[0];
        const z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    const btn = btnRef.current;
    return () => {
      window.removeEventListener("keydown", onKey);
      getLenis()?.start();
      btn?.focus({ preventScroll: true });
    };
  }, [open]);

  const go = (id: string) => (e: MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    getLenis()?.start();
    scrollTo(id);
  };

  const total = String(SECTIONS.length).padStart(2, "0");

  return (
    <>
      <header className="nav">
        <a className="nav__mono" href="#hero" onClick={go("hero")} aria-label="Krish Gopi, back to top">
          <span aria-hidden="true">KG</span>
        </a>

        <nav className="nav__links" aria-label="Sections">
          <ul>
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={go(s.id)}
                  className={i === active ? "is-active" : undefined}
                  aria-current={i === active ? "location" : undefined}
                >
                  <span className="nav__idx" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p className="nav__stage" aria-hidden="true">
          <span>Stage</span>
          <b>
            {String(active + 1).padStart(2, "0")}/{total}
          </b>
        </p>

        <button
          ref={btnRef}
          type="button"
          className="nav__menu-btn"
          aria-expanded={open}
          aria-controls="cv-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="nav__burger" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          Menu
        </button>

        <span className="nav__strand" aria-hidden="true">
          <span ref={strandRef} style={{ transform: `scaleX(${scrollState.progress})` }} />
        </span>
      </header>

      {open && (
        <div id="cv-menu" className="menu" role="dialog" aria-modal="true" aria-label="Site menu" ref={menuRef}>
          <div className="menu__burst" aria-hidden="true" />
          <ol className="menu__list">
            {SECTIONS.map((s, i) => (
              <li key={s.id} style={{ ["--i" as string]: i }}>
                <a
                  href={`#${s.id}`}
                  onClick={go(s.id)}
                  className={i === active ? "is-active" : undefined}
                  aria-current={i === active ? "location" : undefined}
                >
                  <small aria-hidden="true">CH.{String(i + 1).padStart(2, "0")}</small>
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
          <button type="button" className="menu__close" onClick={() => setOpen(false)}>
            Close <span aria-hidden="true">&times;</span>
          </button>
        </div>
      )}
    </>
  );
}
