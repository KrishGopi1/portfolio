// Skeleton + key poses. Local character space: origin at the pelvis, y down,
// character faces +x, ~100 units tall. Every limb segment is drawn pointing
// "down" (+y) from its joint; joint angles are SVG rotations in degrees
// (positive = clockwise). For a hanging limb, negative swings it forward (+x).
import { DEG, add, lerp, rot, unwrapNear, type Vec } from "./math";

export const J = {
  spine: 0, neck: 1,
  fSh: 2, fEl: 3, fWr: 4,
  bSh: 5, bEl: 6, bWr: 7,
  fHip: 8, fKn: 9, fAn: 10,
  bHip: 11, bKn: 12, bAn: 13,
} as const;
export type JointName = keyof typeof J;
export type Pose = number[];
export const JOINT_COUNT = 14;

export const SK = {
  fShoulder: { x: -7.5, y: -29 },
  bShoulder: { x: 7, y: -30 },
  neck: { x: 1, y: -34 },
  fHip: { x: -3.8, y: 1 },
  bHip: { x: 4, y: 0 },
  upperArm: 15,
  forearm: 14,
  handTip: 4.6,
  thigh: 21,
  shin: 20,
  com: { x: 0, y: -14 } as Vec,
};

//                spine neck  fSh  fEl  fWr  bSh  bEl  bWr  fHip  fKn fAn bHip bKn bAn
export const POSES = {
  swingTop:    [ -6, -14, 180,  -8,   0, -35, -45,  10,   18,  55, 30,  32,  85, 35],
  swingBottom: [ 10,  -4, 180,  -6,   0, -65, -60,  10,  -78,  98, 25, -52, 118, 30],
  swingRise:   [ -4, -12, 180,  -6,   0,-110, -25,   0,  -68,  22, 35, -36,  62, 30],
  release:     [-14, -20, 205, -12, -20, 115, -15,   0,  -30,  30, 35,  28,  78, 35],
  tuck:        [ 28,  22, 300,-118,   0, -40,-112,   0, -120, 146, 40,-108, 150, 40],
  spread:      [-12, -14, 240, -15,   0, 125, -20,   0,  -52,  12, 35,  45,  48, 35],
  fire:        [ -6, -16, 225,   0, -38,  70, -55,   0,  -28,  72, 35,  22,  36, 35],
  hang:        [  0,  -6, 158, -22,   0,-160, -14,   0,   -3,   2, 42, -34,  78, 30],
  wave:        [  0,  -8, 100, -75, -10,-162, -14,   0,   -3,   2, 42, -34,  78, 30],
} satisfies Record<string, Pose>;

export function blend(a: Pose, b: Pose, t: number): Pose {
  const out = new Array<number>(JOINT_COUNT);
  for (let i = 0; i < JOINT_COUNT; i++) out[i] = a[i] + (b[i] - a[i]) * t;
  return out;
}

/** Forward kinematics helpers (results in root/pelvis space). */
function chain(base: Vec, angles: number[], lengths: number[], tip: Vec): Vec {
  // Walk from the tip back to the base, accumulating rotations.
  let p = tip;
  for (let i = angles.length - 1; i >= 0; i--) {
    p = rot(p, angles[i]);
    if (i > 0) p = add(p, { x: 0, y: lengths[i - 1] });
  }
  return add(base, p);
}

export function frontHand(p: Pose): Vec {
  const local = chain(SK.fShoulder, [p[J.fSh], p[J.fEl], p[J.fWr]], [SK.upperArm, SK.forearm], { x: 0.3, y: SK.handTip });
  return rot(local, p[J.spine]);
}
export function backHand(p: Pose): Vec {
  const local = chain(SK.bShoulder, [p[J.bSh], p[J.bEl], p[J.bWr]], [SK.upperArm, SK.forearm], { x: 0.3, y: SK.handTip });
  return rot(local, p[J.spine]);
}
export function frontFoot(p: Pose): Vec {
  return chain(SK.fHip, [p[J.fHip], p[J.fKn], p[J.fAn]], [SK.thigh, SK.shin], { x: 1.5, y: 1 });
}
export function frontShoulder(p: Pose): Vec {
  return rot(SK.fShoulder, p[J.spine]);
}

export type Pivot = "hand" | "foot" | "com";
export function pivotLocal(p: Pose, pivot: Pivot): Vec {
  return pivot === "hand" ? frontHand(p) : pivot === "foot" ? frontFoot(p) : SK.com;
}

/**
 * Point the front arm along a world-space direction.
 * `r` / `facing` describe the body's world orientation.
 */
export function aimFrontArm(p: Pose, dirWorld: Vec, r: number, facing: number, weight: number) {
  if (weight <= 0) return;
  const l = rot(dirWorld, -r);
  const fx = facing >= 0 ? 1 : -1;
  const torso = rot({ x: l.x * fx, y: l.y }, -p[J.spine]);
  const theta = Math.atan2(-torso.x, torso.y) / DEG;
  const cur = p[J.fSh];
  p[J.fSh] = lerp(cur, unwrapNear(theta, cur), weight);
}
