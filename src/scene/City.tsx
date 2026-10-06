// The procedural skyline: instanced buildings, rooftop water towers, ground,
// car light streaks and street lamps. Everything built once and disposed on unmount.
import { useEffect, useMemo } from "react";
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  PlaneGeometry,
  Points,
  Quaternion,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CITY, type Quality } from "./config";
import type { CityLayout } from "./cityLayout";
import { mulberry32 } from "./cityLayout";
import {
  createBuildingMaterial,
  createCarMaterial,
  createGlowMaterial,
  createGroundMaterial,
  createPropMaterials,
} from "./materials";
import type { SceneUniforms } from "./uniforms";

function waterTowerGeometry() {
  const tank = new CylinderGeometry(1, 1, 1, 14, 1, false).translate(0, 1.15, 0);
  const roof = new ConeGeometry(1.1, 0.45, 14, 1, false).translate(0, 1.875, 0);
  const legs = [-0.6, 0.6].flatMap((x) =>
    [-0.6, 0.6].map((z) => new BoxGeometry(0.12, 0.65, 0.12).translate(x, 0.325, z)),
  );
  const parts = [tank, roof, ...legs].map((g) => g.toNonIndexed());
  const merged = mergeGeometries(parts, false)!;
  [tank, roof, ...legs, ...parts].forEach((g) => g.dispose());
  return merged;
}

export default function City({ u, layout, q }: { u: SceneUniforms; layout: CityLayout; q: Quality }) {
  const built = useMemo(() => {
    const group = new Group();
    const disposables: { dispose(): void }[] = [];
    const m4 = new Matrix4();
    const quat = new Quaternion();
    const pos = new Vector3();
    const scl = new Vector3();

    // --- Buildings ---------------------------------------------------------
    const boxGeo = new BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    const n = layout.boxes.length;
    const info = new Float32Array(n * 4);
    const bMat = createBuildingMaterial(u);
    const buildings = new InstancedMesh(boxGeo, bMat, n);
    layout.boxes.forEach((b, i) => {
      m4.compose(pos.set(b.x, b.y0, b.z), quat, scl.set(b.w, b.h, b.d));
      buildings.setMatrixAt(i, m4);
      info.set([b.seed, b.kind, b.lit, b.neon], i * 4);
    });
    boxGeo.setAttribute("aInfo", new InstancedBufferAttribute(info, 4));
    buildings.instanceMatrix.needsUpdate = true;
    buildings.frustumCulled = false;
    group.add(buildings);
    disposables.push(boxGeo, bMat);

    // --- Water towers (toon fill + inverted-hull ink outline) -------------
    if (layout.waterTowers.length) {
      const wtGeo = waterTowerGeometry();
      const { fill, outline } = createPropMaterials(u);
      const count = layout.waterTowers.length;
      const fillMesh = new InstancedMesh(wtGeo, fill, count);
      const lineMesh = new InstancedMesh(wtGeo, outline, count);
      layout.waterTowers.forEach((w, i) => {
        m4.compose(pos.set(w.x, w.y, w.z), quat, scl.set(w.r, w.h / 2, w.r));
        fillMesh.setMatrixAt(i, m4);
        lineMesh.setMatrixAt(i, m4);
      });
      fillMesh.frustumCulled = lineMesh.frustumCulled = false;
      group.add(fillMesh, lineMesh);
      disposables.push(wtGeo, fill, outline);
    }

    // --- Ground ------------------------------------------------------------
    const gGeo = new PlaneGeometry(5000, 5000).rotateX(-Math.PI / 2);
    const gMat = createGroundMaterial(u);
    const ground = new Mesh(gGeo, gMat);
    ground.position.set(0, 0, -500);
    ground.frustumCulled = false;
    group.add(ground);
    disposables.push(gGeo, gMat);

    // --- Car light streaks -------------------------------------------------
    const r = mulberry32(77);
    const cGeo = new BoxGeometry(1, 1, 1);
    const cars = q.cars;
    const carAttr = new Float32Array(cars * 4);
    const lanes = [-6.6, -2.4, 2.4, 6.6];
    for (let i = 0; i < cars; i++) {
      const lane = lanes[i % 4];
      const dir = lane > 0 ? 1 : -1;
      carAttr.set([lane + (r() - 0.5) * 0.6, r() * (CITY.zStart - CITY.zEnd), 12 + r() * 14, dir], i * 4);
    }
    cGeo.setAttribute("aCar", new InstancedBufferAttribute(carAttr, 4));
    const cMat = createCarMaterial(u);
    const carMesh = new InstancedMesh(cGeo, cMat, cars);
    for (let i = 0; i < cars; i++) carMesh.setMatrixAt(i, m4.identity());
    carMesh.frustumCulled = false;
    group.add(carMesh);
    disposables.push(cGeo, cMat);

    // --- Street lamps + aircraft warning lights (glow sprites) -------------
    const glowPts: number[] = [];
    const glowAttr: number[] = [];
    for (let z = CITY.zStart; z > CITY.zEnd; z -= 24) {
      for (const s of [-1, 1]) {
        glowPts.push(s * (CITY.avenueHalf + 1), 7.5, z);
        glowAttr.push(1.6, 0, 0, 0);
      }
    }
    layout.blinkers.forEach(([x, y, z]) => {
      glowPts.push(x, y, z);
      glowAttr.push(3.2, r(), 0.55 + r() * 0.4, 1);
    });
    const glGeo = new BufferGeometry();
    glGeo.setAttribute("position", new BufferAttribute(new Float32Array(glowPts), 3));
    glGeo.setAttribute("aGlow", new BufferAttribute(new Float32Array(glowAttr), 4));
    const glMat = createGlowMaterial(u);
    const glow = new Points(glGeo, glMat);
    glow.frustumCulled = false;
    glow.renderOrder = 5;
    group.add(glow);
    disposables.push(glGeo, glMat);

    return { group, disposables };
  }, [u, layout, q]);

  useEffect(
    () => () => {
      built.disposables.forEach((d) => d.dispose());
    },
    [built],
  );

  return <primitive object={built.group} />;
}

