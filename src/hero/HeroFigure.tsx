// The rigged spider-hero, drawn in code. Original design: red mask + chest
// panel with black web lines, blue flanks/legs, red gauntlets & boots,
// angular white lenses with thick black rims, a geometric emblem and
// web-shooter bands. Every group tagged data-j is posed by the animation loop.
//
// Rendering trick: the parts are drawn twice — first as a fat ink silhouette
// (<use class="hs-outline">) for a consistent bold outer line, then as fills
// with thin interior ink lines. Colours are CSS custom properties so the
// chromatic ghosts can reuse the same geometry as flat cyan/magenta shapes.
import { SK } from "./rig";

const f = (n: number) => +n.toFixed(2);

/** Tapered, slightly muscular limb segment from (0,0) to (0,L). */
function limb(L: number, r0: number, r1: number, bo: number, bi: number) {
  return [
    `M ${f(-r0)} 0 A ${r0} ${r0} 0 0 1 ${r0} 0`,
    `C ${f(r0 + bo)} ${f(L * 0.3)} ${f(r1 + bo * 0.5)} ${f(L * 0.7)} ${r1} ${L}`,
    `A ${r1} ${r1} 0 0 1 ${f(-r1)} ${L}`,
    `C ${f(-r1 - bi * 0.5)} ${f(L * 0.7)} ${f(-r0 - bi)} ${f(L * 0.3)} ${f(-r0)} 0 Z`,
  ].join(" ");
}
/** Cel-shade band along the -x edge of a limb. */
function limbShade(L: number, r0: number, r1: number, bi: number) {
  return [
    `M ${f(-r0)} 0 C ${f(-r0 - bi)} ${f(L * 0.3)} ${f(-r1 - bi * 0.5)} ${f(L * 0.7)} ${f(-r1)} ${L}`,
    `L ${f(-r1 * 0.2)} ${f(L + r1 * 0.6)}`,
    `C ${f(-r1 * 0.35)} ${f(L * 0.7)} ${f(-r0 * 0.3)} ${f(L * 0.3)} ${f(-r0 * 0.3)} ${f(-r0 * 0.4)} Z`,
  ].join(" ");
}
/** Specular sliver along the +x edge. */
function limbHL(L: number, r0: number, r1: number) {
  return [
    `M ${f(r0 * 0.45)} ${f(L * 0.1)}`,
    `C ${f(r0 * 0.85)} ${f(L * 0.32)} ${f(r1 * 0.95)} ${f(L * 0.58)} ${f(r1 * 0.6)} ${f(L * 0.82)}`,
    `C ${f(r1 * 0.4)} ${f(L * 0.58)} ${f(r0 * 0.4)} ${f(L * 0.32)} ${f(r0 * 0.45)} ${f(L * 0.1)} Z`,
  ].join(" ");
}
/** Web pattern for a red limb segment: centre seam + sagging cross strands. */
function limbWeb(L: number, r0: number, r1: number, rows: number[]) {
  let d = `M 0.3 ${f(L * 0.06)} L 0.2 ${f(L * 0.97)}`;
  for (const t of rows) {
    const y = L * t;
    const w = lerp(r0, r1, t) + 0.35;
    d += ` M ${f(-w)} ${f(y - 0.6)} Q 0 ${f(y + 1.3)} ${f(w)} ${f(y - 0.6)}`;
  }
  return d;
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Radial web (spokes + sagging rings) centred at (cx, cy). */
function radialWeb(cx: number, cy: number, spokes: number, rings: number[], reach: number, a0 = 0) {
  let d = "";
  const angs: number[] = [];
  for (let i = 0; i < spokes; i++) angs.push(a0 + (i / spokes) * Math.PI * 2);
  for (const a of angs) d += `M ${f(cx)} ${f(cy)} L ${f(cx + Math.cos(a) * reach)} ${f(cy + Math.sin(a) * reach)} `;
  for (const r of rings) {
    for (let i = 0; i < angs.length; i++) {
      const a = angs[i];
      const b = angs[(i + 1) % angs.length] + (i + 1 === angs.length ? Math.PI * 2 : 0);
      const m = (a + b) / 2;
      const x0 = cx + Math.cos(a) * r;
      const y0 = cy + Math.sin(a) * r;
      const x1 = cx + Math.cos(b) * r;
      const y1 = cy + Math.sin(b) * r;
      const qx = cx + Math.cos(m) * r * 0.78;
      const qy = cy + Math.sin(m) * r * 0.78;
      d += `M ${f(x0)} ${f(y0)} Q ${f(qx)} ${f(qy)} ${f(x1)} ${f(y1)} `;
    }
  }
  return d.trim();
}

// ---- Geometry ------------------------------------------------------------
const UA = { L: SK.upperArm, r0: 4.3, r1: 3.2, bo: 1.1, bi: 0.5 };
const FA = { L: SK.forearm, r0: 3.4, r1: 2.6, bo: 0.9, bi: 0.3 };
const TH = { L: SK.thigh, r0: 5.5, r1: 3.8, bo: 1.4, bi: 0.8 };
const SH = { L: SK.shin, r0: 3.9, r1: 2.6, bo: 1.3, bi: 0.4 };

const TORSO =
  "M -8.6 4.5 C -9.2 -1 -7.4 -5 -6.9 -9 C -7.6 -15 -12.6 -21 -12.2 -27.5 C -11.8 -31.5 -7 -33.8 -3 -34.4 L 4.2 -34.4 C 8.2 -33.8 12.6 -31.5 12.6 -27.5 C 12.8 -21 8.2 -15 7.3 -9 C 7.8 -5 9.4 -1 8.8 4.5 C 4.5 7.4 -4.3 7.4 -8.6 4.5 Z";
const CHEST =
  "M -11.9 -26.5 C -11.6 -31 -7 -33.8 -3 -34.4 L 4.2 -34.4 C 8.2 -33.8 12.5 -31 12.4 -26.5 C 11 -19.5 6.5 -12.5 0.8 -6.2 C -4.8 -12.5 -10.3 -19.5 -11.9 -26.5 Z";
const TORSO_SHADE =
  "M -12.2 -27.5 C -12.6 -21 -7.6 -15 -6.9 -9 C -7.4 -5 -9.2 -1 -8.6 4.5 C -7 5.6 -5.6 6 -4.4 6.2 C -5.2 0 -4 -6 -4.2 -10 C -6 -16 -9.4 -21 -9.2 -28.6 C -9.2 -30.6 -8.4 -32.2 -7 -33.6 C -10 -32.6 -12 -30.4 -12.2 -27.5 Z";
const TORSO_HL = "M 11.4 -28 C 11.6 -23 8.6 -17 6.6 -11 C 7.6 -16.5 9.6 -22 9.6 -28.4 Z";
const PEC_HL = "M 4.2 -31 C 7.4 -31 9.6 -29.4 10 -27.2 C 8 -27.8 5.8 -28.8 4.2 -31 Z";
const NECK = "M -3.4 -38.5 L 4.6 -38.5 L 5.2 -32 L -3.9 -32 Z";
const ABS = "M 0.8 -6.2 L 0.9 3.2 M -4.6 -2.6 Q 0.8 -0.6 6.2 -2.6 M -6.4 3.6 Q 0.8 6.4 8 3.6";

// Emblem: an original angular spider glyph.
const EMB_BODY = "M 0.8 -27.4 L 2.5 -23.4 L 0.8 -17.6 L -0.9 -23.4 Z M 0.8 -29.4 L 1.8 -28.2 L 0.8 -27.4 L -0.2 -28.2 Z";
const embLegsHalf = [
  [[0.2, -24.6], [-3.4, -28.2], [-5, -26.6]],
  [[0.1, -23.6], [-4.8, -24.6], [-6, -23]],
  [[0.1, -22.6], [-4.6, -20.6], [-5.6, -18.6]],
  [[0.2, -21.4], [-3, -17.6], [-3.8, -15.2]],
];
const EMB_LEGS = embLegsHalf
  .flatMap((pts) => [pts, pts.map(([x, y]) => [1.6 - x, y])])
  .map((pts) => "M " + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(" L "))
  .join(" ");
const CHEST_WEB = radialWeb(0.8, -23, 10, [6.5, 11, 15.5], 20, -Math.PI / 2);

// Head (origin at neck joint).
const HEAD =
  "M -8.2 -10.5 C -8.6 -17.5 -3.8 -21.6 1.4 -21.6 C 7.4 -21.6 10.8 -16.6 10.4 -10.4 C 10.2 -5.2 7.4 -1.2 3.4 0.4 C -0.8 1.2 -5.2 -0.8 -7.2 -4.2 C -8 -6 -8.2 -8.4 -8.2 -10.5 Z";
const HEAD_SHADE =
  "M -8.2 -10.5 C -8.6 -17.5 -3.8 -21.6 1.4 -21.6 C -2.4 -20.2 -5 -16.6 -5.2 -11 C -5.4 -6.6 -4 -3 -1.2 0.6 C -3.8 0.4 -6 -1.6 -7.2 -4.2 C -8 -6 -8.2 -8.4 -8.2 -10.5 Z";
const HEAD_HL = "M 4 -20.4 C 7.6 -19.6 9.8 -16.6 10 -13 C 8.8 -15.8 6.8 -18.4 4 -20.4 Z";
const HEAD_WEB = radialWeb(4.4, -9.2, 11, [5, 9.5, 14.5], 22, -Math.PI / 2);
const EYE_NEAR =
  "M -6.4 -16 C -2.8 -16.2 1 -14.2 3.3 -11 C 2.9 -8.8 1.3 -7.5 -0.6 -7.3 C -3.6 -7.3 -6.2 -9.5 -7 -12.5 C -7.2 -14 -7.1 -15.5 -6.4 -16 Z";
const EYE_NEAR_SH =
  "M -6.4 -11.2 C -4.9 -9 -2.4 -8.1 -0.6 -8.2 C 1.1 -8.4 2.2 -9.3 2.7 -10.6 C 1.5 -9.6 -0.6 -9.2 -2.4 -9.3 C -4.1 -9.5 -5.3 -10.3 -6.4 -11.2 Z";
const EYE_FAR =
  "M 9.9 -15.4 C 10.5 -13.4 10.3 -10.4 9.2 -8.5 C 8 -7.7 6.7 -8.2 5.9 -9.5 C 5.5 -10.8 5.7 -11.7 6.2 -12.1 C 7.2 -13.6 8.5 -14.9 9.9 -15.4 Z";
const EYE_FAR_SH = "M 6.2 -10.2 C 6.9 -9 7.9 -8.6 9 -8.9 C 9.4 -9.6 9.6 -10.3 9.7 -11 C 8.9 -10.1 7.6 -9.8 6.2 -10.2 Z";

// Hand (origin at wrist), fist.
const FIST = "M -2.9 -0.6 C -3.7 1.8 -3.8 4.8 -2.5 6.8 C -1.1 8.2 1.7 8.2 3.1 6.8 C 3.9 4.9 3.7 1.6 2.9 -0.6 Z";
const FIST_LN = "M -2.4 4.4 Q 0.3 5.6 3.1 4.2 M 2.7 1.2 C 4.6 1.6 4.8 3.6 3.3 4.6";
const BAND = "M -3 11.5 L 3 11.5 L 2.9 14.3 L -2.9 14.3 Z";
// Foot (origin at ankle), pointing +x.
const FOOT = "M -2.9 -1.6 C -3.5 1.4 -2.9 3.9 -1.2 4.7 L 7.4 5 C 9.7 4.8 10.2 2.9 8.8 1.9 C 6.5 0.5 3.7 -0.9 2.3 -2.1 Z";
const FOOT_LN = "M -1.2 4.7 L 7.4 5 M 1.2 0.2 Q 3.4 2.2 6 1.6";
const SHOULDER_CAP = "M -4.3 0 A 4.3 4.3 0 0 1 4.3 0 C 4.9 2.2 5.1 4.2 4.8 6 C 1.6 4.6 -1.6 4.6 -4.6 6 C -4.8 4 -4.7 2 -4.3 0 Z";
const BOOT_CUFF = "M -4.4 3.4 L 0.2 6.2 L 4.6 3.2";

function Arm({ side }: { side: "f" | "b" }) {
  const sh = side === "f" ? SK.fShoulder : SK.bShoulder;
  return (
    <g data-j="spine">
      <g data-j={`${side}Sh`} data-x={sh.x} data-y={sh.y}>
        <path className="hs-f hs-b" d={limb(UA.L, UA.r0, UA.r1, UA.bo, UA.bi)} />
        <path className="hs-sh" d={limbShade(UA.L, UA.r0, UA.r1, UA.bi)} />
        <path className="hs-hl" d={limbHL(UA.L, UA.r0, UA.r1)} />
        <path className="hs-f hs-r" d={SHOULDER_CAP} />
        <g data-j={`${side}El`} data-x={0} data-y={UA.L}>
          <path className="hs-f hs-r" d={limb(FA.L, FA.r0, FA.r1, FA.bo, FA.bi)} />
          <path className="hs-ln" d={limbWeb(FA.L, FA.r0, FA.r1, [0.28, 0.55, 0.8])} />
          <path className="hs-sh" d={limbShade(FA.L, FA.r0, FA.r1, FA.bi)} />
          <path className="hs-hl" d={limbHL(FA.L, FA.r0, FA.r1)} />
          <path className="hs-f hs-dk" d={BAND} />
          <circle className="hs-glow" cx={0.8} cy={12.9} r={0.75} />
          <g data-j={`${side}Wr`} data-x={0} data-y={FA.L}>
            <path className="hs-f hs-r" d={FIST} />
            <path className="hs-ln" d={FIST_LN} />
          </g>
        </g>
      </g>
    </g>
  );
}

function Leg({ side }: { side: "f" | "b" }) {
  const hp = side === "f" ? SK.fHip : SK.bHip;
  return (
    <g data-j={`${side}Hip`} data-x={hp.x} data-y={hp.y}>
      <path className="hs-f hs-b" d={limb(TH.L, TH.r0, TH.r1, TH.bo, TH.bi)} />
      <path className="hs-sh" d={limbShade(TH.L, TH.r0, TH.r1, TH.bi)} />
      <path className="hs-hl" d={limbHL(TH.L, TH.r0, TH.r1)} />
      <g data-j={`${side}Kn`} data-x={0} data-y={TH.L}>
        <path className="hs-f hs-r" d={limb(SH.L, SH.r0, SH.r1, SH.bo, SH.bi)} />
        <path className="hs-ln" d={limbWeb(SH.L, SH.r0, SH.r1, [0.3, 0.55, 0.78])} />
        <path className="hs-ln hs-ln-b" d={BOOT_CUFF} />
        <path className="hs-sh" d={limbShade(SH.L, SH.r0, SH.r1, SH.bi)} />
        <path className="hs-hl" d={limbHL(SH.L, SH.r0, SH.r1)} />
        <g data-j={`${side}An`} data-x={0} data-y={SH.L}>
          <path className="hs-f hs-r" d={FOOT} />
          <path className="hs-ln" d={FOOT_LN} />
        </g>
      </g>
    </g>
  );
}

export function HeroDefs() {
  return (
    <>
      <clipPath id="hs-clip-head">
        <path d={HEAD} />
      </clipPath>
      <clipPath id="hs-clip-chest">
        <path d={CHEST} />
      </clipPath>
    </>
  );
}

/** The articulated body. Lives inside #hs-body (referenced by ghost copies). */
export function HeroParts() {
  return (
    <g id="hs-parts">
      <Arm side="b" />
      <Leg side="b" />
      <g data-j="spine">
        <path className="hs-f hs-r" d={NECK} />
        <path className="hs-f hs-b" d={TORSO} />
        <path className="hs-f hs-r" d={CHEST} />
        <path className="hs-ln" d={CHEST_WEB} clipPath="url(#hs-clip-chest)" />
        <path className="hs-ln" d={ABS} />
        <path className="hs-sh" d={TORSO_SHADE} />
        <path className="hs-hl" d={TORSO_HL} />
        <path className="hs-hl" d={PEC_HL} />
        <path className="hs-k" d={EMB_BODY} />
        <path className="hs-ln hs-ln-b" d={EMB_LEGS} />
        <g data-j="neck" data-x={SK.neck.x} data-y={SK.neck.y}>
          <g transform="scale(1.1)">
          <path className="hs-f hs-r" d={HEAD} />
          <path className="hs-ln" d={HEAD_WEB} clipPath="url(#hs-clip-head)" />
          <path className="hs-sh" d={HEAD_SHADE} />
          <path className="hs-hl" d={HEAD_HL} />
          <g data-hs="eyes">
            <path className="hs-lens" d={EYE_NEAR} />
            <path className="hs-lens2" d={EYE_NEAR_SH} />
            <path className="hs-lens" d={EYE_FAR} />
            <path className="hs-lens2" d={EYE_FAR_SH} />
          </g>
          </g>
        </g>
      </g>
      <Leg side="f" />
      <Arm side="f" />
    </g>
  );
}

/** Comic SFX starburst for the web-fire. */
export function burstPoints(n = 14, r0 = 30, r1 = 17) {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const jitter = 1 + 0.18 * Math.sin(i * 12.9898);
    const r = (i % 2 === 0 ? r0 : r1) * jitter;
    pts.push(`${f(Math.cos(a) * r * 1.35)},${f(Math.sin(a) * r)}`);
  }
  return pts.join(" ");
}
