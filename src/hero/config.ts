// Tunables for the swinging hero. Distances are in viewport units (vw / vh
// fractions) unless noted; the timeline is measured in scroll pixels.
export const HERO = {
  /** Character height in CSS px (head top to toe, standing). */
  heightDesktop: 150,
  heightMobile: 92,
  mobileBreakpoint: 700,

  /** Scroll length (in vh) of the intro: hanging -> drop -> first web. */
  introVh: 0.6,
  /** Scroll left over at the bottom where he rests in the final pose (vh). */
  tailVh: 0.3,
  /** Target scroll distance per swing cycle (vh). Rounded so cycles fit exactly. */
  cycleVh: 0.95,
  /** Fraction of a cycle spent on the rope; the rest is release + flight. */
  swingFrac: 0.58,

  /** Pendulum amplitude range (deg), picked per cycle. */
  phiMinDeg: 50,
  phiMaxDeg: 68,
  /** Normalised pendulum phase where the swing starts (0 = at rest at extreme). */
  startW: 0.07,
  /** Release when the rope angle reaches this fraction of the amplitude (on the far side). */
  releaseFrac: 0.82,

  /** Lowest hand point of each arc (vh), random in this range. */
  bottomMinVh: 0.36,
  bottomMaxVh: 0.46,
  /** Anchors never sit lower than this (vh) — they live at/above the top edge. */
  anchorMaxVh: 0.04,

  /** Horizontal extents of the zig-zag (vw). */
  leftReleaseVw: [0.15, 0.26] as const,
  rightReleaseVw: [0.74, 0.85] as const,
  overshootVw: [0.04, 0.08] as const,

  /** Idle hang at top / final hang at bottom. */
  hangXVw: 0.84,
  hangDropVh: 0.1,
  finalLeftVw: 0.17,
  finalRightVw: 0.83,

  /** Flight curve tangent scale (lower = flatter arcs). */
  tangentScale: 0.8,

  /** Character pose update rate ("on twos"); position stays at display rate. */
  poseFps: 12,
};
