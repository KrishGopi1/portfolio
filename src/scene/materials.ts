// All custom ShaderMaterials for the city. Colours are written in display
// space (the Canvas runs with `linear` + `flat`), no tone mapping.
import { AdditiveBlending, BackSide, DoubleSide, ShaderMaterial } from "three";
import { CITY } from "./config";
import { COMMON } from "./glsl";
import type { SceneUniforms } from "./uniforms";

const f = (n: number) => n.toFixed(3);

// ---------------------------------------------------------------------------
// Buildings: toon bands + Ben-Day shadows + procedural windows + ink edges.
// ---------------------------------------------------------------------------
const BUILDING_VERT = /* glsl */ `
attribute vec4 aInfo; // seed, kind, lit, neon
varying vec3 vM; varying vec3 vSize; varying vec3 vN; varying vec4 vInfo; varying vec3 vWorld;
void main(){
  vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
  vSize = sc;
  vM = (position + vec3(0.5, 0.0, 0.5)) * sc;
  vN = normal;
  vInfo = aInfo;
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const BUILDING_FRAG = /* glsl */ `
${COMMON}
varying vec3 vM; varying vec3 vSize; varying vec3 vN; varying vec4 vInfo; varying vec3 vWorld;
void main(){
  vec3 n = normalize(vN);
  float seed = vInfo.x; float kind = vInfo.y; float neon = vInfo.w;
  float lit = vInfo.z * uLit;
  bool wall = abs(n.y) < 0.5;
  bool xFace = abs(n.x) > 0.5;
  float u = xFace ? vM.z : vM.x;
  float faceW = xFace ? vSize.z : vSize.x;
  vec2 fm = wall ? vec2(u, vM.y) : vM.xz;
  vec2 dims = wall ? vec2(faceW, vSize.y) : vSize.xz;
  float dist = length(vWorld - cameraPosition);
  float fog = fogAmt(dist);
  // low ground haze in the distance
  fog = max(fog, exp(-vWorld.y / 26.0) * smoothstep(160.0, 900.0, dist) * 0.75);

  // ---- base colour + toon light bands
  float s1 = fract(seed * 7.13), s2 = fract(seed * 3.71);
  vec3 base = mix(uBldA, uBldB, s1) * (0.78 + 0.5 * s2);
  bool prop = kind > 0.5 && kind < 1.5;
  if (prop) base = mix(uBldB, uInk, 0.25);
  float ndl = dot(n, uKeyDir);
  float band = ndl > 0.56 ? 2.0 : (ndl > 0.05 ? 1.0 : 0.0);
  vec3 lightC = band > 1.5 ? uKey * 1.15 : (band > 0.5 ? mix(uShadow, uKey, 0.5) : uShadow * 0.9);
  vec3 col = base * lightC * 1.9;
  // moon rim on faces turned toward the moon
  col += uRim * 0.16 * step(0.35, dot(n, uMoonDir)) * (wall ? 1.0 : 0.0);
  // darker at the street, neon bounce from below
  col *= mix(0.55, 1.0, smoothstep(0.0, 55.0, vWorld.y));
  if (wall) col += uStreet * 0.3 * exp(-vWorld.y / 9.0);

  // ---- Ben-Day dots in the shadow bands
  float shade = band > 1.5 ? 0.0 : (band > 0.5 ? 0.16 : 0.42);
  float ht = halftone(gl_FragCoord.xy, 5.5 * uPR, 0.785, shade);
  col = mix(col, uDot * 0.5 + col * 0.25, ht * 0.75 * (1.0 - fog));

  // ---- windows
  vec3 emit = vec3(0.0);
  if (wall && !prop) {
    float style = kind > 1.5 ? 0.9 : fract(seed * 13.7);
    float colW = style < 0.33 ? 2.3 : (style < 0.66 ? 3.1 : 1.6);
    float floorH = style < 0.66 ? 3.4 : 3.0;
    vec2 wsz = style < 0.33 ? vec2(0.6, 0.55) : (style < 0.66 ? vec2(0.82, 0.42) : vec2(0.46, 0.7));
    float nCols = max(1.0, floor((faceW - 1.2) / colW));
    float off = (faceW - nCols * colW) * 0.5;
    vec2 cuv = vec2((u - off) / colW, (vWorld.y - 2.4) / floorH);
    vec2 cell = floor(cuv);
    vec2 fr = fract(cuv);
    float inGrid = step(0.0, cuv.x) * step(cuv.x, nCols) * step(2.6, vWorld.y) * step(vM.y, vSize.y - 1.3);
    vec2 fw = fwidth(cuv);
    vec2 dd = abs(fr - 0.5) - wsz * 0.5;
    float win = (1.0 - smoothstep(-fw.x, fw.x, dd.x)) * (1.0 - smoothstep(-fw.y, fw.y, dd.y)) * inGrid;
    float faceId = xFace ? (n.x > 0.0 ? 1.0 : 2.0) : (n.z > 0.0 ? 3.0 : 4.0);
    float h = hash21(cell + vec2(faceId * 37.0 + seed * 113.0, seed * 71.0 + faceId));
    float floorBias = hash21(vec2(cell.y * 1.3 + faceId, seed * 91.0));
    float p = lit * (0.45 + 1.1 * floorBias * floorBias);
    float on = step(h, p);
    float flick = step(0.993, hash21(cell * 1.7 + seed * 9.1 + faceId)) * step(0.5, fract(uTime * 0.06 + h * 13.0));
    on = abs(on - flick);
    vec3 wc = neon < 0.5 ? uWindow : (neon < 1.5 ? vec3(0.0, 0.9, 1.0) : vec3(1.0, 0.17, 0.84));
    wc *= 0.7 + 0.55 * hash11(h * 91.0);
    float lod = clamp((max(fw.x, fw.y) - 0.16) * 3.0, 0.0, 1.0);
    float winOn = mix(win * on, wsz.x * wsz.y * min(p, 1.0) * inGrid, lod);
    col = mix(col, uInk * 0.7 + base * 0.2, win * (1.0 - on) * (1.0 - lod) * 0.55);
    emit += wc * winOn * 1.05;
    // iconic towers: glowing crown band at the top of every tier
    if (kind > 1.5) {
      float crown = step(vSize.y - 2.4, vM.y) * step(vM.y, vSize.y - 1.2);
      emit += uRim * crown * 0.9;
    }
  }

  // ---- ink edges (constant pixel width via derivatives)
  vec2 fwm = max(fwidth(fm), vec2(1e-4));
  vec2 ed = min(fm, dims - fm) / fwm;
  float lw = uLine * uPR;
  float edge = 1.0 - smoothstep(lw - 0.75, lw + 0.75, min(ed.x, ed.y));
  col = mix(col, uInk, edge * (1.0 - fog * 0.85));

  col = mix(col, uHaze, fog);
  col += emit * (1.0 - fog * 0.7);
  gl_FragColor = vec4(col, 1.0);
}`;

export function createBuildingMaterial(u: SceneUniforms) {
  return new ShaderMaterial({
    uniforms: { ...u },
    vertexShader: BUILDING_VERT,
    fragmentShader: BUILDING_FRAG,
  });
}

// ---------------------------------------------------------------------------
// Smooth props (water towers): toon + inverted-hull outline.
// ---------------------------------------------------------------------------
const PROP_VERT = /* glsl */ `
varying vec3 vN; varying vec3 vWorld;
uniform float uOutline;
void main(){
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vec3 wn = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  if (uOutline > 0.0) {
    float d = length(wp.xyz - cameraPosition);
    wp.xyz += wn * d * 0.0021 * uOutline;
  }
  vN = wn; vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const PROP_FRAG = /* glsl */ `
${COMMON}
uniform float uOutline;
varying vec3 vN; varying vec3 vWorld;
void main(){
  float fog = fogAmt(length(vWorld - cameraPosition));
  if (uOutline > 0.0) { gl_FragColor = vec4(mix(uInk, uHaze, fog), 1.0); return; }
  vec3 n = normalize(vN);
  float ndl = dot(n, uKeyDir);
  float band = ndl > 0.45 ? 1.0 : (ndl > -0.1 ? 0.6 : 0.3);
  vec3 base = mix(uBldA, vec3(0.35, 0.2, 0.18), 0.45);
  vec3 col = base * band * 1.4;
  float ht = halftone(gl_FragCoord.xy, 5.5 * uPR, 0.785, (1.0 - band) * 0.5);
  col = mix(col, uDot * 0.5, ht * 0.6);
  col += uRim * 0.25 * step(0.4, dot(n, uMoonDir));
  gl_FragColor = vec4(mix(col, uHaze, fog), 1.0);
}`;

export function createPropMaterials(u: SceneUniforms) {
  const fill = new ShaderMaterial({
    uniforms: { ...u, uOutline: { value: 0 } },
    vertexShader: PROP_VERT,
    fragmentShader: PROP_FRAG,
  });
  const outline = new ShaderMaterial({
    uniforms: { ...u, uOutline: { value: 1.6 } },
    vertexShader: PROP_VERT,
    fragmentShader: PROP_FRAG,
    side: BackSide,
  });
  return { fill, outline };
}

// ---------------------------------------------------------------------------
// Ground: avenue markings, lamp pools, halftone.
// ---------------------------------------------------------------------------
const GROUND_VERT = /* glsl */ `
varying vec3 vWorld;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const GROUND_FRAG = /* glsl */ `
${COMMON}
varying vec3 vWorld;
void main(){
  float x = vWorld.x, z = vWorld.z;
  float ax = abs(x);
  float dist = length(vWorld - cameraPosition);
  float A = ${f(CITY.avenueHalf)};
  float S = ${f(CITY.sidewalk)};
  vec3 col = uGround;
  float onAve = step(ax, A) * step(z, ${f(CITY.zStart + 40)}) * step(${f(CITY.zEnd - 40)}, z);
  float side = step(A, ax) * step(ax, A + S);
  col = mix(col, uGround * 1.7 + 0.025, side);
  float fwx = max(fwidth(x), 1e-3);
  float fwz = max(fwidth(z), 1e-3);
  float cl = 1.0 - smoothstep(0.12 - fwx, 0.12 + fwx, abs(ax - 0.32));
  col = mix(col, uWindow * 0.85, cl * onAve);
  float dash = smoothstep(0.5 - fwz / 9.0, 0.5 + fwz / 9.0, fract(z / 9.0));
  float ld = (1.0 - smoothstep(0.1 - fwx, 0.1 + fwx, abs(ax - 4.6))) * dash;
  col = mix(col, vec3(0.8, 0.8, 0.85), ld * onAve * 0.6);
  // lamp pools
  float lz = (fract(z / 24.0) - 0.5) * 24.0;
  float lx = ax - (A + 1.0);
  float pool = exp(-(lx * lx + lz * lz) / 34.0) * onAve;
  col += uWindow * pool * 0.3;
  col += uStreet * 0.07 * onAve;
  float ht = halftone(gl_FragCoord.xy, 5.5 * uPR, 0.785, (1.0 - pool) * 0.22);
  col = mix(col, uDot * 0.3, ht * 0.45);
  float fog = max(fogAmt(dist), smoothstep(250.0, 1500.0, dist) * 0.9);
  col = mix(col, uHaze, fog);
  gl_FragColor = vec4(col, 1.0);
}`;

export function createGroundMaterial(u: SceneUniforms) {
  return new ShaderMaterial({ uniforms: { ...u }, vertexShader: GROUND_VERT, fragmentShader: GROUND_FRAG });
}

// ---------------------------------------------------------------------------
// Car light streaks running up and down the avenue (animated in the shader).
// ---------------------------------------------------------------------------
const CAR_VERT = /* glsl */ `
uniform float uTime;
attribute vec4 aCar; // laneX, offset, speed, dir
varying float vDir; varying vec3 vWorld; varying float vFront;
void main(){
  float L = ${f(CITY.zStart - CITY.zEnd)};
  float s = mod(aCar.y + uTime * aCar.z, L);
  float z = aCar.w > 0.0 ? ${f(CITY.zEnd)} + s : ${f(CITY.zStart)} - s;
  vec3 p = position * vec3(1.1, 0.55, 3.6 + aCar.z * 0.12);
  vFront = position.z * aCar.w;
  vec3 wp = vec3(aCar.x, 0.75, z) + p;
  vDir = aCar.w; vWorld = wp;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;

const CAR_FRAG = /* glsl */ `
${COMMON}
varying float vDir; varying vec3 vWorld; varying float vFront;
void main(){
  vec3 head = vec3(1.0, 0.95, 0.75);
  vec3 tail = vec3(1.0, 0.12, 0.2);
  vec3 c = vDir > 0.0 ? head : tail;
  c *= 0.7 + 0.6 * smoothstep(-0.5, 0.5, vFront);
  float fog = fogAmt(length(vWorld - cameraPosition));
  gl_FragColor = vec4(mix(c, uHaze, fog * 0.6), 1.0);
}`;

export function createCarMaterial(u: SceneUniforms) {
  return new ShaderMaterial({ uniforms: { ...u }, vertexShader: CAR_VERT, fragmentShader: CAR_FRAG });
}

// ---------------------------------------------------------------------------
// Glow sprites (street lamps, aircraft warning lights, planes).
// aGlow: size, phase, blinkRate, colour (0 lamp, 1 red, 2 white)
// ---------------------------------------------------------------------------
const GLOW_VERT = /* glsl */ `
uniform float uTime; uniform float uPR;
attribute vec4 aGlow;
varying vec3 vCol; varying float vA;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float blink = aGlow.z > 0.0 ? step(0.62, fract(uTime * aGlow.z + aGlow.y)) : 1.0;
  vA = blink;
  vCol = aGlow.w < 0.5 ? vec3(1.0, 0.82, 0.45) : (aGlow.w < 1.5 ? vec3(1.0, 0.15, 0.2) : vec3(0.9, 0.95, 1.0));
  gl_PointSize = clamp(aGlow.x * uPR * 520.0 / max(-mv.z, 1.0), 1.5 * uPR, 48.0 * uPR);
  gl_Position = projectionMatrix * mv;
}`;

const GLOW_FRAG = /* glsl */ `
varying vec3 vCol; varying float vA;
void main(){
  vec2 q = gl_PointCoord - 0.5;
  float d = length(q);
  float core = 1.0 - smoothstep(0.08, 0.16, d);
  float halo = exp(-d * d * 22.0) * 0.55;
  // little comic cross-sparkle
  float cross = (1.0 - smoothstep(0.0, 0.035, min(abs(q.x), abs(q.y)))) * (1.0 - smoothstep(0.1, 0.5, d)) * 0.6;
  float a = (core + halo + cross) * vA;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vCol, min(a, 1.0));
}`;

export function createGlowMaterial(u: SceneUniforms) {
  return new ShaderMaterial({
    uniforms: { uTime: u.uTime, uPR: u.uPR },
    vertexShader: GLOW_VERT,
    fragmentShader: GLOW_FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
}

// ---------------------------------------------------------------------------
// Searchlight beams: additive cones filled with halftone dots.
// ---------------------------------------------------------------------------
const BEAM_VERT = /* glsl */ `
varying float vAlong; varying vec3 vN; varying vec3 vWorld;
void main(){
  vAlong = position.y; // 0 at lamp, 1 at the far end (geometry is normalised)
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const BEAM_FRAG = /* glsl */ `
${COMMON}
uniform float uIntensity;
varying float vAlong; varying vec3 vN; varying vec3 vWorld;
void main(){
  vec3 v = normalize(cameraPosition - vWorld);
  float facing = abs(dot(normalize(vN), v));
  float soft = pow(facing, 1.6);
  float fall = pow(1.0 - vAlong, 1.4);
  float a = soft * fall * uIntensity * smoothstep(60.0, 260.0, length(vWorld - cameraPosition));
  float dots = halftone(gl_FragCoord.xy, 6.0 * uPR, 0.4, a * 1.6);
  vec3 c = uBeam * (a * 0.35 + dots * 0.22 * fall);
  gl_FragColor = vec4(c, 1.0);
}`;

export function createBeamMaterial(u: SceneUniforms) {
  return new ShaderMaterial({
    uniforms: { ...u, uIntensity: { value: 0.45 } },
    vertexShader: BEAM_VERT,
    fragmentShader: BEAM_FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
  });
}

// ---------------------------------------------------------------------------
// Dust / ember particles wrapping around the camera.
// ---------------------------------------------------------------------------
const DUST_VERT = /* glsl */ `
uniform float uTime; uniform float uPR; uniform vec3 uCamPos;
attribute float aSeed;
varying float vA;
void main(){
  vec3 box = vec3(140.0, 90.0, 140.0);
  vec3 drift = vec3(sin(uTime * 0.21 + aSeed * 6.0) * 3.0 + uTime * 1.6, -uTime * (1.2 + aSeed * 2.4), uTime * 0.8);
  vec3 p = mod(position + drift - uCamPos + box * 0.5, box) - box * 0.5 + uCamPos;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  float d = -mv.z;
  vA = smoothstep(2.0, 10.0, d) * (1.0 - smoothstep(45.0, 70.0, d));
  gl_PointSize = clamp((1.2 + aSeed * 1.8) * uPR * 90.0 / max(d, 1.0), 1.0, 9.0 * uPR);
  gl_Position = projectionMatrix * mv;
}`;

const DUST_FRAG = /* glsl */ `
uniform vec3 uDust;
varying float vA;
void main(){
  vec2 q = gl_PointCoord - 0.5;
  // square-ish comic speck
  float m = 1.0 - smoothstep(0.32, 0.5, max(abs(q.x), abs(q.y)));
  float a = m * vA * 0.75;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uDust, a);
}`;

export function createDustMaterial(u: SceneUniforms) {
  return new ShaderMaterial({
    uniforms: { uTime: u.uTime, uPR: u.uPR, uCamPos: u.uCamPos, uDust: u.uDust },
    vertexShader: DUST_VERT,
    fragmentShader: DUST_FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
}
