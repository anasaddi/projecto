import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../api/client';
import WeeklyCalendar4 from '../components/WeeklyCalendar4';
import StrengthTable2 from '../components/StrengthTable2';
import { Dumbbell, Swords, Target, Undo2, Redo2, History as HistoryIcon, User, Activity, X, Calendar as CalendarIcon } from 'lucide-react';

// Import modular components
import { Card, SectionHeader } from '../components/training/TrainingUI';
import HypertrophyTable from '../components/training/HypertrophyTable';
import ExerciseTable from '../components/training/ExerciseTable';
import AWVolumeTableGroup from '../components/training/AWVolumeTable';
import AWIsoTableGroup from '../components/training/AWIsoTable';
import AWProgramReference, { AW_PROGRAM_FALLBACK } from '../components/training/AWProgramReference';
import FocusMode from '../components/training/FocusMode';

// Import utilities
import { 
  sanitizeProgressionData, 
  getActiveMonth, 
  getActiveWeek 
} from '../utils/trainingUtils';
import { groupAwExercises } from '../utils/awGrouping';

// --- MAIN PAGE ---
export default function Training2() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [weekData, setWeekData] = useState([]);
  const [setsByExercise, setSetsByExercise] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(true);

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

  const loadWeekData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [templates, scheduleData, awData, progressions] = await Promise.all([
        api.training.getWeek(),
        api.training.getSchedule(null, 21).catch(() => []), 
        api.training.getAwProgram().catch(() => ({})),
        api.training.getAllProgressions().catch(() => [])
      ]);

      if (!templates || !Array.isArray(templates)) {
        throw new Error("Template settimanali non validi o mancanti");
      }

      // Merge schedule con i template (per avere esercizi e date reali)
      const mergedData = (scheduleData || []).map(day => {
        const template = templates.find(t => t.template_id === day.template_id);
        return {
          ...day,
          template: template || { exercises: [], day_name: 'Riposo', weekday: new Date(day.date || day.date_).getDay() }
        };
      });

      setWeekData(mergedData);
      setAwProgram(awData && Object.keys(awData).length ? awData : AW_PROGRAM_FALLBACK);
      
      const progMap = {};
      (progressions || []).forEach(p => { progMap[p.exercise_id] = sanitizeProgressionData(p.data); });
      setAllProgressions(progMap);

      if (isInitial) {
        // Seleziona il giorno corrente nello schedule
        const todayStr = new Date().toDateString();
        const todayDay = mergedData.find(d => new Date(d.date || d.date_).toDateString() === todayStr) || mergedData[0];
        
        if (todayDay) {
          setSelectedDay(todayDay.template);
          setSelectedDate(todayDay.date || todayDay.date_);
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
        const d = day.date || day.date_;
        return d === date ? { ...day, is_completed: completed } : day;
      }));
      await api.training.updateSchedule(date, completed);
    } catch (err) {
      console.error("Errore completamento giorno:", err);
      setWeekData(prev => prev.map(day => {
        const d = day.date || day.date_;
        return d === date ? { ...day, is_completed: !completed } : day;
      }));
    }
  }, []);

  const handleProgressionChange = useCallback((exerciseId, data) => {
    setAllProgressions(prev => ({ ...prev, [exerciseId]: data }));
  }, []);

  const handleUpdateTemplate = useCallback(async (updatedTemplate) => {
    try {
      const newWeekData = weekData.map(d => d.template_id === updatedTemplate.template_id ? updatedTemplate : d);
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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#09090B] pb-24">
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
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-zinc-800/60 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-[95vw] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">Training Protocol</h1>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Anas & Flavio</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isSaving && (
              <div className="flex items-center gap-1.5 bg-blue-500/10 px-2 py-0.5 rounded-full">
                <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[8px] font-black text-blue-600 uppercase">Saving...</span>
              </div>
            )}
            
            <button 
              onClick={() => setIsFocusMode(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Target size={14} /> Focus Mode
            </button>
          </div>
        </div>
        <div className="w-full h-1 bg-gray-100 dark:bg-zinc-800 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
      </header>

      <main className="max-w-[95vw] mx-auto px-4 py-8 space-y-8">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4 bg-gradient-to-br from-blue-500 to-indigo-600 border-none shadow-xl shadow-blue-500/20">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Target className="text-white w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-1">Session Progress</p>
              <h3 className="text-2xl font-black text-white">{progressPercent}%</h3>
            </div>
          </Card>
          
          <Card className="p-5 flex items-center gap-4 border-zinc-200 dark:border-zinc-800">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <User className="text-zinc-400 w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Active Day</p>
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">{selectedDay?.day_name || 'Rest Day'}</h3>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4 border-zinc-200 dark:border-zinc-800">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <HistoryIcon className="text-zinc-400 w-6 h-6" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-blue-500 disabled:opacity-30"><Undo2 size={16} /></button>
              <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-blue-500 disabled:opacity-30"><Redo2 size={16} /></button>
            </div>
          </Card>
        </div>

        {/* Calendar Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon size={16} className="text-zinc-400" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Weekly Schedule</h2>
          </div>
          <WeeklyCalendar4
            schedule={weekData}
            progressions={allProgressions}
            onSelectDay={handleDaySelect}
            onEditAction={handleUpdateTemplate}
            onToggleComplete={handleToggleDayComplete}
            onRefreshWeek={() => loadWeekData(false)}
            loading={loading}
          />
        </section>

        {/* Exercises Grid */}
        <div className="pt-8 border-t border-gray-200/50 dark:border-zinc-800/50">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8 items-start">
            {/* Main Strength */}
            <section className="min-w-0">
              <SectionHeader icon={Swords} title="Main Strength" subtitle="Compound Progression" colorClass="bg-blue-500" />
              <div className="space-y-3">
                {strengthEx.length === 0 ? (
                  <div className="h-32 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800 flex items-center justify-center text-xs font-semibold text-gray-400 uppercase tracking-widest">No Exercises</div>
                ) : (
                  strengthEx.map(ex => (
                    <StrengthTable2 
                      key={`v2-${ex.exercise_id}`} 
                      exercise={ex} 
                      onRowsChange={handleRowsChange} 
                      onProgressionChange={handleProgressionChange}
                      initialMonth={getActiveMonth(allProgressions[ex.exercise_id])}
                      resetTrigger={selectedDate}
                    />
                  ))
                )}
              </div>
            </section>

            {/* Armwrestling Specific */}
            <section className="min-w-0">
              <SectionHeader icon={Target} title="Armwrestling" subtitle="Table, Iso, Volume, Speed" colorClass="bg-amber-500" />
              <div className="space-y-4">
                <>
                  {awGroups.vol1.length > 0 && <AWVolumeTableGroup title="Volume 1" exercises={awGroups.vol1} onRowsChange={handleRowsChange} progressions={allProgressions} initialWeek={getActiveWeek(allProgressions[awGroups.vol1[0]?.exercise_id])} resetTrigger={selectedDate} />}
                  {awGroups.vol2.length > 0 && <AWVolumeTableGroup title="Volume 2" exercises={awGroups.vol2} onRowsChange={handleRowsChange} progressions={allProgressions} initialWeek={getActiveWeek(allProgressions[awGroups.vol2[0]?.exercise_id])} resetTrigger={selectedDate} />}
                  {awGroups.isoLight.length > 0 && <AWIsoTableGroup title="AW Isometria Leggera" exercises={awGroups.isoLight} onRowsChange={handleRowsChange} programData={awProgram?.light} progressions={allProgressions} initialWeek={getActiveWeek(allProgressions[awGroups.isoLight[0]?.exercise_id])} resetTrigger={selectedDate} />}
                  {awGroups.isoHeavy.length > 0 && <AWIsoTableGroup title="AW Isometria Pesante" exercises={awGroups.isoHeavy} onRowsChange={handleRowsChange} programData={awProgram?.heavy} progressions={allProgressions} initialWeek={getActiveWeek(allProgressions[awGroups.isoHeavy[0]?.exercise_id])} resetTrigger={selectedDate} />}
                  {awGroups.others.map(ex => <ExerciseTable key={ex.exercise_id} exercise={ex} onRowsChange={handleRowsChange} initialData={allProgressions[ex.exercise_id]} />)}
                </>
                
                <AWProgramReference awProgram={awProgram} />
              </div>
            </section>
          </div>

          {/* Hypertrophy Grid */}
          {hypEx.length > 0 && (
            <section className="pt-8 mt-8 border-t border-gray-200/60 dark:border-zinc-800/60">
              <SectionHeader icon={Dumbbell} title="Hypertrophy & Accessories" subtitle="Isolation and Volume" colorClass="bg-emerald-500" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {hypEx.map(ex => (
                  <HypertrophyTable 
                    key={ex.exercise_id} 
                    exercise={ex} 
                    onRowsChange={handleRowsChange} 
                    initialRows={setsByExercise[ex.exercise_id]} 
                    initialData={allProgressions[ex.exercise_id]}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; }
      `}} />
    </div>
  );
}
