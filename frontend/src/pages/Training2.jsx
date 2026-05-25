import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api } from '../api/client';
import WeeklyCalendar from '../components/WeeklyCalendar';
import { Target, X, SkipForward, ChevronDown, ChevronUp } from 'lucide-react';
import { AppLogo } from '../components/AppLogo';
import DayDetailPanel from '../components/training/DayDetailPanel';
import { TrainingPageLayout, TrainingSurface, TrainingSessionHeader } from '../components/training/TrainingUI';
import { AW_PROGRAM_FALLBACK } from '../components/training/AWProgramReference';
import FocusMode from '../components/training/FocusMode';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Import utilities
import {
  sanitizeProgressionData,
  getActiveMonth,
  getActiveWeek,
  mergeScheduleWithTemplates,
} from '../utils/trainingUtils';
import { groupAwExercises } from '../utils/awGrouping';

// Date normalization helper
const normalizeDate = (d) => (d?.date || d?.date_ || '').slice(0, 10);

// --- MAIN PAGE ---
export default function Training2() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [weekData, setWeekData] = useState([]);
  const [setsByExercise, setSetsByExercise] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Focus Mode State
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusExIndex, setFocusExIndex] = useState(0);
  const [isSuperSetLinked, setIsSuperSetLinked] = useState({}); // { [index]: true/false }

  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [awProgram, setAwProgram] = useState(AW_PROGRAM_FALLBACK);
  const [allProgressions, setAllProgressions] = useState({});
  const loadInFlightRef = useRef(false);

  const loadWeekData = useCallback(async (isInitial = false) => {
    if (loadInFlightRef.current) return;
    loadInFlightRef.current = true;
    if (isInitial) setLoading(true);
    setLoadError(false);
    try {
      const [templates, scheduleData, awData, progressions] = await Promise.all([
        api.training.getWeek().catch(err => {
          console.error('[Training2] Failed to load week templates:', err);
          throw new Error('Failed to load week templates');
        }),
        api.training.getSchedule(null, 21).catch(() => []),
        api.training.getAwProgram().catch(() => ({})),
        api.training.getAllProgressions().catch(() => [])
      ]);

      if (!templates || !Array.isArray(templates)) {
        throw new Error("Template settimanali non validi o mancanti");
      }

      let scheduleToUse = scheduleData || [];
      if (scheduleToUse.length === 0 && templates?.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        scheduleToUse = Array.from({ length: 21 }, (_, i) => {
          const d = new Date(today);
          d.setDate(d.getDate() + i);
          const mon0 = (d.getDay() + 6) % 7;
          const t = templates[mon0 % templates.length];
          const tid = t?.template_id ?? t?.id;
          return {
            date: d.toISOString().slice(0, 10),
            date_: d.toISOString(),
            template_id: tid ?? null,
            is_completed: 0,
          };
        });
      }

      const mergedData = mergeScheduleWithTemplates(scheduleToUse, templates);
      setWeekData(mergedData);
      setAwProgram(awData && Object.keys(awData).length ? awData : AW_PROGRAM_FALLBACK);

      const progMap = {};
      (progressions || []).forEach(p => { progMap[p.exercise_id] = sanitizeProgressionData(p.data); });
      setAllProgressions(progMap);

      if (isInitial) {
        // Seleziona il giorno corrente nello schedule
        const todayStr = new Date().toDateString();
        const todayDay = mergedData.find(d => new Date(normalizeDate(d) + 'T12:00:00').toDateString() === todayStr) || mergedData[0];

        if (todayDay) {
          setSelectedDay(todayDay.template);
          setSelectedDate(normalizeDate(todayDay));
        }
      } else {
        // Aggiorna il giorno selezionato se i suoi dati sono cambiati
        setSelectedDay(prev => {
          if (!prev) return null;
          const freshDay = mergedData.find(d => d.template_id === prev.template_id);
          return freshDay ? freshDay.template : prev;
        });
      }
    } catch (err) {
      console.error("Errore caricamento dati:", err);
      if (isInitial) setLoadError(true);
    } finally {
      loadInFlightRef.current = false;
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeekData(true);
  }, [loadWeekData]);

  // --- DERIVED STATE ---
  const activeExercises = useMemo(() => {
    if (!selectedDay?.exercises) return [];
    return selectedDay.exercises.filter(ex => ex.is_active !== 0);
  }, [selectedDay]);

  const strengthEx = useMemo(() => activeExercises.filter(e => e.category === 'STRENGTH'), [activeExercises]);
  const awEx = useMemo(() => activeExercises.filter(e => e.category === 'AW'), [activeExercises]);
  const hypEx = useMemo(() => activeExercises.filter(e => e.category === 'HYPERTROPHY'), [activeExercises]);

  // Calcolo progresso sessione
  const totalExpectedSets = useMemo(() => activeExercises.reduce((acc, ex) => {
    if (ex.category === 'HYPERTROPHY') return acc + 2;
    if (ex.category === 'AW') return acc + 5;
    if (ex.category === 'STRENGTH') return acc + (ex.base_sets || 4);
    return acc + (ex.base_sets || 3);
  }, 0) || 1, [activeExercises]);

  const totalCompletedSets = useMemo(() => Object.values(setsByExercise).reduce((acc, rows) => {
    return acc + (rows?.filter(r => r.checked)?.length || 0);
  }, 0), [setsByExercise]);

  const progressPercent = useMemo(() => Math.min(100, Math.round((totalCompletedSets / totalExpectedSets) * 100)) || 0, [totalCompletedSets, totalExpectedSets]);
  const awGroups = useMemo(() => groupAwExercises(awEx), [awEx]);

  useEffect(() => {
    if (calendarVisible) {
      api.training.getAllProgressions().then(progressions => {
        const progMap = {};
        (progressions || []).forEach(p => { progMap[p.exercise_id] = sanitizeProgressionData(p.data); });
        setAllProgressions(progMap);
      }).catch(err => {
        console.error("[Training2] Error fetching progressions:", err);
      });
    }
  }, [calendarVisible]);

  const handleDaySelect = useCallback((day, date) => {
    setSelectedDay(day);
    setSelectedDate(date);
    setSetsByExercise({});
  }, []);

  const handleToggleDayComplete = useCallback(async (date, completed) => {
    try {
      setWeekData(prev => prev.map(day => {
        const d = normalizeDate(day);
        return d === date ? { ...day, is_completed: completed } : day;
      }));
      await api.training.updateSchedule(date, completed);
    } catch (err) {
      console.error("Errore completamento giorno:", err);
      setWeekData(prev => prev.map(day => {
        const d = normalizeDate(day);
        return d === date ? { ...day, is_completed: !completed } : day;
      }));
    }
  }, []);

  const handleProgressionChange = useCallback((exerciseId, data) => {
    setAllProgressions(prev => ({ ...prev, [exerciseId]: data }));
  }, []);

  const handleSkipToday = useCallback(async () => {
    try {
      await api.training.skipToday();
      await loadWeekData(false);
    } catch (err) {
      console.error("Errore skip oggi:", err);
    }
  }, [loadWeekData]);

  const handleUpdateTemplate = useCallback(async (updatedTemplate) => {
    try {
      const newWeekData = weekData.map(d =>
        d.template_id === updatedTemplate.template_id ? { ...d, template: updatedTemplate } : d
      );
      setWeekData(newWeekData);
      if (selectedDay?.template_id === updatedTemplate.template_id) setSelectedDay(updatedTemplate);

      await api.training.updateWeek(
        newWeekData.map(d => ({
          template_id: d.template_id,
          exercises: d.exercises.map(ex => ({
            exercise_id: ex.exercise_id,
            custom_name: ex.exercise_name,
            instruction: ex.instruction,
            base_sets: ex.base_sets,
            base_reps: ex.base_reps
          }))
        }))
      );
    } catch (err) {
      console.error("Errore aggiornamento template:", err);
    }
  }, [weekData, selectedDay]);

  const handleRowsChange = useCallback((exerciseId, rows) => {
    setSetsByExercise(prev => {
      const newState = { ...prev, [exerciseId]: rows };
      setHistory(h => {
        const newHistory = h.slice(0, historyIndex + 1);
        newHistory.push({ exerciseId, rows: JSON.parse(JSON.stringify(rows)), timestamp: Date.now() });
        if (newHistory.length > 50) newHistory.shift();
        return newHistory;
      });
      setHistoryIndex(idx => Math.min(idx + 1, 49));
      setLastSaved(Date.now());
      return newState;
    });
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setSetsByExercise(prev => ({ ...prev, [prevState.exerciseId]: prevState.rows }));
      setHistoryIndex(idx => idx - 1);
      setLastSaved(Date.now());
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setSetsByExercise(prev => ({ ...prev, [nextState.exerciseId]: nextState.rows }));
      setHistoryIndex(idx => idx + 1);
      setLastSaved(Date.now());
    }
  }, [history, historyIndex]);

  useEffect(() => {
    if (!selectedDay || !lastSaved || isSaving) return;
    const timeoutId = setTimeout(() => {
      const sets = [];
      Object.entries(setsByExercise).forEach(([exerciseId, rows]) => {
        (rows || []).forEach(row => {
          if (row.weight || row.reps) {
            sets.push({
              exercise_id: exerciseId,
              set_number: row.set,
              weight_kg: row.weight ? parseFloat(row.weight) : null,
              reps: row.reps ? parseInt(row.reps, 10) : null,
              completed: !!row.checked
            });
          }
        });
      });
      if (sets.length > 0) {
        setIsSaving(true);
        api.training.log({ template_id: selectedDay.template_id, sets }).finally(() => setIsSaving(false));
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [lastSaved, selectedDay, setsByExercise, isSaving]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-blue-100 dark:border-blue-900/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-sm font-medium text-gray-500 animate-pulse">Loading Protocol...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <X className="text-red-600 w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Errore di Caricamento</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
          Non è stato possibile caricare il tuo protocollo di allenamento. Controlla la connessione al backend.
        </p>
        <button onClick={() => loadWeekData(true)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all">Riprova</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090B] pb-24 relative">
      {/* Sfondo pagina — Sobrio e pulito */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black"></div>
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[radial-gradient(#808080_1px,transparent_1px)] [background-size:20px_24px]"></div>
      </div>

      {/* Contenuto principale */}
      <div className="relative z-10 bg-transparent">
        {/* Focus Mode Component */}
        <FocusMode
          isOpen={isFocusMode}
          onClose={() => setIsFocusMode(false)}
          strengthEx={strengthEx}
          awEx={awEx}
          hypEx={hypEx}
          focusExIndex={focusExIndex}
          setFocusExIndex={setFocusExIndex}
          isSuperSetLinked={isSuperSetLinked}
          setIsSuperSetLinked={setIsSuperSetLinked}
          progressPercent={progressPercent}
          selectedDay={selectedDay}
          allProgressions={allProgressions}
          handleRowsChange={handleRowsChange}
          handleProgressionChange={handleProgressionChange}
          setsByExercise={setsByExercise}
          selectedDate={selectedDate}
          getActiveMonth={getActiveMonth}
        />

        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-40 border-b border-zinc-200/50 dark:border-white/[0.06] bg-white/70 dark:bg-[#0b0e14]/70 backdrop-blur-xl shrink-0 transition-colors">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-5 h-14 sm:h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3.5">
              <div className="transition-transform active:scale-95 shrink-0">
                <AppLogo size="sm" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white leading-tight tracking-tight truncate">Training Protocol</h1>
                <p className="text-[10px] sm:text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.1em] truncate">
                  {new Date().toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })} · PROJECTO
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {isSaving && (
                <div className="hidden sm:flex items-center gap-2 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Syncing</span>
                </div>
              )}

              <button
                onClick={handleSkipToday}
                className="flex items-center justify-center h-8 sm:h-9 px-3 sm:px-4 rounded-lg sm:rounded-[10px] bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-amber-500/10 hover:text-amber-600 active:scale-95 transition-all border border-transparent hover:border-amber-500/20"
                title="Salta Oggi"
              >
                <SkipForward size={14} className="sm:mr-2" />
                <span className="hidden sm:inline">Salta Oggi</span>
              </button>
              <button
                onClick={() => setIsFocusMode(true)}
                className="flex items-center justify-center h-8 sm:h-9 px-3 sm:px-4 rounded-lg sm:rounded-[10px] bg-zinc-900 dark:bg-indigo-500 text-white dark:text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-sm dark:shadow-indigo-500/20"
                title="Focus Mode"
              >
                <Target size={14} className="sm:mr-2" />
                <span className="hidden sm:inline">Focus Mode</span>
              </button>
            </div>
          </div>
          <div className="w-full h-[2px] bg-zinc-100 dark:bg-zinc-800/50 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-700 ease-out" style={{ width: `${progressPercent}%` }} />
          </div>
        </header>

        <TrainingPageLayout>
          <DayDetailPanel
            dayName={selectedDay?.day_name}
            selectedDate={selectedDate}
            strengthEx={strengthEx}
            awGroups={awGroups}
            awEx={awEx}
            hypEx={hypEx}
            allProgressions={allProgressions}
            awProgram={awProgram}
            onProgressionChange={handleProgressionChange}
            onRowsChange={handleRowsChange}
            setsByExercise={setsByExercise}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onOpenCalendar={() => setCalendarOpen(true)}
          />

          <TrainingSurface>
            <TrainingSessionHeader
              title="Calendario · 3 settimane"
              subtitle={calendarOpen ? 'Tocca un giorno per cambiare sessione' : 'Chiuso — apri per navigare'}
              right={
                <button
                  type="button"
                  onClick={() => setCalendarOpen(o => !o)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-indigo-500 transition-colors"
                  aria-expanded={calendarOpen}
                >
                  {calendarOpen ? 'Nascondi' : 'Apri'}
                  {calendarOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              }
            />
            {calendarOpen && (
              <ErrorBoundary>
                <WeeklyCalendar
                  schedule={weekData}
                  progressions={allProgressions}
                  onSelectDay={(day, date) => { handleDaySelect(day, date); setCalendarOpen(false); }}
                  onEditAction={handleUpdateTemplate}
                  onToggleComplete={handleToggleDayComplete}
                  awProgram={awProgram}
                  currentMaxDayWeek={getActiveWeek(allProgressions['aw_max']) || 1}
                  onRefreshWeek={() => loadWeekData(false)}
                  loading={loading}
                  selectedDate={selectedDate}
                />
              </ErrorBoundary>
            )}
          </TrainingSurface>
        </TrainingPageLayout>
      </div> {/* Fine relative z-10 */}

    </div>
  );
}
