/**
 * Centralized constants for AW (Arm Wrestling) training modules.
 * Single source of truth for ISO and Speed exercise configurations.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** Configuration for a single ISO exercise variant */
export interface IsoConfig {
  label: string;
  weight: number;
  target: string;
  isHeavy: boolean;
}

/** Configuration for a Speed exercise slot */
export interface SpeedConfig {
  id: string;
  label: string;
  weight: number;
}

// ─── ISO Configuration ───────────────────────────────────────────────────────

/**
 * Complete ISO exercise configuration object.
 * Keys are exercise IDs (e.g., 'aw_iso_light_rising').
 * Use this for direct lookups by exercise ID.
 */
export const ISO_CONFIG: Record<string, IsoConfig> = {
  // Light (2×15s)
  aw_iso_light_rising:    { label: 'Rising + back',     weight: 12, target: '2×15s', isHeavy: false },
  aw_iso_light_cup:       { label: 'Cup + drag',        weight: 18, target: '2×15s', isHeavy: false },
  aw_iso_light_pronation: { label: 'Pronation 45°',     weight: 15, target: '2×15s', isHeavy: false },
  aw_iso_light_side:      { label: 'Side + supination', weight: 9,  target: '2×15s', isHeavy: false },
  aw_iso_light_dita:      { label: 'Mazurenko dita',    weight: 15, target: '2×15s', isHeavy: false },
  aw_iso_light_press:     { label: 'Press',             weight: 15, target: '2×15s', isHeavy: false },
  aw_iso_light_bicipite:  { label: 'Bicipite',          weight: 18, target: '2×15s', isHeavy: false },
  // Heavy (2×5s)
  aw_iso_heavy_rising:    { label: 'Rising + back',     weight: 17, target: '2×5s',  isHeavy: true },
  aw_iso_heavy_cup:       { label: 'Cup + drag',        weight: 23, target: '2×5s',  isHeavy: true },
  aw_iso_heavy_pronation: { label: 'Pronation 45°',     weight: 20, target: '2×5s',  isHeavy: true },
  aw_iso_heavy_side:      { label: 'Side + supination', weight: 13, target: '2×5s',  isHeavy: true },
  aw_iso_heavy_dita:      { label: 'Mazurenko dita',    weight: 20, target: '2×5s',  isHeavy: true },
  aw_iso_heavy_press:     { label: 'Press',             weight: 19, target: '2×5s',  isHeavy: true },
  aw_iso_heavy_bicipite:  { label: 'Bicipite',          weight: 23, target: '2×5s',  isHeavy: true },
};

/** Ordered exercise IDs for light ISO exercises */
export const ISO_LIGHT_KEYS = [
  'aw_iso_light_rising',
  'aw_iso_light_cup',
  'aw_iso_light_pronation',
  'aw_iso_light_side',
  'aw_iso_light_dita',
  'aw_iso_light_press',
  'aw_iso_light_bicipite',
];

/** Ordered exercise IDs for heavy ISO exercises */
export const ISO_HEAVY_KEYS = [
  'aw_iso_heavy_rising',
  'aw_iso_heavy_cup',
  'aw_iso_heavy_pronation',
  'aw_iso_heavy_side',
  'aw_iso_heavy_dita',
  'aw_iso_heavy_press',
  'aw_iso_heavy_bicipite',
];

/** Ordered labels for ISO exercises (same order for both light and heavy) */
export const ISO_LABELS = [
  'Rising + back',
  'Cup + drag',
  'Pronation 45°',
  'Side + supination',
  'Mazurenko dita',
  'Press',
  'Bicipite',
];

/** Reference weights for light ISO exercises (in kg) */
export const ISO_LIGHT_WEIGHTS = [12, 18, 15, 9, 15, 15, 18];

/** Reference weights for heavy ISO exercises (in kg) */
export const ISO_HEAVY_WEIGHTS = [17, 23, 20, 13, 20, 19, 23];

// ─── Speed Configuration ─────────────────────────────────────────────────────

/**
 * Speed exercise slot configuration.
 * Each slot represents a different speed exercise variant.
 */
export const SPEED_CONFIG: SpeedConfig[] = [
  { id: 'lat_cup',      label: 'LAT + CUP',        weight: 10 },
  { id: 'pronation_45', label: 'PRONATION 45°',    weight: 10 },
  { id: 'low_multi',    label: 'LOW MULTI SIDE',   weight: 10 },
  { id: 'high_multi',   label: 'HIGH MULTI SIDE',  weight: 10 },
];

// ─── Strength Week Labels ───────────────────────────────────────────────────

/** Labels for the 4-week strength cycle */
export const STRENGTH_WEEK_LABELS = ['5×5', '4×4', 'AMRAP', '3×5'];

// ─── AW Volume Configuration ───────────────────────────────────────────────

export const AW_STD = ['2×10', '3×8', '4×8', '5×7', '6×7'];
export const AW_ALT = ['2×8', '2×10', '2×12', '3×10', '3×12'];

export interface AwVolumeConfig {
  label: string;
  weight: string;
  pattern: 'std' | 'alt';
}

export const AW_VOL_CONFIG: Record<string, AwVolumeConfig> = {
  aw_v1_dita:         { label: 'Dita',              weight: '12',  pattern: 'std' },
  aw_v1_back_press:   { label: 'Back Pressure',     weight: '15',  pattern: 'std' },
  aw_v1_wrist_wrench: { label: 'Wrist Wrench',      weight: '10',  pattern: 'alt' },
  aw_v1_side_press:   { label: 'Side Pressure',     weight: '12',  pattern: 'std' },
  aw_v1_ulnar_chop:   { label: 'Ulnar Chop',        weight: '5-8', pattern: 'std' },
  aw_v2_pronazione:   { label: 'Pronazione',        weight: '10',  pattern: 'std' },
  aw_v2_cupping:      { label: 'Cupping Fat Grip',  weight: '15',  pattern: 'alt' },
  aw_v2_supination:   { label: 'Supination',        weight: '10',  pattern: 'std' },
  aw_v2_rising:       { label: 'Rising',            weight: '10',  pattern: 'std' },
  aw_v2_rev_pron:     { label: 'Reverse Pronation', weight: '5',   pattern: 'std' },
};
