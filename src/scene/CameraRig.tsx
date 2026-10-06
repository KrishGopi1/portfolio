// Scroll-driven camera: damped progress → Catmull-Rom position/look splines,
// swing arcs, velocity bank, light mouse parallax, aspect-aware FOV.
import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Vector2, Vector3 } from "three";
import { scrollState } from "../store/scroll";
import { CAMERA } from "./config";
import { createCameraCurves, swingEnvelope } from "./cameraPath";
import type { SceneUniforms } from "./uniforms";

/** Progress used for each section when reduced motion is on (static framing). */
const SECTION_P = [0, 0.17, 0.36, 0.46, 0.66, 0.78, 1];

export default function CameraRig({ u }: { u: SceneUniforms }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);

  const st = useMemo(
    () => ({
      curves: createCameraCurves(),
      p: 0,
      init: false,
      roll: 0,
      pos: new Vector3(),
      look: new Vector3(),
      mouse: new Vector2(),
      mouseT: new Vector2(),
    }),
    [],
  );

  // Aspect-aware FOV: keep roughly the landscape horizontal coverage on tall screens.
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const base = (CAMERA.baseFov * Math.PI) / 180;
    let fov = CAMERA.baseFov;
    const refAspect = 1.3;
    if (aspect < refAspect) {
      const h = 2 * Math.atan(Math.tan(base / 2) * refAspect);
      fov = Math.min(CAMERA.maxFov, (2 * Math.atan(Math.tan(h / 2) / aspect) * 180) / Math.PI);
    }
    camera.fov = fov;
    // keep the moon inside the frame on narrow screens
    const k = Math.min(1, Math.max(0.15, aspect / 1.7));
    u.uMoonDir.value.set(0.44 * k, 0.15, -1).normalize();
    camera.near = 1;
    camera.far = 6000;
    camera.updateProjectionMatrix();
  }, [camera, size, u]);

  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(pointer: coarse)").matches) return;
    const onMove = (e: PointerEvent) => {
      st.mouseT.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [st]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const reduced = scrollState.reducedMotion;
    const target = reduced
      ? SECTION_P[Math.min(SECTION_P.length - 1, Math.max(0, scrollState.sectionIndex))] ?? 0
      : scrollState.progress;
    if (!st.init || reduced) {
      st.p = target;
      st.init = true;
    } else {
      st.p += (target - st.p) * (1 - Math.exp(-dt * CAMERA.follow));
    }

    const uu = st.curves.toU(st.p);
    st.curves.pos.getPoint(uu, st.pos);
    st.curves.look.getPoint(uu, st.look);

    if (!reduced) {
      // swing arcs while gliding the avenue
      const env = swingEnvelope(st.p);
      if (env > 0) {
        const ph = ((st.p - 0.2) / 0.5) * CAMERA.swingArcs;
        const fr = ph - Math.floor(ph);
        st.pos.y -= Math.sin(fr * Math.PI) * CAMERA.swingAmp * env;
      }
      st.mouse.lerp(st.mouseT, 1 - Math.exp(-dt * 2));
      const t = state.clock.elapsedTime;
      st.pos.x += st.mouse.x * CAMERA.parallax;
      st.pos.y += -st.mouse.y * CAMERA.parallax * 0.5 + Math.sin(t * 0.45) * 0.35;
      st.look.x += st.mouse.x * CAMERA.parallax * 2;
    }

    camera.position.copy(st.pos);
    camera.lookAt(st.look);
    const v = reduced ? 0 : scrollState.velocity;
    const rollT = Math.max(-CAMERA.rollMax, Math.min(CAMERA.rollMax, -v * CAMERA.rollPerVel));
    st.roll += (rollT - st.roll) * (1 - Math.exp(-dt * 4));
    camera.rotateZ(st.roll);
    u.uCamPos.value.copy(camera.position);
  });

  return null;
}

