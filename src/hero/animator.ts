// Single RAF loop that drives the hero SVG imperatively (no React renders).
import { scrollState } from "../store/scroll";
import { HERO } from "./config";
import {
  DEG, add, apply, applyLin, clamp, easeOutBack, len, linMat, matStr, mul, scale, smooth, sub, vlerp,
  type Mat, type Vec,
} from "./math";
import { buildPlan, sample, type Plan, type Sample } from "./plan";
import { J, JOINT_COUNT, SK, frontFoot, frontHand, pivotLocal, type JointName, type Pose } from "./rig";

const SPEED_LINES = 14;
const ROPE_SLOTS = 2;
const HIST = 10;

type JointEl = { el: SVGGElement; idx: number; x: number; y: number; hasT: boolean };

export function startHero(svg: SVGSVGElement): () => void {
  const q = <T extends Element>(sel: string) => svg.querySelector(sel) as T;

  // Joint groups
  const joints: JointEl[] = [];
  svg.querySelectorAll<SVGGElement>("#hs-parts [data-j]").forEach((el) => {
    const name = el.dataset.j as JointName;
    const hasT = el.dataset.x !== undefined;
    joints.push({ el, idx: J[name], x: Number(el.dataset.x ?? 0), y: Number(el.dataset.y ?? 0), hasT });
  });
  const eyes = q<SVGGElement>("#hs-parts [data-hs=eyes]");
  const main = q<SVGGElement>("[data-hs=main]");
  const ghostC = q<SVGUseElement>("[data-hs=ghostC]");
  const ghostM = q<SVGUseElement>("[data-hs=ghostM]");
  const smearG = q<SVGGElement>("[data-hs=smear]");
  const smear1 = q<SVGUseElement>("[data-hs=smear1]");
  const smear2 = q<SVGUseElement>("[data-hs=smear2]");
  const speedG = q<SVGGElement>("[data-hs=speed]");
  const speedLines = Array.from(speedG.querySelectorAll<SVGLineElement>("line"));
  const thwipG = q<SVGGElement>("[data-hs=thwip]");
  const ropes = Array.from({ length: ROPE_SLOTS }, (_, k) => {
    const g = q<SVGGElement>(`[data-hs=rope${k}]`);
    return {
      g,
      ink: g.querySelector<SVGPathElement>(".hs-rope-ink")!,
      web: g.querySelector<SVGPathElement>(".hs-rope")!,
      splat: g.querySelector<SVGGElement>("[data-hs=splat]")!,
      tip: g.querySelector<SVGCircleElement>("[data-hs=tip]")!,
    };
  });

  let plan: Plan | null = null;
  let disp: Pose = new Array(JOINT_COUNT).fill(0);
  let lastTick = -1;
  let prevCom: Vec | null = null;
  let prevT = 0;
  let vel: Vec = { x: 0, y: 0 };
  const hist: Mat[] = [];
  const speedRand = Array.from({ length: SPEED_LINES }, () => ({ y: 0, gap: 0, len: 0 }));
  let lastStaticKey = "";
  let raf = 0;
  let shown = false;
  let devFrozen = false;

  const setVis = (el: Element, on: boolean) => {
    const v = on ? "" : "none";
    const s = (el as SVGElement).style;
    if (s.display !== v) s.display = v;
  };

  function applyPose(p: Pose) {
    for (const j of joints) {
      const a = p[j.idx].toFixed(2);
      j.el.setAttribute("transform", j.hasT ? `translate(${j.x} ${j.y}) rotate(${a})` : `rotate(${a})`);
    }
  }

  function decorate(base: Pose, smp: Sample, t: number, s: number, reduced: boolean): Pose {
    const p = base.slice();
    if (reduced) return p;
    // Velocity in the body's local frame (rig units / frame) -> trailing limbs.
    const lv = scale(applyLin(linMat(-smp.r, 1, 1), vel), 1 / s);
    lv.x *= smp.facing >= 0 ? 1 : -1;
    const lag = clamp(lv.x * 2.4, -38, 38);
    const lagY = clamp(lv.y * 1.6, -25, 25);
    p[J.fHip] += lag * 0.8 - lagY * 0.3;
    p[J.bHip] += lag - lagY * 0.4;
    p[J.fKn] += Math.abs(lag) * 0.3;
    p[J.bKn] += Math.abs(lag) * 0.45;
    p[J.bSh] += lag * 1.1;
    p[J.bEl] -= Math.abs(lag) * 0.3;
    p[J.neck] -= lag * 0.25;
    // Breathing / idle drift.
    p[J.spine] += 1.3 * Math.sin(t * 2.1);
    p[J.neck] += 2 * Math.sin(t * 1.3 + 1);
    p[J.bSh] += 4 * Math.sin(t * 1.7);
    p[J.bEl] += 4 * Math.sin(t * 1.9 + 2);
    p[J.fKn] += 3 * Math.sin(t * 1.5 + 0.5);
    p[J.bKn] += 4 * Math.sin(t * 1.6 + 1.5);
    if (!smp.grip && smp.wave <= 0) p[J.fEl] += 3 * Math.sin(t * 1.8);
    // Wave (final pose).
    if (smp.wave > 0) {
      p[J.fEl] += smp.wave * 34 * Math.sin(t * 8);
      p[J.fWr] += smp.wave * 22 * Math.sin(t * 8 + 0.8);
    }
    return p;
  }

  function rerollSpeed() {
    for (const r of speedRand) {
      r.y = (Math.random() * 2 - 1) * 55;
      r.gap = 8 + Math.random() * 30;
      r.len = 0.35 + Math.random() * 0.65;
    }
  }
  rerollSpeed();

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    if (!devFrozen) render(now / 1000);
  }

  function render(t: number, yOverride?: number) {
    const vw = scrollState.vw || window.innerWidth;
    const vh = scrollState.vh || window.innerHeight;
    let limit = scrollState.limit;
    let y = scrollState.y;
    if (limit <= 1) {
      limit = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      y = window.scrollY;
    }
    if (yOverride !== undefined) y = yOverride;
    const reduced = scrollState.reducedMotion;
    const key = `${vw}|${vh}|${Math.round(limit)}`;
    if (!plan || plan.key !== key) plan = buildPlan(vw, vh, limit);
    if (reduced) {
      if (lastStaticKey === key) return;
      lastStaticKey = key;
    }
    const s = plan.s;
    const smp = reduced ? sample(plan, 0, 0) : sample(plan, y, t);
    const tt = reduced ? 0 : t;

    // ---- Pose "on twos": joints update at ~12fps, position stays smooth.
    const tick = reduced || lastTick < 0 || t - lastTick >= 1 / HERO.poseFps || t < lastTick;
    if (tick) {
      lastTick = t;
      disp = decorate(smp.pose, smp, tt, s, reduced);
      applyPose(disp);
      const blink = !reduced && tt % 3.7 < 0.1;
      const k = blink ? 0.12 : 1 - smp.squint * 0.6;
      eyes.setAttribute("transform", `translate(1.8 -11.6) scale(1 ${k.toFixed(2)}) translate(-1.8 11.6)`);
      rerollSpeed();
    }

    // ---- Root placement: pin the pivot (hand on rope / foot / centre of mass).
    const lin = linMat(smp.r, smp.facing * s, s);
    const root = sub(smp.pivotWorld, applyLin(lin, pivotLocal(disp, smp.pivot)));
    const M: Mat = [lin[0], lin[1], lin[2], lin[3], root.x, root.y];
    const com = apply(M, SK.com);

    // ---- Screen-space velocity of the body (px / 60Hz frame).
    const dt = prevT ? clamp(t - prevT, 1 / 240, 0.1) : 1 / 60;
    prevT = t;
    if (prevCom && !reduced) {
      const d = scale(sub(com, prevCom), 1 / (dt * 60));
      if (len(d) > Math.max(vw, vh) * 0.4) vel = { x: 0, y: 0 };
      else vel = vlerp(vel, d, 0.25);
    }
    prevCom = com;
    const speed = reduced ? 0 : len(vel);
    const ang = Math.atan2(vel.y, vel.x) / DEG;

    // ---- Squash & stretch along the motion.
    const st = clamp((speed - 3) / 110, 0, 0.2);
    const Sl = mul(linMat(ang, 1 + st, 1 / (1 + st)), linMat(-ang, 1, 1));
    const sc = applyLin(Sl, com);
    const S: Mat = [Sl[0], Sl[1], Sl[2], Sl[3], com.x - sc.x, com.y - sc.y];
    const M2 = mul(S, M);
    main.setAttribute("transform", matStr(M2));
    if (!shown) {
      svg.style.visibility = "";
      shown = true;
    }

    // ---- Ghosts: chromatic offset + smear multiples.
    hist.push(M2);
    if (hist.length > HIST) hist.shift();
    const fx = !reduced;
    setVis(ghostC, fx);
    setVis(ghostM, fx);
    if (fx) {
      const dir = speed > 0.4 ? scale(vel, 1 / speed) : { x: 0.85, y: 0.5 };
      const mag = 1.6 + Math.min(13, speed * 0.32);
      const oc = scale(dir, -mag);
      const om = add(scale(dir, mag * 0.7), { x: -dir.y * 1.2, y: dir.x * 1.2 });
      ghostC.setAttribute("transform", matStr([M2[0], M2[1], M2[2], M2[3], M2[4] + oc.x, M2[5] + oc.y]));
      ghostM.setAttribute("transform", matStr([M2[0], M2[1], M2[2], M2[3], M2[4] + om.x, M2[5] + om.y]));
      const op = 0.5 + Math.min(0.3, speed * 0.02);
      ghostC.style.opacity = op.toFixed(2);
      ghostM.style.opacity = (op * 0.85).toFixed(2);
    }
    const sa = fx ? clamp((speed - 6) / 22) * 0.42 : 0;
    setVis(smearG, sa > 0.01 && hist.length >= HIST);
    if (sa > 0.01 && hist.length >= HIST) {
      smear1.setAttribute("transform", matStr(hist[HIST - 4]));
      smear2.setAttribute("transform", matStr(hist[HIST - 8]));
      smear1.style.opacity = sa.toFixed(2);
      smear2.style.opacity = (sa * 0.55).toFixed(2);
      smearG.style.filter = `blur(${Math.min(3.5, speed * 0.07).toFixed(1)}px)`;
    }

    // ---- Speed lines.
    const so = fx ? clamp((speed - 4) / 16) * 0.9 : 0;
    setVis(speedG, so > 0.01);
    if (so > 0.01) {
      speedG.setAttribute("transform", `translate(${com.x.toFixed(1)} ${com.y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
      speedG.style.opacity = so.toFixed(2);
      if (tick) {
        const Lmag = clamp(speed * 7, 30, 320);
        speedLines.forEach((ln, i) => {
          const r = speedRand[i];
          const x2 = -r.gap * s - 14 * s;
          ln.setAttribute("x1", (x2 - Lmag * r.len).toFixed(1));
          ln.setAttribute("x2", x2.toFixed(1));
          ln.setAttribute("y1", (r.y * s).toFixed(1));
          ln.setAttribute("y2", (r.y * s).toFixed(1));
        });
      }
    }

    // ---- Web lines.
    const handW = apply(M2, frontHand(disp));
    const footW = apply(M2, frontFoot(disp));
    const sk = clamp(s / 1.5, 0.65, 1.1);
    let fireRope: { anchor: Vec; tip: Vec } | null = null;
    for (let k = 0; k < ROPE_SLOTS; k++) {
      const slot = ropes[k];
      const spec = smp.ropes[k];
      setVis(slot.g, !!spec);
      if (!spec) continue;
      const att = vlerp(handW, footW, spec.attach);
      const p0 = vlerp(att, spec.anchor, spec.retract);
      const tip = vlerp(att, spec.anchor, spec.extend);
      const dv = sub(tip, p0);
      const L = len(dv) || 1;
      const nrm = { x: -dv.y / L, y: dv.x / L };
      const sgn = spec.seed > 0.5 ? 1 : -1;
      const wob = reduced ? 0 : spec.wobble * L * 0.16 * sgn * (1 + 0.25 * Math.sin(t * 30));
      const mid = add(vlerp(p0, tip, 0.5), scale(nrm, wob));
      const d = `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} Q ${mid.x.toFixed(1)} ${mid.y.toFixed(1)} ${tip.x.toFixed(1)} ${tip.y.toFixed(1)}`;
      slot.ink.setAttribute("d", d);
      slot.web.setAttribute("d", d);
      slot.ink.style.strokeWidth = (4 * sk).toFixed(2);
      slot.web.style.strokeWidth = (1.8 * sk).toFixed(2);
      slot.g.style.opacity = spec.opacity.toFixed(2);
      const attached = spec.extend >= 0.999 && spec.retract <= 0 && spec.anchor.y > -40;
      setVis(slot.splat, attached);
      if (attached) slot.splat.setAttribute("transform", `translate(${spec.anchor.x.toFixed(1)} ${Math.max(spec.anchor.y, 2).toFixed(1)}) scale(${sk.toFixed(2)})`);
      const flying = spec.extend < 0.999;
      setVis(slot.tip, flying);
      if (flying) {
        slot.tip.setAttribute("cx", tip.x.toFixed(1));
        slot.tip.setAttribute("cy", tip.y.toFixed(1));
        slot.tip.setAttribute("r", (3 * sk).toFixed(1));
      }
      if (spec.attach < 1) fireRope = { anchor: spec.anchor, tip };
    }

    // ---- THWIP!
    const showT = fx && smp.thwip >= 0 && !!fireRope;
    setVis(thwipG, showT);
    if (showT && fireRope) {
      const e = smp.thwip;
      const ad0 = sub(fireRope.anchor, handW);
      const al = len(ad0) || 1;
      const ad = scale(ad0, 1 / al);
      const out0 = sub(handW, com);
      const ol = len(out0) || 1;
      const out = scale(out0, 1 / ol);
      const pos = add(handW, add(scale(out, 40 * sk), add(scale(ad, 8 * sk), { x: 0, y: -10 * sk })));
      const pop = e < 0.3 ? easeOutBack(e / 0.3) : 1 + (e - 0.3) * 0.18;
      const rotA = -14 + smp.thwipSeed * 26;
      // "On twos" shake.
      const jx = Math.round(t * 12) % 2 ? 1.5 : -1.5;
      thwipG.setAttribute(
        "transform",
        `translate(${(pos.x + jx).toFixed(1)} ${pos.y.toFixed(1)}) rotate(${rotA.toFixed(1)}) scale(${(pop * sk * 0.95).toFixed(3)})`,
      );
      thwipG.style.opacity = (1 - smooth((e - 0.62) / 0.38)).toFixed(2);
    }
  }

  function start() {
    if (!raf) {
      prevT = 0;
      raf = requestAnimationFrame(frame);
    }
  }
  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }
  const onVis = () => (document.hidden ? stop() : start());
  const onResize = () => {
    lastStaticKey = "";
    if (scrollState.reducedMotion) render(performance.now() / 1000);
  };
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("resize", onResize);
  if (!document.hidden) start();
  render(performance.now() / 1000);
  // Dev-only hook for visual testing in a background tab: __hsRender(scrollY, time)
  const w = window as unknown as { __hsRender?: (y?: number, t?: number) => void };
  if (import.meta.env.DEV) {
    w.__hsRender = (yy?: number, tt?: number) => {
      devFrozen = yy !== undefined; // passing a y freezes the live loop; call with no args to resume
      render(tt ?? performance.now() / 1000, yy);
    };
  }

  return () => {
    stop();
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("resize", onResize);
    if (import.meta.env.DEV) delete w.__hsRender;
  };
}
