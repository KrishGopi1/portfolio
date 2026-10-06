// Tunables for the night-city background. Everything visual that is "a number
// somebody may want to tweak" lives here.

export type Vec3 = [number, number, number];

/** City grid layout (world units ~ metres). Avenue runs along -Z. */
export const CITY = {
  seed: 1962,
  avenueHalf: 9, // half-width of the main avenue (x = 0)
  sidewalk: 3,
  blockX: 26,
  blockZ: 34,
  street: 9,
  zStart: 190,
  zEnd: -1000,
  /** Outer "far city" ring of cheap, chunky buildings. */
  farRingInner: 0, // computed from blocksX at runtime
  farRingOuter: 760,
  /** Clearance kept between camera path and rooftops. */
  cameraClearance: 14,
  /** Downtown cluster centre (z) and spread. */
  downtownZ: -720,
  downtownSpread: 230,
  midtownZ: -270,
  midtownSpread: 120,
};

/** Hand-placed iconic towers. Tiers stack bottom→top: [width, depth, height]. */
export type Tower = { x: number; z: number; tiers: [number, number, number][]; antenna?: number; waterTower?: boolean };
export const TOWERS: Tower[] = [
  // Downtown king (Empire-ish)
  { x: -36, z: -700, tiers: [[32, 32, 62], [25, 25, 52], [18, 18, 58], [11, 11, 34], [5, 5, 18]], antenna: 38 },
  // Art-deco needle (Chrysler-ish)
  { x: 42, z: -772, tiers: [[26, 26, 122], [20, 20, 38], [14, 14, 24], [8, 8, 16], [3.5, 3.5, 12]], antenna: 42 },
  // Slab tower
  { x: -76, z: -858, tiers: [[36, 24, 176], [26, 16, 30]], antenna: 24 },
  // Twin-ish pair far right
  { x: 92, z: -660, tiers: [[22, 22, 150], [16, 16, 22]], antenna: 18 },
  // Midtown tower the camera weaves past
  { x: 44, z: -282, tiers: [[22, 22, 104], [16, 16, 40], [9, 9, 14]], antenna: 26 },
  { x: -46, z: -150, tiers: [[24, 20, 86], [18, 14, 26]], antenna: 14 },
  // Rooftop-vista building (camera lands on it at the contact section)
  { x: 31, z: -521, tiers: [[22, 22, 120]], waterTower: true },
];

/**
 * Camera keyframes. `p` = document scroll progress at which the camera passes
 * through the keyframe. pos/look are joined by centripetal Catmull-Rom splines.
 */
export const CAMERA_KEYS: { p: number; pos: Vec3; look: Vec3 }[] = [
  { p: 0.0, pos: [0, 176, 290], look: [10, 96, -320] }, // hero: high over the skyline
  { p: 0.09, pos: [16, 128, 180], look: [2, 52, -130] },
  { p: 0.17, pos: [5, 58, 74], look: [0, 30, -120] }, // about: diving
  { p: 0.26, pos: [-3, 25, -4], look: [3, 24, -160] }, // into the avenue
  { p: 0.36, pos: [4, 21, -112], look: [-3, 27, -262] }, // skills
  { p: 0.46, pos: [-4, 29, -222], look: [3, 36, -372] }, // projects
  { p: 0.56, pos: [3, 23, -330], look: [-2, 42, -482] },
  { p: 0.66, pos: [-3, 35, -428], look: [6, 72, -600] }, // open source
  { p: 0.78, pos: [7, 84, -476], look: [0, 112, -700] }, // interests: rising
  { p: 0.9, pos: [20, 122, -500], look: [-8, 116, -762] },
  { p: 1.0, pos: [24, 129.5, -511], look: [-14, 112, -790] }, // contact: rooftop vista
];

export const CAMERA = {
  /** Vertical FOV for landscape screens. */
  baseFov: 50,
  /** Max vertical FOV on tall phone screens. */
  maxFov: 74,
  /** Damping rate (1/s) toward the scroll target. */
  follow: 3.2,
  /** Roll (radians) per px/frame of scroll velocity, and clamp. */
  rollPerVel: 0.0035,
  rollMax: 0.13,
  /** Swing arcs: number of dips across the avenue segment and amplitude. */
  swingArcs: 7,
  swingAmp: 3.2,
  /** Mouse parallax in world units. */
  parallax: 2.2,
};

/** Post-processing defaults. */
export const FX = {
  misregBase: 0.9, // px of cyan/magenta channel offset at rest
  misregVel: 4, // extra px at full scroll speed
  velForMax: 45, // |velocity| px/frame considered "full speed"
  grain: 0.055,
  vignette: 0.42,
  dim: 0.9, // overall exposure so foreground panels stay readable
  speedLines: 0.45,
  inkLine: 1.15, // building ink-edge half-width in CSS px
};

export type MoodHex = {
  skyTop: string;
  skyHorizon: string;
  horizonGlow: string;
  haze: string;
  bldA: string;
  bldB: string;
  key: string;
  shadow: string;
  dot: string;
  rim: string;
  window: string;
  street: string;
  ground: string;
  moon: string;
  moonShade: string;
  cloud: string;
  dust: string;
  beam: string;
  stars: number;
  fog: number;
  lit: number; // window lit multiplier
};

/** One mood per SECTIONS entry (hero, about, skills, projects, opensource, interests, contact). */
export const MOODS: MoodHex[] = [
  // 0 hero — deep purple dusk
  {
    skyTop: "#0a0520", skyHorizon: "#4a1866", horizonGlow: "#ff4f9a", haze: "#331352",
    bldA: "#3b2466", bldB: "#24184a", key: "#e2c4ff", shadow: "#2a1650", dot: "#ff2bd6",
    rim: "#00e5ff", window: "#ffd27a", street: "#ff2bd6", ground: "#120a24",
    moon: "#fff6e0", moonShade: "#f2a7d8", cloud: "#2c1450", dust: "#ffb3e6", beam: "#ffe9a8",
    stars: 1, fog: 0.0011, lit: 1,
  },
  // 1 about — indigo night
  {
    skyTop: "#060826", skyHorizon: "#2c2a8c", horizonGlow: "#8a5cff", haze: "#1d1c5e",
    bldA: "#2c2f78", bldB: "#1a1a4e", key: "#b8c4ff", shadow: "#1c1a56", dot: "#7a5cff",
    rim: "#ff2bd6", window: "#ffd27a", street: "#7a5cff", ground: "#0b0b22",
    moon: "#fff6e0", moonShade: "#b7b9ff", cloud: "#1f1d5c", dust: "#c9c4ff", beam: "#d8e0ff",
    stars: 1, fog: 0.00115, lit: 1,
  },
  // 2 skills — red/magenta neon
  {
    skyTop: "#16021a", skyHorizon: "#8f0d3a", horizonGlow: "#ff2b5e", haze: "#4a0a32",
    bldA: "#5a1440", bldB: "#2e0a26", key: "#ffb0d0", shadow: "#3a0830", dot: "#ff2bd6",
    rim: "#ffd400", window: "#ffc46b", street: "#e11d2e", ground: "#16061a",
    moon: "#ffe8e0", moonShade: "#ff7a9a", cloud: "#3a0a30", dust: "#ff8ab0", beam: "#ffb0c8",
    stars: 0.7, fog: 0.0012, lit: 1.1,
  },
  // 3 projects — electric blue / cyan
  {
    skyTop: "#020520", skyHorizon: "#12308f", horizonGlow: "#00e5ff", haze: "#0c205e",
    bldA: "#183a80", bldB: "#0d1a48", key: "#a8ecff", shadow: "#0c1850", dot: "#00e5ff",
    rim: "#ff2bd6", window: "#ffe08a", street: "#00e5ff", ground: "#060c22",
    moon: "#f0fbff", moonShade: "#7fd8ff", cloud: "#0e2260", dust: "#a8f2ff", beam: "#bff6ff",
    stars: 0.9, fog: 0.00115, lit: 1.05,
  },
  // 4 open source — blue midnight
  {
    skyTop: "#01020c", skyHorizon: "#13226e", horizonGlow: "#3d6bff", haze: "#0b1444",
    bldA: "#1d2a70", bldB: "#0f1640", key: "#9fb4ff", shadow: "#0b1240", dot: "#3d6bff",
    rim: "#e8ecff", window: "#ffd27a", street: "#3d6bff", ground: "#05081a",
    moon: "#fff6e0", moonShade: "#9fb4ff", cloud: "#0f1a50", dust: "#c8d4ff", beam: "#e8ecff",
    stars: 1.2, fog: 0.00105, lit: 0.95,
  },
  // 5 interests — multiverse magenta / yellow pop
  {
    skyTop: "#12042a", skyHorizon: "#7a1a8a", horizonGlow: "#ffd400", haze: "#45155a",
    bldA: "#4a1a70", bldB: "#2a0f4a", key: "#ffc8ee", shadow: "#30104e", dot: "#ffd400",
    rim: "#00e5ff", window: "#ffd400", street: "#ff2bd6", ground: "#140826",
    moon: "#fff6e0", moonShade: "#ffd400", cloud: "#3a1458", dust: "#fff08a", beam: "#fff2a8",
    stars: 0.8, fog: 0.0011, lit: 1.1,
  },
  // 6 contact — warm sunrise
  {
    skyTop: "#241a6a", skyHorizon: "#ff7a45", horizonGlow: "#ffd400", haze: "#a8466e",
    bldA: "#7a3468", bldB: "#40205a", key: "#ffd29a", shadow: "#4a2266", dot: "#e11d2e",
    rim: "#ffd400", window: "#ffe6a0", street: "#ff9a5a", ground: "#2a1236",
    moon: "#fff6e0", moonShade: "#ffb48a", cloud: "#ff9a7a", dust: "#ffe0b0", beam: "#fff2c8",
    stars: 0.12, fog: 0.00105, lit: 0.6,
  },
];

export type Quality = {
  tier: "low" | "mid" | "high";
  blocksX: number; // blocks per side of the avenue
  farCity: boolean;
  particles: number;
  cars: number;
  msaa: number;
  maxDpr: number;
  clouds: boolean;
};

export function detectQuality(): Quality {
  const w = typeof window !== "undefined" ? window.innerWidth : 1280;
  const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 4 : 4;
  const small = w < 700;
  if (small || cores <= 2) {
    return { tier: "low", blocksX: 3, farCity: true, particles: 220, cars: 60, msaa: 0, maxDpr: 1.5, clouds: true };
  }
  if (cores <= 4) {
    return { tier: "mid", blocksX: 4, farCity: true, particles: 420, cars: 110, msaa: 0, maxDpr: 1.5, clouds: true };
  }
  return { tier: "high", blocksX: 5, farCity: true, particles: 650, cars: 160, msaa: 4, maxDpr: 1.75, clouds: true };
}
