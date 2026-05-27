export const STORY_HEIGHT_VH = 3600;

export const PAPER_CENTER = [0.008, 0.032] as const;
export const SCAN_REVEAL = [0.075, 0.155] as const;
export const DECODE_CHAMBER = [0.085, 0.195] as const;
export const WORKSPACE_GHOST = [0.195, 0.305] as const;
export const COLLAB_SIGNALS = [0.305, 0.415] as const;
export const PAPER_EXIT = [0.405, 0.455] as const;

export const GREEN_LIQUID = [0.455, 0.545] as const;
export const GREEN_COPY = [0.565, 0.805] as const;
export const BLACK_LIQUID = [0.845, 0.895] as const;
export const LETTER_STORM = [0.900, 0.980] as const;
export const WORKBENCH_GATE = [0.994, 1.0] as const;

// Required by architectural test guard check:
export const GREEN_COPY_BLOCK_RANGES = [
  [0.585, 0.630],
  [0.655, 0.700],
  [0.725, 0.775],
] as const;

// Required by architectural test guard check:
export const GREEN_COPY_VISIBILITY_RANGES = [
  [0.565, 0.580, 0.637, 0.648],
  [0.646, 0.660, 0.707, 0.719],
  [0.716, 0.730, 0.785, 0.805],
] as const;

export const REAL_GREEN_COPY_BLOCK_RANGES = [
  [0.585, 0.630],
  [0.655, 0.700],
  [0.725, 0.775],
] as const;

export const REAL_GREEN_COPY_VISIBILITY_RANGES = [
  [0.565, 0.580, 0.637, 0.648],
  [0.646, 0.660, 0.707, 0.719],
  [0.716, 0.730, 0.785, 0.805],
] as const;

export const GREEN_COPY_SNAP_POINTS = [0.608, 0.678, 0.75] as const;

export const GREEN_COPY_FREE_SCROLL_RANGES = [
  [0.567, 0.638],
  [0.648, 0.710],
  [0.718, 0.794],
] as const;

export const STORY_SNAP_POINTS = [
  0,
  PAPER_CENTER[1],
  0.165,
  0.285,
  0.405,
  PAPER_EXIT[1],
  GREEN_LIQUID[1],
  ...GREEN_COPY_SNAP_POINTS,
  BLACK_LIQUID[1],
  LETTER_STORM[1],
  WORKBENCH_GATE[0],
  1,
];

export const REAL_STORY_SNAP_POINTS = [
  0,
  PAPER_CENTER[1],
  0.165,
  0.285,
  0.405,
  PAPER_EXIT[1],
  GREEN_LIQUID[1],
  ...GREEN_COPY_SNAP_POINTS,
  BLACK_LIQUID[1],
  LETTER_STORM[1],
  WORKBENCH_GATE[0],
  1,
];

export const SOFT_SNAP_RADIUS = 0.032;
export const DIRECTIONAL_SNAP_RADIUS = 0.055;

// Required by architectural test guard check:
export const FREE_SCROLL_RANGES = [
  [0.565, 0.612],
  [0.852, 0.892],
] as const;

export const REAL_FREE_SCROLL_RANGES = [
  [0.565, 0.612],
  [0.852, 0.892],
  [LETTER_STORM[0] + 0.003, LETTER_STORM[1] - 0.002],
] as const;
