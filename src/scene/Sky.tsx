// Sky dome (gradient + Ben-Day dots + stars + halftone moon + flat comic
// clouds) and two distant skyline silhouette rings fading into haze.
import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { BackSide, CylinderGeometry, DoubleSide, Mesh, ShaderMaterial, SphereGeometry } from "three";
import { COMMON } from "./glsl";
import type { SceneUniforms } from "./uniforms";

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * viewMatrix * wp;
  gl_Position.z = gl_Position.w * 0.99999;
}`;

const SKY_FRAG = /* glsl */ `
${COMMON}
uniform float uClouds;
varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir);
  float el = d.y;
  float t = smoothstep(-0.04, 0.55, el);
  vec3 col = mix(uSkyHorizon, uSkyTop, pow(t, 0.7));
  vec2 hz = normalize(d.xz + 1e-5);
  float toward = max(dot(hz, normalize(uMoonDir.xz)), 0.0);
  float glow = pow(1.0 - t, 3.0) * (0.3 + 0.7 * toward * toward);
  col = mix(col, uHorizonGlow, glow * 0.6);

  // Ben-Day gradient dots
  float dots = halftone(gl_FragCoord.xy, 7.0 * uPR, 0.785, (1.0 - t) * 0.4 + glow * 0.25);
  col = mix(col, mix(uHorizonGlow, vec3(1.0), 0.2), dots * 0.2);

  // stars
  vec2 sp = vec2(atan(d.z, d.x), asin(clamp(el, -1.0, 1.0))) * 70.0;
  vec2 sc = floor(sp); vec2 sf = fract(sp) - 0.5;
  float sh = hash21(sc);
  vec2 so = (vec2(hash21(sc + 3.1), hash21(sc + 7.7)) - 0.5) * 0.6;
  float star = step(0.962, sh) * (1.0 - smoothstep(0.04, 0.1, length(sf - so)));
  star *= 0.55 + 0.45 * sin(uTime * (1.0 + sh * 3.0) + sh * 40.0);
  col += vec3(1.0, 0.97, 0.9) * star * uStars * smoothstep(0.06, 0.3, el);

  // moon
  float md = acos(clamp(dot(d, uMoonDir), -1.0, 1.0));
  float R = uMoonSize;
  float aa = max(fwidth(md), 1e-5);
  float disk = 1.0 - smoothstep(R - aa, R + aa, md);
  float rr = max(md - R, 0.0) / R;
  float rings = step(0.55, fract(rr * 2.4 - uTime * 0.04)) * exp(-rr * 1.1);
  float halo = exp(-rr * 1.8) * 0.55 + rings * 0.12;
  col = mix(col, mix(uMoon, uHorizonGlow, 0.25), clamp(halo, 0.0, 1.0) * (1.0 - disk) * 0.55);
  if (disk > 0.0) {
    vec3 mr = normalize(cross(uMoonDir, vec3(0.0, 1.0, 0.0)));
    vec3 mu = cross(mr, uMoonDir);
    vec2 mp = vec2(dot(d, mr), dot(d, mu)) / sin(R);
    vec3 sn = vec3(mp, sqrt(max(0.0, 1.0 - dot(mp, mp))));
    float lm = dot(sn, normalize(vec3(-0.6, 0.35, 0.72)));
    float maria = smoothstep(0.5, 0.53, fbm(mp * 2.2 + 4.0));
    float crater = 1.0 - smoothstep(0.15, 0.17, length(mp - vec2(0.32, 0.22)));
    crater += 1.0 - smoothstep(0.09, 0.11, length(mp - vec2(-0.28, -0.36)));
    crater += 1.0 - smoothstep(0.06, 0.08, length(mp - vec2(0.05, -0.55)));
    vec3 mc = mix(uMoon, uMoonShade, clamp(maria * 0.5 + crater * 0.55, 0.0, 1.0));
    float md2 = halftone(gl_FragCoord.xy, 5.0 * uPR, 0.3, smoothstep(0.25, -0.45, lm) * 0.8);
    mc = mix(mc, uMoonShade * 0.75, md2);
    float ol = smoothstep(R - 3.2 * aa, R - 2.0 * aa, md);
    mc = mix(mc, uInk, ol);
    col = mix(col, mc, disk);
  }

  // flat comic clouds
  if (uClouds > 0.5 && el > 0.0) {
    vec2 cp = d.xz / (el + 0.1) * 0.9 + vec2(uTime * 0.01, uTime * 0.004);
    float band = smoothstep(0.0, 0.06, el) * (1.0 - smoothstep(0.28, 0.5, el));
    band *= 0.55 + 0.45 * smoothstep(uMoonSize * 1.1, uMoonSize * 3.0, md);
    float m = (vnoise(cp * 0.5) * 0.62 + vnoise(cp * 1.4 + 3.0) * 0.26 + vnoise(cp * 3.6 + 7.0) * 0.12) * band;
    float th = 0.6;
    float aN = max(fwidth(m), 1e-4);
    float body = smoothstep(th - aN, th + aN, m);
    float edge = smoothstep(th - 3.2 * aN, th - 2.2 * aN, m) - body;
    float inner = smoothstep(th, th + 0.07, m);
    vec3 cc = mix(mix(uCloud, uSkyHorizon, 0.55), mix(uHorizonGlow, uMoon, 0.55), inner * 0.42);
    float cd = halftone(gl_FragCoord.xy, 5.0 * uPR, 0.785, (1.0 - inner) * 0.28);
    cc = mix(cc, uSkyTop, cd * 0.55);
    col = mix(col, uInk, clamp(edge, 0.0, 1.0) * 0.85);
    col = mix(col, cc, body);
  }
  gl_FragColor = vec4(col, 1.0);
}`;

const RING_VERT = /* glsl */ `
varying vec3 vLocal;
void main(){
  vLocal = position;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}`;

const RING_FRAG = /* glsl */ `
${COMMON}
uniform float uLayer; uniform float uMaxH; uniform float uCols;
varying vec3 vLocal;
void main(){
  float ang = atan(vLocal.z, vLocal.x) / 6.28318 + 0.5;
  float x = ang * uCols;
  float ci = floor(x);
  float hb = hash11(ci * 1.37 + uLayer * 17.0);
  float wave = 0.5 + 0.5 * sin(ang * 6.28318 * 3.0 + uLayer * 2.0);
  float h = uMaxH * (0.14 + 0.86 * pow(hb, 2.0) * (0.35 + 0.65 * wave));
  float fx = fract(x);
  float spire = step(0.92, hb) * step(abs(fx - 0.5), 0.05) * uMaxH * 0.22;
  float step2 = step(0.6, hash11(ci + 4.0)) * step(abs(fx - 0.5), 0.3) * uMaxH * 0.08;
  if (vLocal.y > h + max(spire, step2)) discard;
  vec3 col = mix(uHaze, uBldB, uLayer > 0.5 ? 0.16 : 0.34);
  vec2 wc = vec2(x * 5.0, vLocal.y / 5.0);
  vec2 wf = fract(wc);
  float wv = step(0.9, hash21(floor(wc) + ci)) * step(vLocal.y, h - 3.0);
  wv *= step(0.25, wf.x) * step(wf.x, 0.75) * step(0.3, wf.y) * step(wf.y, 0.7);
  col += uWindow * wv * (uLayer > 0.5 ? 0.12 : 0.22);
  col = mix(col, uHaze, (1.0 - smoothstep(0.0, uMaxH * 0.7, vLocal.y)) * 0.55);
  gl_FragColor = vec4(col, 1.0);
}`;

export default function Sky({ u, clouds }: { u: SceneUniforms; clouds: boolean }) {
  const { sky, rings } = useMemo(() => {
    const skyMat = new ShaderMaterial({
      uniforms: { ...u, uClouds: { value: clouds ? 1 : 0 } },
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      depthWrite: false,
      depthTest: false,
      side: BackSide,
    });
    const sky = new Mesh(new SphereGeometry(2400, 48, 24), skyMat);
    sky.renderOrder = -10;
    sky.frustumCulled = false;

    const mkRing = (radius: number, maxH: number, layer: number, cols: number) => {
      const g = new CylinderGeometry(radius, radius, maxH * 1.4, 220, 1, true);
      g.translate(0, maxH * 0.7, 0);
      const m = new ShaderMaterial({
        uniforms: { ...u, uLayer: { value: layer }, uMaxH: { value: maxH }, uCols: { value: cols } },
        vertexShader: RING_VERT,
        fragmentShader: RING_FRAG,
        side: DoubleSide,
      });
      const mesh = new Mesh(g, m);
      mesh.position.set(0, 0, -450);
      mesh.frustumCulled = false;
      mesh.renderOrder = -5;
      return mesh;
    };
    const rings = [mkRing(1900, 300, 1, 300), mkRing(1300, 210, 0, 320)];
    return { sky, rings };
  }, [u, clouds]);

  useEffect(
    () => () => {
      for (const m of [sky, ...rings]) {
        m.geometry.dispose();
        (m.material as ShaderMaterial).dispose();
      }
    },
    [sky, rings],
  );

  useFrame(({ camera }) => {
    sky.position.copy(camera.position);
  });

  return (
    <>
      <primitive object={sky} />
      {rings.map((r, i) => (
        <primitive key={i} object={r} />
      ))}
    </>
  );
}
