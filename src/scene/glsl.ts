// Shared GLSL helpers.
import { UNIFORM_DECLS } from "./uniforms";

export const COMMON = /* glsl */ `
${UNIFORM_DECLS}
float hash11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i), b = hash21(i + vec2(1.0, 0.0)), c = hash21(i + vec2(0.0, 1.0)), d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p){
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return s;
}
// Ben-Day dot screen. coverage 0..1 of each cell; cell in device px.
float halftone(vec2 frag, float cell, float angle, float coverage){
  float s = sin(angle), c = cos(angle);
  vec2 p = mat2(c, -s, s, c) * frag / cell;
  vec2 f = fract(p) - 0.5;
  float d = length(f);
  float r = sqrt(clamp(coverage, 0.0, 1.0) / 3.14159);
  float aa = 0.8 / cell;
  return (1.0 - smoothstep(r - aa, r + aa, d)) * step(0.002, coverage);
}
float fogAmt(float dist){ float d = dist * uFog; return 1.0 - exp(-d * d); }
float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
`;
