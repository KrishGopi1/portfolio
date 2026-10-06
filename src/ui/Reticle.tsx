import { useEffect, useRef } from "react";

const SFX = ["THWIP!", "THWIP!", "FWIP!", "THWIP!"];

/**
 * Web-reticle that trails the native cursor on fine pointers (the native cursor stays visible).
 * Clicking fires a tiny "THWIP!". Disabled for touch and reduced motion.
 */
export default function Reticle() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = ref.current;
    if (!fine || reduced || !el) return;

    let tx = -100;
    let ty = -100;
    let x = tx;
    let y = ty;
    let raf = 0;
    let running = false;
    let shots = 0;

    const tick = () => {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (Math.abs(tx - x) + Math.abs(ty - y) > 0.3) raf = requestAnimationFrame(tick);
      else running = false;
    };
    const kick = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      el.classList.add("is-visible");
      const t = e.target as Element | null;
      el.classList.toggle("is-hot", !!t?.closest?.("a, button, [role=button], .pcard__inner"));
      kick();
    };
    const onLeave = () => el.classList.remove("is-visible");
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      const s = document.createElement("span");
      s.className = "thwip";
      s.textContent = SFX[shots++ % SFX.length];
      s.style.left = `${e.clientX}px`;
      s.style.top = `${e.clientY}px`;
      s.style.setProperty("--r", `${Math.round(Math.random() * 30 - 15)}deg`);
      document.body.appendChild(s);
      s.addEventListener("animationend", () => s.remove(), { once: true });
      window.setTimeout(() => s.remove(), 1200);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className="reticle" ref={ref} aria-hidden="true">
      <svg viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="17" />
        <circle cx="24" cy="24" r="9" />
        <path d="M24 2 V14 M24 34 V46 M2 24 H14 M34 24 H46 M11 11 L17 17 M37 11 L31 17 M11 37 L17 31 M37 37 L31 31" />
      </svg>
    </div>
  );
}
