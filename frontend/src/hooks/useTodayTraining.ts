import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api } from '../api/client';
import { sanitizeProgressionData } from '../utils/trainingUtils';

interface Exercise {
  exercise_id: string;
  exercise_name: string;
  category: 'STRENGTH' | 'AW' | 'HYPERTROPHY';
  is_active: number;
  base_sets?: number;
  base_reps?: string;
}

interface DayTemplate {
  template_id: string;
  day_name: string;
  exercises: Exercise[];
}

interface TodayResponse {
  template?: DayTemplate;
  template_id?: string;
  day_name?: string;
  hypertrophy_exercises?: Exercise[];
  strength_aw_exercises?: Exercise[];
  date?: string;
}

interface ProgressionData {
  [key: string]: unknown;
  dataByMonth?: Array<Array<{
    anas?: { completed?: boolean; weight?: string };
    flavio?: { completed?: boolean; weight?: string };
  }>>;
  anas?: { completed?: boolean; weight?: string; reps?: string };
  flavio?: { completed?: boolean; weight?: string; reps?: string };
}

interface AwProgram {
  max_day?: {
    weeks: Array<{
      week: number;
      exercises: Array<{
        name: string;
        anas_1rm?: number;
        flavio_1rm?: number;
      }>;
    }>;
  };
  light?: unknown;
  heavy?: unknown;
}

interface UseTodayTrainingReturn {
  selectedDay: DayTemplate | null;
  allProgressions: Record<string, ProgressionData>;
  awProgram: AwProgram | null;
  selectedDate: string;
  progressPercent: number;
  loading: boolean;
  error: string | null;
  onProgressionChange: (exerciseId: string, data: ProgressionData) => void;
}

// ISO exercise keys for AW isometrics
const ISO_LIGHT_KEYS = [
  'aw_iso_light_pronation',
  'aw_iso_light_supination',
  'aw_iso_light_ulnar',
  'aw_iso_light_radial',
  'aw_iso_light_flexion',
  'aw_iso_light_extension',
  'aw_iso_light_cupping',
];

const ISO_HEAVY_KEYS = [
  'aw_iso_heavy_pronation',
  'aw_iso_heavy_supination',
  'aw_iso_heavy_ulnar',
  'aw_iso_heavy_radial',
  'aw_iso_heavy_flexion',
  'aw_iso_heavy_extension',
  'aw_iso_heavy_cupping',
];

const SPEED_CONFIG = [
  { id: 'cupping', label: 'Cupping', weight: '2.5' },
  { id: 'radial', label: 'Radial', weight: '2.5' },
  { id: 'ulnar', label: 'Ulnar', weight: '2.5' },
  { id: 'back_pressure', label: 'Back Press', weight: '5' },
];

function classifyAw(ex: Exercise): string {
  const t = `${ex.exercise_id || ''} ${ex.exercise_name || ''}`.toLowerCase();
  if (ex.exercise_id?.startsWith('aw_v1_') || t.includes('aw_v1') || t.includes('volume 1') || t.includes('vol. 1')) return 'vol1';
  if (ex.exercise_id?.startsWith('aw_v2_') || t.includes('aw_v2') || t.includes('volume 2') || t.includes('vol. 2')) return 'vol2';
  if (t.includes('aw_max') || t.includes('max day') || t.includes('maxday')) return 'maxday';
  if (t.includes('aw_speed') || t.includes('speed')) return 'speed';
  if ((t.includes('iso') || t.includes('isometria')) && (t.includes('pesante') || t.includes('heavy'))) return 'iso_heavy';
  if (t.includes('iso') || t.includes('isometria')) return 'iso_light';
  return 'other';
}

function expandAwExercises(rawAwEx: Exercise[], allProgressions: Record<string, ProgressionData>, awProgram: AwProgram | null): Exercise[] {
  const out: Exercise[] = [];
  for (const ex of rawAwEx) {
    const type = classifyAw(ex);
    if (type === 'iso_light' || type === 'iso_heavy') {
      const keys = type === 'iso_light' ? ISO_LIGHT_KEYS : ISO_HEAVY_KEYS;
      keys.forEach((isoId) => {
        out.push({
          ...ex,
          exercise_id: isoId,
          exercise_name: isoId.split('_').pop() || isoId,
          category: 'AW',
          is_active: 1,
        } as Exercise);
      });
    } else if (type === 'speed') {
      SPEED_CONFIG.forEach((cfg) => {
        out.push({
          ...ex,
          exercise_id: `${ex.exercise_id}::${cfg.id}`,
          exercise_name: cfg.label,
          category: 'AW',
          is_active: 1,
        } as Exercise);
      });
    } else if (type === 'maxday') {
      const prog = allProgressions?.[ex.exercise_id] || {};
      let maxWeek = 0;
      Object.keys(prog).forEach((key) => {
        if (key.startsWith('w')) {
          const w = parseInt(key.substring(1).split('_')[0]);
          if (!isNaN(w) && (prog[key] as { anas_completed?: boolean; flavio_completed?: boolean })?.anas_completed || (prog[key] as { anas_completed?: boolean; flavio_completed?: boolean })?.flavio_completed) {
            if (w > maxWeek) maxWeek = w;
          }
        }
      });
      const week = maxWeek || 1;
      const protoW = ((week - 1) % 5) + 1;

      let weekExercises: Array<{ name: string; anas_1rm?: number; flavio_1rm?: number }> = [];
      if (awProgram?.max_day?.weeks) {
        const weekData = awProgram.max_day.weeks.find((w) => w.week === protoW);
        if (weekData?.exercises) {
          weekExercises = weekData.exercises;
        }
      }

      if (weekExercises.length === 0) {
        out.push(ex);
      } else {
        weekExercises.forEach((mdEx, i) => {
          out.push({
            ...ex,
            exercise_id: `${ex.exercise_id}::md_e${i + 1}`,
            exercise_name: mdEx.name,
            category: 'AW',
            is_active: 1,
          } as Exercise);
        });
      }
    } else {
      out.push(ex);
    }
  }
  return out;
}

function getCompletedCount(ex: Exercise, allProgressions: Record<string, ProgressionData>): number {
  const prog = allProgressions?.[ex.exercise_id];
  if (!prog) return 0;

  // For strength exercises with dataByMonth
  if (prog.dataByMonth && Array.isArray(prog.dataByMonth)) {
    let count = 0;
    for (const month of prog.dataByMonth) {
      if (Array.isArray(month)) {
        for (const week of month) {
          if (week?.anas?.completed) count++;
          if (week?.flavio?.completed) count++;
        }
      }
    }
    return count;
  }

  // For hypertrophy/flat AW exercises
  let count = 0;
  if (prog.anas?.completed) count++;
  if (prog.flavio?.completed) count++;
  return count;
}

function calculateProgressPercent(
  exercises: Exercise[],
  allProgressions: Record<string, ProgressionData>,
  awProgram: AwProgram | null
): number {
  if (exercises.length === 0) return 0;

  const activeExercises = exercises.filter((e) => e.is_active !== 0);
  
  // Expand AW exercises to get true count
  const rawAwEx = activeExercises.filter((e) => e.category === 'AW');
  const expandedAwEx = expandAwExercises(rawAwEx, allProgressions, awProgram);
  
  const strengthEx = activeExercises.filter((e) => e.category === 'STRENGTH');
  const hypEx = activeExercises.filter((e) => e.category === 'HYPERTROPHY');

  // Calculate expected sets
  let totalExpected = 0;
  
  // Strength: base_sets per exercise, default 4
  for (const ex of strengthEx) {
    totalExpected += (ex.base_sets || 4) * 2; // ×2 for both athletes
  }
  
  // AW: count expanded exercises, default 5 reps each × 2 athletes
  for (const _ of expandedAwEx) {
    totalExpected += 2; // Each sub-exercise counts as 2 (one per athlete)
  }
  
  // Hypertrophy: base_sets per exercise, default 2
  for (const ex of hypEx) {
    totalExpected += (ex.base_sets || 2) * 2; // ×2 for both athletes
  }

  if (totalExpected === 0) return 0;

  // Calculate completed
  let totalCompleted = 0;
  
  for (const ex of strengthEx) {
    totalCompleted += getCompletedCount(ex, allProgressions);
  }
  
  for (const ex of expandedAwEx) {
    const prog = allProgressions?.[ex.exercise_id];
    if (prog?.anas?.completed) totalCompleted++;
    if (prog?.flavio?.completed) totalCompleted++;
  }
  
  for (const ex of hypEx) {
    totalCompleted += getCompletedCount(ex, allProgressions);
  }

  return Math.min(100, Math.round((totalCompleted / totalExpected) * 100)) || 0;
}

export function useTodayTraining(forDate?: string): UseTodayTrainingReturn {
  const [selectedDay, setSelectedDay] = useState<DayTemplate | null>(null);
  const [allProgressions, setAllProgressions] = useState<Record<string, ProgressionData>>({});
  const [awProgram, setAwProgram] = useState<AwProgram | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  
  // Fetch today's training data
  // No auth gate - let the API handle authorization and set errors reactively
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setSelectedDay(null);
      setAllProgressions({});
      setAwProgram(null);

      try {
        const targetDate = (forDate || new Date().toISOString().slice(0, 10)).slice(0, 10);
        setSelectedDate(targetDate);

        const [todayRes, progressionsRes, awProgramRes] = await Promise.all([
          api.training.getToday(targetDate).catch((err) => {
            console.warn('[useTodayTraining] Failed to fetch today:', err);
            return null;
          }),
          api.training.getAllProgressions().catch((err) => {
            console.warn('[useTodayTraining] Failed to fetch progressions:', err);
            return [];
          }),
          api.training.getAwProgram().catch((err) => {
            console.warn('[useTodayTraining] Failed to fetch AW program:', err);
            return null;
          }),
        ]);

        // Process today's data
        const todayData = todayRes as TodayResponse | null;
        const groupedHypertrophy = todayData?.hypertrophy_exercises ?? [];
        const groupedStrength = todayData?.strength_aw_exercises ?? [];
        if (todayData?.template) {
          setSelectedDay(todayData.template);
        } else if (groupedHypertrophy.length || groupedStrength.length) {
          const response = todayData ?? {};
          setSelectedDay({
            template_id: response.template_id || targetDate,
            day_name: response.day_name || 'Today',
            exercises: [...groupedHypertrophy, ...groupedStrength],
          });
        }

        // Process progressions
        const progressionsArray = Array.isArray(progressionsRes) ? progressionsRes : [];
        const progMap: Record<string, ProgressionData> = {};
        progressionsArray.forEach((p: { exercise_id: string; data: ProgressionData }) => {
          if (p.exercise_id) {
            progMap[p.exercise_id] = sanitizeProgressionData(p.data);
          }
        });
        setAllProgressions(progMap);

        // Process AW program
        if (awProgramRes && typeof awProgramRes === 'object') {
          setAwProgram(awProgramRes as AwProgram);
        }
      } catch (err) {
        console.error('[useTodayTraining] Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forDate]);

  // Calculate progress percentage
  const progressPercent = useMemo(() => {
    if (!selectedDay?.exercises) return 0;
    return calculateProgressPercent(selectedDay.exercises, allProgressions, awProgram);
  }, [selectedDay, allProgressions, awProgram]);

  // Handle progression changes with debounce
  const onProgressionChange = useCallback((exerciseId: string, data: ProgressionData) => {
    // Update local state immediately
    setAllProgressions((prev) => ({
      ...prev,
      [exerciseId]: data,
    }));

    // Debounce API call
    if (saveTimers.current[exerciseId]) {
      clearTimeout(saveTimers.current[exerciseId]);
    }

    saveTimers.current[exerciseId] = setTimeout(() => {
      api.training.updateProgression(exerciseId, data).catch((err) => {
        console.error(`[useTodayTraining] Failed to update progression for ${exerciseId}:`, err);
      });
    }, 700);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimers.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return {
    selectedDay,
    allProgressions,
    awProgram,
    selectedDate,
    progressPercent,
    loading,
    error,
    onProgressionChange,
  };
}
