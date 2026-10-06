// Deterministic procedural city layout. Pure data, no three.js objects.
import { CITY, TOWERS, type Quality } from "./config";
import { createCameraCurves } from "./cameraPath";

export type Box = {
  x: number; z: number; y0: number; w: number; h: number; d: number;
  seed: number;
  /** 0 = building w/ windows, 1 = prop (no windows), 2 = iconic tower tier. */
  kind: number;
  lit: number;
  /** 0 warm, 1 cyan, 2 magenta window light. */
  neon: number;
};
export type WaterTower = { x: number; y: number; z: number; r: number; h: number };
export type Point3 = [number, number, number];
export type Anchor = { x: number; y: number; z: number; side: number };

export type CityLayout = {
  boxes: Box[];
  waterTowers: WaterTower[];
  blinkers: Point3[];
  anchors: Anchor[];
  searchlights: Point3[];
  innerX: number;
};

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rect = { x0: number; x1: number; z0: number; z1: number };
const overlaps = (a: Rect, b: Rect) => a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;

export function generateCity(q: Quality): CityLayout {
  const r = mulberry32(CITY.seed);
  const boxes: Box[] = [];
  const waterTowers: WaterTower[] = [];
  const blinkers: Point3[] = [];
  const anchors: Anchor[] = [];
  const searchlights: Point3[] = [];

  // Camera path samples for clearance.
  const curves = createCameraCurves();
  const samples: Point3[] = [];
  for (let i = 0; i <= 600; i++) {
    const p = curves.pos.getPoint(i / 600);
    samples.push([p.x, p.y, p.z]);
  }
  const maxHeightFor = (rc: Rect) => {
    let m = Infinity;
    const pad = 9;
    for (const s of samples) {
      if (s[0] > rc.x0 - pad && s[0] < rc.x1 + pad && s[2] > rc.z0 - pad && s[2] < rc.z1 + pad) {
        m = Math.min(m, s[1] - CITY.cameraClearance);
      }
    }
    return m;
  };

  const pickNeon = () => {
    const v = r();
    return v < 0.84 ? 0 : v < 0.92 ? 1 : 2;
  };

  const addProps = (x: number, z: number, top: number, w: number, d: number, tall: boolean) => {
    const inset = 1.6;
    const rx = () => x + (r() - 0.5) * Math.max(0, w - 2 * inset - 4);
    const rz = () => z + (r() - 0.5) * Math.max(0, d - 2 * inset - 4);
    if (!tall && Math.min(w, d) >= 7 && r() < 0.36) {
      const rad = 1.5 + r() * 1.0;
      waterTowers.push({ x: rx(), y: top, z: rz(), r: rad, h: 3 + r() * 1.6 });
    }
    if (r() < 0.45) {
      const n = 1 + Math.floor(r() * 2);
      for (let i = 0; i < n; i++) {
        boxes.push({ x: rx(), z: rz(), y0: top, w: 1.5 + r() * 2.5, h: 1 + r() * 1.6, d: 1.5 + r() * 2.5, seed: r(), kind: 1, lit: 0, neon: 0 });
      }
    }
    if ((tall && r() < 0.55) || r() < 0.1) {
      const ah = 6 + r() * (tall ? 22 : 10);
      const ax = rx();
      const az = rz();
      boxes.push({ x: ax, z: az, y0: top, w: 0.55, h: ah, d: 0.55, seed: r(), kind: 1, lit: 0, neon: 0 });
      if (top + ah > 60) blinkers.push([ax, top + ah + 0.6, az]);
    }
  };

  // --- Iconic towers -------------------------------------------------------
  const reserved: Rect[] = [];
  for (const t of TOWERS) {
    let y = 0;
    const seed = r();
    const neon = pickNeon();
    const lit = 0.35 + r() * 0.3;
    t.tiers.forEach(([w, d, h], i) => {
      boxes.push({ x: t.x, z: t.z, y0: y, w, d, h, seed: seed + i * 0.137, kind: 2, lit, neon });
      y += h;
    });
    const [bw, bd] = t.tiers[0];
    reserved.push({ x0: t.x - bw / 2 - 3, x1: t.x + bw / 2 + 3, z0: t.z - bd / 2 - 3, z1: t.z + bd / 2 + 3 });
    if (t.antenna) {
      boxes.push({ x: t.x, z: t.z, y0: y, w: 0.9, h: t.antenna, d: 0.9, seed: r(), kind: 1, lit: 0, neon: 0 });
      blinkers.push([t.x, y + t.antenna + 0.8, t.z]);
      // Corner blinkers on the shoulders
      const [tw, td] = t.tiers[Math.max(0, t.tiers.length - 2)];
      const ty = y - t.tiers[t.tiers.length - 1][2];
      blinkers.push([t.x - tw / 2, ty + 0.5, t.z - td / 2], [t.x + tw / 2, ty + 0.5, t.z + td / 2]);
    }
    if (t.waterTower) {
      waterTowers.push({ x: t.x + 7, y, z: t.z + 7, r: 2.4, h: 4.6 });
      boxes.push({ x: t.x - 6, z: t.z + 2, y0: y, w: 4, h: 3.2, d: 3, seed: r(), kind: 1, lit: 0, neon: 0 });
    }
    if (y > 140 && searchlights.length < 3) searchlights.push([t.x + bw * 0.25, y * 0.62, t.z]);
  }

  // --- Main grid -------------------------------------------------------------
  const P = CITY.blockZ + CITY.street;
  const rows = Math.ceil((CITY.zStart - CITY.zEnd) / P);
  const xStart = CITY.avenueHalf + CITY.sidewalk;
  const innerX = xStart + q.blocksX * (CITY.blockX + CITY.street);

  for (let zi = 0; zi < rows; zi++) {
    const bz1 = CITY.zStart - zi * P;
    const bz0 = bz1 - CITY.blockZ;
    for (const side of [-1, 1]) {
      for (let xi = 0; xi < q.blocksX; xi++) {
        const a = xStart + xi * (CITY.blockX + CITY.street);
        const bx0 = side > 0 ? a : -a - CITY.blockX;
        const bx1 = bx0 + CITY.blockX;
        // occasional park / plaza block
        if (xi > 0 && r() < 0.05) continue;
        const nz = r() < 0.5 ? 2 : 3;
        const nx = r() < 0.55 ? 1 : 2;
        // split points
        const zs = [bz0];
        for (let k = 1; k < nz; k++) zs.push(bz0 + (CITY.blockZ * k) / nz + (r() - 0.5) * 4);
        zs.push(bz1);
        const xs = [bx0];
        if (nx === 2) xs.push(bx0 + CITY.blockX * (0.4 + r() * 0.2));
        xs.push(bx1);
        for (let i = 0; i < nx; i++) {
          for (let j = 0; j < nz; j++) {
            const m = 0.6 + r() * 1.2;
            const lot: Rect = { x0: xs[i] + m, x1: xs[i + 1] - m, z0: zs[j] + m, z1: zs[j + 1] - m };
            if (reserved.some((rc) => overlaps(rc, lot))) continue;
            const w = lot.x1 - lot.x0;
            const d = lot.z1 - lot.z0;
            if (w < 4 || d < 4) continue;
            const cx = (lot.x0 + lot.x1) / 2;
            const cz = (lot.z0 + lot.z1) / 2;

            const dt = Math.exp(-(((cz - CITY.downtownZ) / CITY.downtownSpread) ** 2));
            const mt = Math.exp(-(((cz - CITY.midtownZ) / CITY.midtownSpread) ** 2)) * 0.65;
            const g = Math.max(dt, mt);
            const near = Math.exp(-Math.abs(cx) / 120);
            let h = 9 + r() ** 2 * 26 + g * Math.pow(r(), 1.5) * 118 * (0.55 + 0.45 * near) + near * r() * 16;
            if (r() < 0.035 + g * 0.08) h += 35 + r() * 55;
            h = Math.min(h, maxHeightFor(lot));
            if (h < 6) continue;

            const seed = r();
            const neon = pickNeon();
            const lit = 0.18 + r() * 0.5;
            const tall = h > 48;
            let top = h;
            let tw = w;
            let td = d;
            if (tall && r() < 0.65) {
              const nt = r() < 0.55 ? 2 : 3;
              let y = 0;
              let remaining = h;
              for (let t = 0; t < nt; t++) {
                const th = t === nt - 1 ? remaining : remaining * (0.55 + r() * 0.2);
                boxes.push({ x: cx, z: cz, y0: y, w: tw, h: th, d: td, seed: seed + t * 0.071, kind: 0, lit, neon });
                y += th;
                remaining -= th;
                const s = 0.72 + r() * 0.14;
                if (t < nt - 1) {
                  tw *= s;
                  td *= s;
                }
              }
              top = y;
            } else {
              boxes.push({ x: cx, z: cz, y0: 0, w, h, d, seed, kind: 0, lit, neon });
            }
            addProps(cx, cz, top, tw, td, tall);
            if (xi === 0 && (side > 0 ? i === 0 : i === nx - 1)) {
              anchors.push({ x: side > 0 ? lot.x0 : lot.x1, y: top, z: cz, side });
            }
            if (searchlights.length < 4 && top > 70 && cz < -300 && cz > -600 && Math.abs(cx) > 40 && r() < 0.3) {
              searchlights.push([cx, top + 1, cz]);
            }
          }
        }
      }
    }
  }

  // --- Far city ring (cheap, chunky) --------------------------------------------
  if (q.farCity) {
    const S = q.tier === "low" ? 84 : 56;
    const outer = CITY.farRingOuter;
    for (let gx = -outer; gx <= outer; gx += S) {
      for (let gz = 330; gz >= -1420; gz -= S) {
        const cx = gx + (r() - 0.5) * 14;
        const cz = gz + (r() - 0.5) * 14;
        const inInner = Math.abs(cx) < innerX + 22 && cz < CITY.zStart + 22 && cz > CITY.zEnd - 22;
        if (inInner || r() < 0.22) continue;
        const w = 18 + r() * 22;
        const d = 18 + r() * 22;
        const dt = Math.exp(-(((cz - CITY.downtownZ) / (CITY.downtownSpread * 1.6)) ** 2));
        const h = 14 + r() ** 2 * 50 + dt * r() * 90;
        boxes.push({ x: cx, z: cz, y0: 0, w, h, d, seed: r(), kind: 0, lit: 0.15 + r() * 0.35, neon: pickNeon() });
      }
    }
  }

  return { boxes, waterTowers, blinkers, anchors, searchlights, innerX };
}
