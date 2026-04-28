/**
 * Centralized constants for the entire application
 * This ensures single source of truth for magic values
 */

// Time constants (in milliseconds)
export const MS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
};

// Time constants (in other units)
export const TIME = {
  MINUTES_IN_HOUR: 60,
  MINUTES_IN_DAY: 24 * 60,
  HOURS_IN_DAY: 24,
  DAYS_IN_WEEK: 7,
  DAYS_IN_YEAR: 365,
  DAYS_IN_MONTH: 30, // approx
};

// API timeouts
export const API_TIMEOUT = {
  DEFAULT: 15000,
  SYNC: 30000,
  DASHBOARD: 15000,
};

// Score thresholds (0-1)
export const SCORE_THRESHOLDS = {
  EXCELLENT: 0.85,
  GOOD: 0.55,
  CRITICAL: 0,
};

// Dashboard specific
export const DASHBOARD = {
  MAX_HISTORY_DAYS: 365,
  HEATMAP_DAYS: 30,
  STREAK_MIN_SCORE: 0.8,
  TOP3_SLOTS: 3,
  PRAYER_SLOTS: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
  DEFAULT_PRAYERS: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
};

// Pomodoro
export const POMODORO = {
  WORK_MINUTES: 25,
  BREAK_MINUTES: 5,
  LONG_BREAK_MINUTES: 15,
  SESSIONS_BEFORE_LONG_BREAK: 4,
};

// Priority levels
export const PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

// Deadline thresholds (in days)
export const DEADLINE = {
  URGENT: 2,    // ≤ 2 days
  WARNING: 7,   // ≤ 7 days
  APPROACHING: 14, // ≤ 14 days
};

// Storage keys
export const STORAGE_KEYS = {
  DASHBOARD: 'dashboard_data',
  POMODORO: 'pomodoro_state',
  THEME: 'theme_preference',
  LAST_SYNC: 'last_sync_at',
};

// Broadcast channel
export const BC_CHANNEL = 'projecto_sync';
