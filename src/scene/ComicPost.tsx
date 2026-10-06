// Comic print post-process: cyan/magenta misregistration that grows with
// scroll speed, radial speed lines, paper grain, vignette, exposure trim.
import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { UnsignedByteType, Vector2, WebGLRenderTarget } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { scrollState } from "../store/scroll";
import { FX, type Quality } from "./config";
import type { SceneUniforms } from "./uniforms";

const ComicShader = {
  uniforms: {
    tDiffuse: { value: null },
    uRes: { value: new Vector2(1, 1) },
    uTime: { value: 0 },
    uMis: { value: FX.misregBase },
    uSpeed: { value: 0 },
    uGrain: { value: FX.grain },
    uVig: { value: FX.vignette },
    uDim: { value: FX.dim },
    uPR: { value: 1 },
  },
  vertexShader: /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uTime; uniform float uMis;
uniform float uSpeed; uniform float uGrain; uniform float uVig; uniform float uDim; uniform float uPR;
varying vec2 vUv;
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
void main(){
  vec2 px = 1.0 / uRes;
  vec2 q = vUv - 0.5;
  // misregistration: offset the cyan & magenta plates in opposite directions,
  // a bit stronger towards the frame edges
  vec2 dir = normalize(vec2(1.0, 0.45)) * (0.6 + 0.8 * length(q));
  vec2 off = dir * uMis * uPR * px;
  // cyan plate (R) shifts one way, magenta plate (G) a little the other way
  vec3 c = texture2D(tDiffuse, vUv).rgb;
  float r = texture2D(tDiffuse, vUv + off).r;
  float g = texture2D(tDiffuse, vUv - off * 0.45).g;
  vec3 col = vec3(r, g, c.b);

  // radial comic speed lines when scrolling fast
  vec2 qa = q * vec2(uRes.x / uRes.y, 1.0);
  float rad = length(qa);
  if (uSpeed > 0.001) {
    float ang = atan(qa.y, qa.x) / 6.28318 + 0.5;
    float bins = 140.0;
    float id = floor(ang * bins);
    float hsh = h21(vec2(id, floor(uTime * 14.0)));
    float w = fract(ang * bins);
    float line = step(0.82, hsh) * (1.0 - smoothstep(0.0, 0.35, abs(w - 0.5)));
    float reach = smoothstep(0.32 + hsh * 0.2, 0.75, rad);
    col = mix(col, vec3(0.91, 0.93, 1.0), line * reach * uSpeed * 0.35);
  }

  // paper grain + faint fibre
  float grain = h21(gl_FragCoord.xy + floor(uTime * 12.0) * 17.13) - 0.5;
  col += grain * uGrain;
  col *= 1.0 - uVig * smoothstep(0.35, 0.95, rad);
  col *= uDim;
  gl_FragColor = vec4(col, 1.0);
}`,
};

export default function ComicPost({ u, q }: { u: SceneUniforms; q: Quality }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);

  const post = useMemo(() => {
    const rt = new WebGLRenderTarget(2, 2, { type: UnsignedByteType, samples: q.msaa });
    const composer = new EffectComposer(gl, rt);
    const renderPass = new RenderPass(scene, camera);
    const comic = new ShaderPass(ComicShader);
    composer.addPass(renderPass);
    composer.addPass(comic);
    return { composer, renderPass, comic, rt, vel: 0 };
  }, [gl, scene, camera, q.msaa]);

  useEffect(() => {
    post.composer.setPixelRatio(dpr);
    post.composer.setSize(size.width, size.height);
    post.comic.uniforms.uRes.value.set(size.width * dpr, size.height * dpr);
    post.comic.uniforms.uPR.value = dpr;
    u.uPR.value = dpr;
    u.uRes.value.set(size.width * dpr, size.height * dpr);
  }, [post, size, dpr, u]);

  useEffect(
    () => () => {
      post.renderPass.dispose();
      post.comic.dispose();
      post.composer.dispose();
      post.rt.dispose();
    },
    [post],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const reduced = scrollState.reducedMotion;
    const v = reduced ? 0 : Math.min(1, Math.abs(scrollState.velocity) / FX.velForMax);
    post.vel += (v - post.vel) * (1 - Math.exp(-dt * 6));
    const un = post.comic.uniforms;
    un.uMis.value = FX.misregBase + FX.misregVel * post.vel;
    const s = Math.min(1, Math.max(0, (post.vel - 0.3) / 0.6));
    un.uSpeed.value = s * s * FX.speedLines;
    un.uTime.value = u.uTime.value;
    post.composer.render(dt);
  }, 1);

  return null;
}
