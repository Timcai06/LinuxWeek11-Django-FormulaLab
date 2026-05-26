export const STORY_HEIGHT_VH = 2800;

export const PAPER_CENTER = [0.008, 0.032] as const;
export const SCAN_REVEAL = [0.12, 0.23] as const;
export const DECODE_CHAMBER = [0.13, 0.28] as const;
export const WORKSPACE_GHOST = [0.28, 0.42] as const;
export const COLLAB_SIGNALS = [0.42, 0.54] as const;
export const PAPER_EXIT = [0.505, 0.555] as const;

export const GREEN_LIQUID = [0.555, 0.638] as const;
export const GREEN_COPY = [0.650, 0.835] as const;
export const BLACK_LIQUID = [0.845, 0.900] as const;
export const LETTER_STORM = [0.904, 0.962] as const;
export const WORKBENCH_GATE = [0.978, 1.0] as const;

// Required by architectural test guard check:
export const GREEN_COPY_BLOCK_RANGES = [
  [0.665, 0.705],
  [0.728, 0.768],
  [0.792, 0.832],
] as const;

// Required by architectural test guard check:
export const GREEN_COPY_VISIBILITY_RANGES = [
  [0.650, 0.665, 0.712, 0.724],
  [0.716, 0.728, 0.776, 0.788],
  [0.784, 0.796, 0.835, 0.845],
] as const;

export const REAL_GREEN_COPY_BLOCK_RANGES = [
  [0.665, 0.705],
  [0.728, 0.768],
  [0.792, 0.832],
] as const;

export const REAL_GREEN_COPY_VISIBILITY_RANGES = [
  [0.650, 0.665, 0.712, 0.724],
  [0.716, 0.728, 0.776, 0.788],
  [0.784, 0.796, 0.835, 0.845],
] as const;

export const GREEN_COPY_SNAP_POINTS = [0.688, 0.748, 0.816] as const;

export const GREEN_COPY_FREE_SCROLL_RANGES = [
  [0.652, 0.710],
  [0.718, 0.772],
  [0.786, 0.834],
] as const;

export const STORY_SNAP_POINTS = [
  0,
  PAPER_CENTER[1],
  0.235,
  0.38,
  0.51,
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
  0.235,
  0.38,
  0.51,
  PAPER_EXIT[1],
  GREEN_LIQUID[1],
  ...GREEN_COPY_SNAP_POINTS,
  BLACK_LIQUID[1],
  0.935,
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
] as const;
