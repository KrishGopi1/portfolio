// Scroll-progress → camera position / look target, via centripetal Catmull-Rom
// splines through CAMERA_KEYS. Keyframe i is hit exactly at progress keys[i].p.
import { CatmullRomCurve3, Vector3 } from "three";
import { CAMERA_KEYS } from "./config";

export type CameraCurves = {
  pos: CatmullRomCurve3;
  look: CatmullRomCurve3;
  /** Map scroll progress (0..1) to the spline parameter (0..1). */
  toU: (p: number) => number;
};

export function createCameraCurves(): CameraCurves {
  const pos = new CatmullRomCurve3(CAMERA_KEYS.map((k) => new Vector3(...k.pos)), false, "centripetal");
  const look = new CatmullRomCurve3(CAMERA_KEYS.map((k) => new Vector3(...k.look)), false, "centripetal");
  const n = CAMERA_KEYS.length;
  const toU = (p: number) => {
    const c = Math.min(1, Math.max(0, p));
    for (let i = 0; i < n - 1; i++) {
      const a = CAMERA_KEYS[i].p;
      const b = CAMERA_KEYS[i + 1].p;
      if (c <= b || i === n - 2) {
        const t = b > a ? Math.min(1, Math.max(0, (c - a) / (b - a))) : 0;
        return (i + t) / (n - 1);
      }
    }
    return 1;
  };
  return { pos, look, toU };
}

/** Envelope (0..1) for the swing arcs: only while gliding down the avenue. */
export function swingEnvelope(p: number): number {
  const a = smooth(0.2, 0.3, p);
  const b = 1 - smooth(0.6, 0.7, p);
  return a * b;
}

export function smooth(e0: number, e1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}
