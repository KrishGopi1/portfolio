// Shared uniform objects. Every material references the SAME {value} objects,
// so the mood controller lerps once per frame and all shaders follow.
import { Vector2, Vector3 } from "three";
import { MOODS, type MoodHex } from "./config";

/** "#rrggbb" → display-space RGB 0..1 (no colour management on purpose: the
 *  canvas runs in `linear`/`flat` mode and shaders output display values). */
export function hexToVec3(hex: string, out = new Vector3()): Vector3 {
  const n = parseInt(hex.replace("#", ""), 16);
  return out.set(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

export const COLOR_KEYS = [
  "skyTop", "skyHorizon", "horizonGlow", "haze", "bldA", "bldB", "key", "shadow", "dot", "rim",
  "window", "street", "ground", "moon", "moonShade", "cloud", "dust", "beam",
] as const satisfies readonly (keyof MoodHex)[];
export type ColorKey = (typeof COLOR_KEYS)[number];

export type MoodVec = Record<ColorKey, Vector3> & { stars: number; fog: number; lit: number };

export const MOOD_VECS: MoodVec[] = MOODS.map((m) => {
  const o = { stars: m.stars, fog: m.fog, lit: m.lit } as MoodVec;
  for (const k of COLOR_KEYS) o[k] = hexToVec3(m[k]);
  return o;
});

const uName = (k: string) => "u" + k[0].toUpperCase() + k.slice(1);

export type U<T> = { value: T };
export type SceneUniforms = Record<string, U<unknown>> & {
  uTime: U<number>;
  uPR: U<number>;
  uRes: U<Vector2>;
  uKeyDir: U<Vector3>;
  uMoonDir: U<Vector3>;
  uMoonSize: U<number>;
  uStars: U<number>;
  uFog: U<number>;
  uLit: U<number>;
  uLine: U<number>;
  uInk: U<Vector3>;
  uCamPos: U<Vector3>;
  uMotion: U<number>;
};

export function createSceneUniforms(): SceneUniforms {
  const m0 = MOOD_VECS[0];
  const u: Record<string, U<unknown>> = {
    uTime: { value: 0 },
    uPR: { value: 1 },
    uRes: { value: new Vector2(1, 1) },
    uKeyDir: { value: new Vector3(-0.62, 0.62, 0.48).normalize() },
    uMoonDir: { value: new Vector3(0.44, 0.15, -1).normalize() },
    uMoonSize: { value: 0.085 },
    uStars: { value: m0.stars },
    uFog: { value: m0.fog },
    uLit: { value: m0.lit },
    uLine: { value: 1.15 },
    uInk: { value: hexToVec3("#0b0b1a") },
    uCamPos: { value: new Vector3() },
    uMotion: { value: 1 },
  };
  for (const k of COLOR_KEYS) u[uName(k)] = { value: m0[k].clone() };
  return u as SceneUniforms;
}

export function colorUniform(u: SceneUniforms, k: ColorKey): U<Vector3> {
  return u[uName(k)] as U<Vector3>;
}

/** GLSL declarations for all shared uniforms (paste at the top of shaders). */
export const UNIFORM_DECLS = /* glsl */ `
uniform float uTime; uniform float uPR; uniform vec2 uRes;
uniform vec3 uKeyDir; uniform vec3 uMoonDir; uniform float uMoonSize;
uniform float uStars; uniform float uFog; uniform float uLit; uniform float uLine;
uniform vec3 uInk; uniform vec3 uCamPos; uniform float uMotion;
${COLOR_KEYS.map((k) => `uniform vec3 ${uName(k)};`).join("\n")}
`;
