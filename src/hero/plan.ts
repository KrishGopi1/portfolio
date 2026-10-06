// Scroll timeline -> character state. Pure & deterministic in (scrollY, viewport,
// limit); time `t` only adds idle sway. Layout:
//   [0, I)        intro: hang upside-down at top-right, drop, fire first web
//   [I, E)        N swing cycles, each = pendulum swing (swingFrac) + flight
//                 (release, flip/tuck, web-fire towards the next anchor). The
//                 last cycle's flight lands in the final upside-down hang.
//   [E, limit]    rest in the final pose (waving).
import { HERO } from "./config";
import {
  DEG, add, applyLin, clamp, easeOut, hash, hermite, lerp, linMat, scale, smooth, smoother, sub, unwrapNear,
  type Vec,
} from "./math";
import { POSES, aimFrontArm, blend, pivotLocal, J, SK, type Pivot, type Pose } from "./rig";

export type Cycle = {
  d: 1 | -1; // travel direction during the swing
  A: Vec; // anchor
  L: number; // rope length
  phiM: number; // amplitude (rad)
  kind: "flip" | "spread";
  seed: number;
};

export type Plan = {
  key: string;
  vw: number;
  vh: number;
  s: number; // px per rig unit
  I: number;
  E: number;
  Lc: number;
  N: number;
  cycles: Cycle[];
  hangA: Vec;
  hangL: number;
  d0: 1 | -1;
  finalA: Vec;
  finalL: number;
  finalFacing: 1 | -1;
};

export type RopeSpec = {
  anchor: Vec;
  /** 0 = rope attached to the front hand, 1 = attached to the front foot. */
  attach: number;
  /** Fraction of the way from attachment to anchor the rope tip has reached. */
  extend: number;
  /** Fraction the loose end has recoiled towards the anchor (after release). */
  retract: number;
  opacity: number;
  wobble: number;
  seed: number;
};

export type Sample = {
  mode: "hang" | "swing" | "flight" | "final";
  pose: Pose;
  r: number;
  facing: number;
  pivot: Pivot;
  pivotWorld: Vec;
  ropes: RopeSpec[];
  thwip: number; // <0 = hidden, else 0..1 progress
  thwipSeed: number;
  wave: number;
  squint: number;
  /** True while the front hand is gripping a rope (no secondary lag on that arm). */
  grip: boolean;
};

const W0 = HERO.startW;
const CS = Math.cos(Math.PI * W0);
const CR = HERO.releaseFrac;
const WR = Math.acos(-CR) / Math.PI;

const rangeLerp = (r: readonly [number, number], t: number) => lerp(r[0], r[1], t);

function solvePhi(ratio: number) {
  // sin(CS*phi) + sin(CR*phi) = ratio, monotone on [0, pi/2].
  let lo = 5 * DEG;
  let hi = 82 * DEG;
  const f = (p: number) => Math.sin(CS * p) + Math.sin(CR * p);
  if (ratio <= f(lo)) return lo;
  if (ratio >= f(hi)) return hi;
  for (let k = 0; k < 30; k++) {
    const m = (lo + hi) / 2;
    if (f(m) < ratio) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

export function buildPlan(vw: number, vh: number, limit: number): Plan {
  const mobile = vw < HERO.mobileBreakpoint;
  const heroPx = mobile ? HERO.heightMobile : HERO.heightDesktop * clamp(vh / 820, 0.82, 1.1);
  const s = heroPx / 100;
  const margin = heroPx * 0.5;
  const clampX = (x: number) => clamp(x, margin, vw - margin);

  const I = HERO.introVh * vh;
  const R = HERO.tailVh * vh;
  const E = Math.max(I + 0.6 * vh, limit - R);
  const N = Math.max(1, Math.round((E - I) / (HERO.cycleVh * vh)));
  const Lc = (E - I) / N;

  const hangA = { x: clampX(HERO.hangXVw * vw), y: -8 };
  const hangL = HERO.hangDropVh * vh + 10;

  const cycles: Cycle[] = [];
  let sx = clampX(hangA.x - 0.03 * vw);
  for (let i = 0; i < N; i++) {
    const d: 1 | -1 = i % 2 === 0 ? -1 : 1;
    const h1 = hash(i, 1);
    const h2 = hash(i, 2);
    const h3 = hash(i, 3);
    const h4 = hash(i, 4);
    const rx = clampX((d < 0 ? rangeLerp(HERO.leftReleaseVw, h1) : rangeLerp(HERO.rightReleaseVw, h1)) * vw);
    const W = Math.max(40, Math.abs(rx - sx));
    const yb = lerp(HERO.bottomMinVh, HERO.bottomMaxVh, h2) * vh;
    let phiM = lerp(HERO.phiMinDeg, HERO.phiMaxDeg, h3) * DEG;
    let L = W / (Math.sin(CS * phiM) + Math.sin(CR * phiM));
    let ay = yb - L;
    const ayMax = HERO.anchorMaxVh * vh;
    if (ay > ayMax) {
      ay = ayMax;
      L = yb - ay;
      phiM = solvePhi(W / L);
    }
    const A = { x: sx + d * L * Math.sin(CS * phiM), y: ay };
    cycles.push({ d, A, L, phiM, kind: i % 3 === 2 ? "spread" : "flip", seed: hash(i, 9) });
    sx = clampX(rx + d * rangeLerp(HERO.overshootVw, h4) * vw);
  }

  const dLast = cycles[N - 1].d;
  const fx = clampX((dLast > 0 ? HERO.finalRightVw : HERO.finalLeftVw) * vw);
  return {
    key: `${vw}|${vh}|${Math.round(limit)}`,
    vw, vh, s, I, E, Lc, N, cycles, hangA, hangL,
    d0: cycles[0].d,
    finalA: { x: fx, y: -8 },
    finalL: hangL + 0.04 * vh,
    finalFacing: fx > vw / 2 ? -1 : 1,
  };
}

// ---------------------------------------------------------------------------

type Body = { pose: Pose; r: number; facing: number; pivot: Pivot; pivotWorld: Vec };

function comWorld(b: Body, s: number): Vec {
  const lin = linMat(b.r, b.facing * s, s);
  const root = sub(b.pivotWorld, applyLin(lin, pivotLocal(b.pose, b.pivot)));
  return add(root, applyLin(lin, SK.com));
}

function swingPose(tau: number): Pose {
  return tau < 0.5
    ? blend(POSES.swingTop, POSES.swingBottom, smooth(tau / 0.5))
    : blend(POSES.swingBottom, POSES.swingRise, smooth((tau - 0.5) / 0.5));
}

function swingAt(p: Plan, i: number, tau: number, t: number, sway: boolean): Body {
  const c = p.cycles[i];
  const w = W0 + (WR - W0) * tau;
  let phi = -c.d * c.phiM * Math.cos(Math.PI * w);
  if (sway) {
    const env = smooth(tau / 0.15) * smooth((1 - tau) / 0.15);
    phi += (2.2 * Math.sin(t * 1.7 + c.seed * 6) + 0.8 * Math.sin(t * 3.1)) * DEG * env;
  }
  const H = { x: c.A.x + c.L * Math.sin(phi), y: c.A.y + c.L * Math.cos(phi) };
  const r = -phi / DEG;
  const pose = swingPose(tau);
  aimFrontArm(pose, sub(c.A, H), r, c.d, 1);
  return { pose, r, facing: c.d, pivot: "hand", pivotWorld: H };
}

/** dH/dy (px of hand travel per px of scroll). */
function swingVel(p: Plan, i: number, tau: number): Vec {
  const c = p.cycles[i];
  const w = W0 + (WR - W0) * tau;
  const phi = -c.d * c.phiM * Math.cos(Math.PI * w);
  const dphidw = c.d * c.phiM * Math.PI * Math.sin(Math.PI * w);
  const dwdy = (WR - W0) / (HERO.swingFrac * p.Lc);
  const k = c.L * dphidw * dwdy;
  return { x: k * Math.cos(phi), y: -k * Math.sin(phi) };
}

function hangAt(A: Vec, L: number, facing: number, t: number, swayAmt: number, wave: number, pose?: Pose): Body {
  const phi = (3.5 * Math.sin(t * 1.25) + 1.2 * Math.sin(t * 2.7 + 1)) * DEG * swayAmt;
  const F = { x: A.x + L * Math.sin(phi), y: A.y + L * Math.cos(phi) };
  return {
    pose: pose ?? blend(POSES.hang, POSES.wave, wave),
    r: 180 - phi / DEG,
    facing,
    pivot: "foot",
    pivotWorld: F,
  };
}

/** Release -> mid-air -> fire -> catch pose sequence. */
function flightPose(f: number, start: Pose, mid: Pose, end: Pose, fireEnd = 0.82): Pose {
  if (f < 0.18) return blend(start, POSES.release, smooth(f / 0.18));
  if (f < 0.42) return blend(POSES.release, mid, smooth((f - 0.18) / 0.24));
  if (f < 0.6) return blend(mid, POSES.fire, smooth((f - 0.42) / 0.18));
  if (f < fireEnd) return POSES.fire.slice();
  return blend(POSES.fire, end, smooth((f - fireEnd) / (1 - fireEnd)));
}

function facingSwitch(from: number, to: number, f: number, a = 0.4, b = 0.48) {
  if (from === to) return from;
  const k = smooth((f - a) / (b - a));
  const v = from * Math.cos(Math.PI * k);
  // Snap through the edge-on part of the turn (reads as a quick twist, not a paper-thin sliver).
  return Math.abs(v) < 0.4 ? (k < 0.5 ? from : to) * 0.4 : v;
}

function hookRope(anchor: Vec, attach: number, seed: number): RopeSpec {
  return { anchor, attach, extend: 1, retract: 0, opacity: 1, wobble: 0, seed };
}

export function sample(p: Plan, yRaw: number, t: number): Sample {
  const y = clamp(yRaw, 0, Math.max(yRaw, 0));
  const k = HERO.tangentScale;

  // ---- Intro -------------------------------------------------------------
  if (y < p.I) {
    const f = y / p.I;
    const fh = 0.14;
    const hangBody = (sway: number, crouch: number) => {
      const pose = POSES.hang.slice();
      pose[J.bKn] += 25 * crouch;
      pose[J.fKn] += 18 * crouch;
      pose[J.spine] += 10 * crouch;
      return hangAt(p.hangA, p.hangL, p.d0, t, sway, 0, pose);
    };
    if (f < fh) {
      const b = hangBody(1 - smooth(f / fh), smooth(f / fh));
      return {
        ...b, mode: "hang", ropes: [hookRope(p.hangA, 1, 0.3)],
        thwip: -1, thwipSeed: 0, wave: 0, squint: 0, grip: false,
      };
    }
    const g = (f - fh) / (1 - fh);
    const T = (1 - fh) * p.I;
    const b0 = hangBody(0, 1);
    const b1 = swingAt(p, 0, 0, t, false);
    const C0 = comWorld(b0, p.s);
    const C1 = comWorld(b1, p.s);
    const V0 = { x: p.d0 * 0.08 * T, y: -0.5 * T };
    const V1 = scale(swingVel(p, 0, 0), T * k);
    let C = hermite(C0, V0, C1, V1, g);
    C = { x: C.x, y: C.y + Math.sin(t * 2.2) * 3 * p.s * Math.sin(Math.PI * g) };
    const r1 = unwrapNear(b1.r, b0.r);
    const r = lerp(b0.r, r1, smoother((g - 0.05) / 0.75));
    const pose = flightPose(g, b0.pose, POSES.spread, b1.pose);
    const A0 = p.cycles[0].A;
    aimFrontArm(pose, sub(A0, C), r, p.d0, smooth((g - 0.42) / 0.18));
    const ropes: RopeSpec[] = [];
    if (g < 0.22) {
      const e = g / 0.22;
      ropes.push({ anchor: p.hangA, attach: 1, extend: 1, retract: easeOut(e), opacity: 1 - smooth(e), wobble: e * 0.6, seed: 0.3 });
    }
    const fs0 = 0.46;
    let thwip = -1;
    if (g > fs0) {
      const e = easeOut((g - fs0) / 0.3);
      ropes.push({ anchor: A0, attach: 0, extend: e, retract: 0, opacity: 1, wobble: 1 - e, seed: 0.7 });
      thwip = (g - fs0) / 0.32;
    }
    return {
      mode: "flight", pose, r, facing: p.d0, pivot: "com", pivotWorld: C, ropes,
      thwip: thwip <= 1 ? thwip : -1, thwipSeed: 0.5, wave: 0,
      squint: smooth((g - 0.2) / 0.15) * (1 - smooth((g - 0.45) / 0.1)), grip: false,
    };
  }

  // ---- Final rest -------------------------------------------------------
  if (y >= p.E) {
    const sway = smooth((y - p.E) / (0.15 * p.vh));
    const b = hangAt(p.finalA, p.finalL, p.finalFacing, t, sway, 1);
    return {
      ...b, mode: "final", ropes: [hookRope(p.finalA, 1, 0.9)],
      thwip: -1, thwipSeed: 0, wave: 1, squint: 0, grip: false,
    };
  }

  // ---- Cycles -------------------------------------------------------------
  const yc = y - p.I;
  const i = Math.min(p.N - 1, Math.floor(yc / p.Lc));
  const u = (yc - i * p.Lc) / p.Lc;
  const c = p.cycles[i];
  const fsw = HERO.swingFrac;

  if (u < fsw) {
    const tau = u / fsw;
    const b = swingAt(p, i, tau, t, true);
    return {
      ...b, mode: "swing", ropes: [hookRope(c.A, 0, c.seed)],
      thwip: -1, thwipSeed: 0, wave: 0, squint: 0, grip: true,
    };
  }

  // Flight
  const f = (u - fsw) / (1 - fsw);
  const T = (1 - fsw) * p.Lc;
  const rel = swingAt(p, i, 1, t, false);
  const C0 = comWorld(rel, p.s);
  const V0 = scale(swingVel(p, i, 1), T * k);
  const last = i + 1 >= p.N;

  let C1: Vec;
  let V1: Vec;
  let rEnd: number;
  let facingEnd: number;
  let endPose: Pose;
  let nextA: Vec;
  if (!last) {
    const st = swingAt(p, i + 1, 0, t, false);
    C1 = comWorld(st, p.s);
    V1 = scale(swingVel(p, i + 1, 0), T * k);
    rEnd = st.r + (c.kind === "flip" ? 360 * c.d : 0);
    facingEnd = -c.d;
    endPose = st.pose;
    nextA = p.cycles[i + 1].A;
  } else {
    const fin = hangAt(p.finalA, p.finalL, p.finalFacing, t, 0, 1);
    C1 = comWorld(fin, p.s);
    V1 = { x: 0, y: 0 };
    rEnd = 180 * c.d;
    facingEnd = p.finalFacing;
    endPose = fin.pose;
    nextA = p.finalA;
  }

  let C = hermite(C0, V0, C1, V1, f);
  const bob = Math.sin(Math.PI * f);
  C = { x: C.x, y: C.y + Math.sin(t * 2.2 + c.seed * 5) * 3.5 * p.s * bob };
  const r = lerp(rel.r, rEnd, smoother((f - 0.04) / 0.56)) + Math.sin(t * 1.4) * 3 * bob;
  const facing = facingSwitch(c.d, facingEnd, f);
  const mid = c.kind === "flip" ? POSES.tuck : POSES.spread;
  const pose = flightPose(f, rel.pose, mid, endPose, last ? 0.74 : 0.82);

  // Arm aim: old anchor while letting go, new anchor while firing.
  if (f < 0.18) aimFrontArm(pose, sub(c.A, C), r, facing, 1 - smooth(f / 0.18));
  const fireW = last ? smooth((f - 0.36) / 0.14) * (1 - smooth((f - 0.74) / 0.2)) : smooth((f - 0.42) / 0.18);
  aimFrontArm(pose, sub(nextA, C), r, facing, fireW);

  const ropes: RopeSpec[] = [];
  if (f < 0.22) {
    const e = f / 0.22;
    ropes.push({ anchor: c.A, attach: 0, extend: 1, retract: easeOut(e), opacity: 1 - smooth(e), wobble: e * 0.6, seed: c.seed });
  }
  const fireStart = last ? 0.44 : 0.54;
  let thwip = -1;
  if (f > fireStart) {
    const e = easeOut((f - fireStart) / 0.3);
    const attach = last ? smooth((f - 0.72) / 0.24) : 0;
    const nSeed = last ? 0.9 : p.cycles[i + 1].seed;
    ropes.push({ anchor: nextA, attach, extend: e, retract: 0, opacity: 1, wobble: 1 - e, seed: nSeed });
    const tp = (f - fireStart) / 0.3;
    if (tp <= 1) thwip = tp;
  }

  return {
    mode: "flight", pose, r, facing, pivot: "com", pivotWorld: C, ropes,
    thwip, thwipSeed: c.seed,
    wave: last ? smooth((f - 0.8) / 0.2) : 0,
    squint: c.kind === "flip" ? smooth((f - 0.2) / 0.12) * (1 - smooth((f - 0.48) / 0.1)) : 0,
    grip: false,
  };
}
