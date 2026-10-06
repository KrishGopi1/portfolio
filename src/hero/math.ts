export type Vec = { x: number; y: number };
/** 2D affine matrix [a b c d e f] as in SVG `matrix()`. */
export type Mat = [number, number, number, number, number, number];

export const DEG = Math.PI / 180;
export const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
export const smoother = (t: number) => {
  const x = clamp(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeOutBack = (t: number) => {
  const x = clamp(t);
  const c1 = 2.2;
  return 1 + (c1 + 1) * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

/** Deterministic 0..1 hash. */
export function hash(i: number, salt = 0) {
  const s = Math.sin(i * 127.1 + salt * 311.7 + 17.3) * 43758.5453;
  return s - Math.floor(s);
}

/** Wrap an angle (deg) into (ref-180, ref+180]. */
export function unwrapNear(a: number, ref: number) {
  let d = (a - ref) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return ref + d;
}

export const rot = (v: Vec, deg: number): Vec => {
  const c = Math.cos(deg * DEG);
  const s = Math.sin(deg * DEG);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
};
export const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a: Vec, k: number): Vec => ({ x: a.x * k, y: a.y * k });
export const vlerp = (a: Vec, b: Vec, t: number): Vec => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
export const len = (a: Vec) => Math.hypot(a.x, a.y);

/** Linear part R(deg) * S(sx, sy) with zero translation. */
export function linMat(deg: number, sx: number, sy: number): Mat {
  const c = Math.cos(deg * DEG);
  const s = Math.sin(deg * DEG);
  return [c * sx, s * sx, -s * sy, c * sy, 0, 0];
}
export function mul(m: Mat, n: Mat): Mat {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}
export const apply = (m: Mat, v: Vec): Vec => ({
  x: m[0] * v.x + m[2] * v.y + m[4],
  y: m[1] * v.x + m[3] * v.y + m[5],
});
export const applyLin = (m: Mat, v: Vec): Vec => ({ x: m[0] * v.x + m[2] * v.y, y: m[1] * v.x + m[3] * v.y });
export const matStr = (m: Mat) =>
  `matrix(${m[0].toFixed(4)} ${m[1].toFixed(4)} ${m[2].toFixed(4)} ${m[3].toFixed(4)} ${m[4].toFixed(2)} ${m[5].toFixed(2)})`;

/** Cubic Hermite interpolation. */
export function hermite(p0: Vec, v0: Vec, p1: Vec, v1: Vec, t: number): Vec {
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  return {
    x: h00 * p0.x + h10 * v0.x + h01 * p1.x + h11 * v1.x,
    y: h00 * p0.y + h10 * v0.y + h01 * p1.y + h11 * v1.y,
  };
}
