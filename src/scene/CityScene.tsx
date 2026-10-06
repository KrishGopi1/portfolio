// Everything inside the <Canvas>: shared uniforms, mood blending, camera,
// sky, city, extras, post-processing and a tiny adaptive-DPR governor.
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { scrollState } from "../store/scroll";
import { FX, type Quality } from "./config";
import { generateCity } from "./cityLayout";
import { COLOR_KEYS, MOOD_VECS, colorUniform, createSceneUniforms, type SceneUniforms } from "./uniforms";
import CameraRig from "./CameraRig";
import Sky from "./Sky";
import City from "./City";
import Extras from "./Extras";
import ComicPost from "./ComicPost";

function MoodController({ u }: { u: SceneUniforms }) {
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    if (import.meta.env.DEV) {
      const dbg = (window as unknown as { __cityDebug?: Partial<typeof scrollState> }).__cityDebug;
      if (dbg) Object.assign(scrollState, dbg);
    }
    const reduced = scrollState.reducedMotion;
    const idx = Math.min(MOOD_VECS.length - 1, Math.max(0, scrollState.sectionIndex | 0));
    const m = MOOD_VECS[idx];
    const k = reduced ? 1 : 1 - Math.exp(-dt * 1.5);
    for (const key of COLOR_KEYS) colorUniform(u, key).value.lerp(m[key], k);
    u.uStars.value += (m.stars - u.uStars.value) * k;
    u.uFog.value += (m.fog - u.uFog.value) * k;
    u.uLit.value += (m.lit - u.uLit.value) * k;
    if (!reduced) u.uTime.value += dt;
  });
  return null;
}

/** Drops the DPR in 0.25 steps if frames are consistently slow. */
function DprGovernor() {
  const setDpr = useThree((s) => s.setDpr);
  const acc = useRef({ t: 0, n: 0, slow: 0, warm: 0 });
  useFrame((state, delta) => {
    const a = acc.current;
    // ignore the first seconds (shader compilation / layout hitches)
    if (a.warm < 4) {
      a.warm += delta;
      return;
    }
    a.t += delta;
    a.n++;
    if (a.t >= 1.5) {
      const avg = a.t / a.n;
      a.slow = avg > 1 / 45 ? a.slow + 1 : 0;
      const dpr = state.viewport.dpr;
      if (a.slow >= 2 && dpr > 1) {
        setDpr(Math.max(1, Math.round((dpr - 0.25) * 4) / 4));
        a.slow = 0;
      }
      a.t = 0;
      a.n = 0;
    }
  });
  return null;
}

export default function CityScene({ q }: { q: Quality }) {
  const u = useMemo(() => {
    const un = createSceneUniforms();
    un.uLine.value = FX.inkLine;
    return un;
  }, []);
  const layout = useMemo(() => generateCity(q), [q]);

  return (
    <>
      <MoodController u={u} />
      <CameraRig u={u} />
      <Sky u={u} clouds={q.clouds} />
      <City u={u} layout={layout} q={q} />
      <Extras u={u} layout={layout} q={q} />
      <ComicPost u={u} q={q} />
      <DprGovernor />
    </>
  );
}
