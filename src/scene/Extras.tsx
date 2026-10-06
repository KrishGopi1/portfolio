// Atmosphere extras: web strands between rooftops, sweeping halftone
// searchlights, drifting dust specks and blinking aircraft.
import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  CylinderGeometry,
  Group,
  LinearSRGBColorSpace,
  Mesh,
  Points,
  Quaternion,
  Vector3,
} from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import type { Quality } from "./config";
import { mulberry32, type CityLayout } from "./cityLayout";
import { createBeamMaterial, createDustMaterial, createGlowMaterial } from "./materials";
import type { SceneUniforms } from "./uniforms";

function buildWebs(layout: CityLayout) {
  const r = mulberry32(4242);
  const left = layout.anchors.filter((a) => a.side < 0 && a.y > 18 && a.z < 80 && a.z > -640);
  const right = layout.anchors.filter((a) => a.side > 0 && a.y > 18 && a.z < 80 && a.z > -640);
  const segs: number[] = [];
  const cols: number[] = [];
  const used = new Set<number>();
  const strand = (ax: number, ay: number, az: number, bx: number, by: number, bz: number, sag: number, bright: number) => {
    const N = 14;
    let px = ax, py = ay, pz = az;
    for (let i = 1; i <= N; i++) {
      const t = i / N;
      const x = ax + (bx - ax) * t;
      const z = az + (bz - az) * t;
      const y = ay + (by - ay) * t - sag * 4 * t * (1 - t);
      segs.push(px, py, pz, x, y, z);
      cols.push(0.91 * bright, 0.93 * bright, 1.0 * bright, 0.91 * bright, 0.93 * bright, 1.0 * bright);
      px = x; py = y; pz = z;
    }
  };
  for (const a of left) {
    if (r() > 0.3) continue;
    let best = -1;
    let bd = 1e9;
    right.forEach((b, j) => {
      const dz = Math.abs(b.z - a.z);
      if (!used.has(j) && dz < 30 && dz < bd) {
        bd = dz;
        best = j;
      }
    });
    if (best < 0) continue;
    used.add(best);
    const b = right[best];
    const span = Math.hypot(b.x - a.x, b.z - a.z);
    const sag = 2 + span * 0.12 + r() * 3;
    strand(a.x, a.y, a.z, b.x, b.y, b.z, sag, 1);
    // a second, looser strand for a web-like doubled look
    if (r() < 0.5) strand(a.x, a.y - 0.5, a.z + 1.5, b.x, b.y - 0.5, b.z - 1.5, sag * 1.5, 0.6);
    // and an anchor line dropping to a lower rooftop corner
    if (r() < 0.5) strand(a.x, a.y, a.z, a.x - 6, Math.max(6, a.y - 18), a.z - 10, 1.5, 0.55);
  }
  return { segs, cols };
}

export default function Extras({ u, layout, q }: { u: SceneUniforms; layout: CityLayout; q: Quality }) {
  const size = useThree((s) => s.size);

  const built = useMemo(() => {
    const group = new Group();
    const disposables: { dispose(): void }[] = [];

    // --- Web strands
    const { segs, cols } = buildWebs(layout);
    const webGeo = new LineSegmentsGeometry();
    webGeo.setPositions(segs);
    webGeo.setColors(cols);
    const webMat = new LineMaterial({ linewidth: 1.2, vertexColors: true, transparent: true, opacity: 0.6 });
    webMat.color.setRGB(1, 1, 1, LinearSRGBColorSpace);
    const webs = new LineSegments2(webGeo, webMat);
    webs.frustumCulled = false;
    webs.renderOrder = 4;
    group.add(webs);
    disposables.push(webGeo, webMat);

    // --- Searchlights
    const beamGeo = new CylinderGeometry(1, 0.03, 1, 28, 1, true).translate(0, 0.5, 0);
    const beamMat = createBeamMaterial(u);
    const beams = layout.searchlights.map(([x, y, z]) => {
      const m = new Mesh(beamGeo, beamMat);
      m.position.set(x, y, z);
      m.scale.set(46, 950, 46);
      m.frustumCulled = false;
      m.renderOrder = 6;
      group.add(m);
      return m;
    });
    disposables.push(beamGeo, beamMat);

    // --- Dust
    const r = mulberry32(99);
    const dn = q.particles;
    const dPos = new Float32Array(dn * 3);
    const dSeed = new Float32Array(dn);
    for (let i = 0; i < dn; i++) {
      dPos.set([r() * 140, r() * 90, r() * 140], i * 3);
      dSeed[i] = r();
    }
    const dGeo = new BufferGeometry();
    dGeo.setAttribute("position", new BufferAttribute(dPos, 3));
    dGeo.setAttribute("aSeed", new BufferAttribute(dSeed, 1));
    const dMat = createDustMaterial(u);
    const dust = new Points(dGeo, dMat);
    dust.frustumCulled = false;
    dust.renderOrder = 7;
    group.add(dust);
    disposables.push(dGeo, dMat);

    // --- Aircraft (2 planes × red/white lights), moved on the CPU
    const planes = 2;
    const aPos = new Float32Array(planes * 2 * 3);
    const aGlow = new Float32Array(planes * 2 * 4);
    for (let i = 0; i < planes; i++) {
      aGlow.set([5, i * 0.3, 1.1, 1], i * 8);
      aGlow.set([4, i * 0.3 + 0.5, 0.8, 2], i * 8 + 4);
    }
    const aGeo = new BufferGeometry();
    const aPosAttr = new BufferAttribute(aPos, 3);
    aGeo.setAttribute("position", aPosAttr);
    aGeo.setAttribute("aGlow", new BufferAttribute(aGlow, 4));
    const aMat = createGlowMaterial(u);
    const aircraft = new Points(aGeo, aMat);
    aircraft.frustumCulled = false;
    aircraft.renderOrder = 8;
    group.add(aircraft);
    disposables.push(aGeo, aMat);

    return { group, disposables, webMat, beams, aPosAttr };
  }, [u, layout, q]);

  useEffect(() => {
    built.webMat.resolution.set(size.width, size.height);
  }, [built, size]);

  useEffect(
    () => () => {
      built.disposables.forEach((d) => d.dispose());
    },
    [built],
  );

  const tmp = useMemo(() => ({ up: new Vector3(0, 1, 0), dir: new Vector3(), q: new Quaternion() }), []);

  useFrame(() => {
    const t = u.uTime.value;
    built.beams.forEach((m, i) => {
      const az = t * 0.22 * (i % 2 ? -1 : 1) + i * 2.1;
      const tilt = 0.32 + 0.16 * Math.sin(t * 0.37 + i * 1.7);
      tmp.dir.set(Math.sin(tilt) * Math.cos(az), Math.cos(tilt), Math.sin(tilt) * Math.sin(az));
      m.quaternion.setFromUnitVectors(tmp.up, tmp.dir);
    });
    const a = built.aPosAttr.array as Float32Array;
    for (let i = 0; i < 2; i++) {
      const R = 900 + i * 260;
      const w = (i ? -1 : 1) * 0.018;
      const ang = t * w + i * 2.4;
      const x = Math.cos(ang) * R;
      const z = -500 + Math.sin(ang) * R * 0.6;
      const y = 330 + i * 70;
      a.set([x, y, z, x + Math.cos(ang + 1.57) * 6, y, z + Math.sin(ang + 1.57) * 6], i * 6);
    }
    built.aPosAttr.needsUpdate = true;
  });

  return <primitive object={built.group} />;
}
