import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { CheckCircle2, Dumbbell, ChevronLeft, ChevronRight } from 'lucide-react';

const EXERCISE_MUSCLE_MAP = {
  bp_str: ['petto', 'tricipiti'],
  sq_str: ['gambe', 'core'],
  curl_str: ['bicipiti'],
  mp_str: ['spalle', 'tricipiti'],
  // ... altri esercizi
};

const MUSCLE_COLORS = {
  petto: 'bg-rose-500',
  schiena: 'bg-emerald-500', 
  spalle: 'bg-violet-500',
  bicipiti: 'bg-blue-500',
  tricipiti: 'bg-cyan-500',
  gambe: 'bg-slate-500',
  core: 'bg-teal-500'
};

const GIORNI_SETTIMANA = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export default function WeeklyCalendarCompact({ templates, progressions, onSelectDay }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(0);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const data = await api.training.getSchedule(null, 21); // 3 settimane
      setSchedule(data);
    } catch (err) {
      console.error("Errore caricamento schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (dateStr, currentStatus) => {
    try {
      const isoDate = dateStr.split('T')[0];
      await api.training.updateSchedule(isoDate, !currentStatus);
      loadSchedule();
    } catch (err) {
      console.error("Errore update schedule:", err);
    }
  };

  const getMusclesForDay = (template) => {
    if (!template?.exercises) return [];
    const muscles = new Set();
    template.exercises.forEach(ex => {
      const exMuscles = EXERCISE_MUSCLE_MAP[ex.exercise_id] || [];
      exMuscles.forEach(m => muscles.add(m));
    });
    return Array.from(muscles);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-200 dark:border-zinc-800">
        <div className="flex items-center justify-center h-32">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    );
  }

  const weekDays = schedule.slice(currentWeek * 7, (currentWeek + 1) * 7);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
      {/* Header con navigazione */}
      <div className="p-4 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Programma Settimanale</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Settimana {currentWeek + 1}</p>
            </div>
          </div>
          
          {/* Navigazione settimana */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
              disabled={currentWeek === 0}
              className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 px-2">
              {currentWeek + 1} / 3
            </span>
            
            <button
              onClick={() => setCurrentWeek(Math.min(2, currentWeek + 1))}
              disabled={currentWeek === 2}
              className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Griglia giorni compatta */}
      <div className="p-3">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((dayData, index) => {
            const template = templates?.find(t => t.template_id === dayData?.template_id);
            const muscles = getMusclesForDay(template);
            const isToday = dayData && new Date(dayData.date).toDateString() === new Date().toDateString();
            const dayName = GIORNI_SETTIMANA[index];
            
            return (
              <div
                key={dayData?.date || index}
                className={`
                  relative p-3 rounded-xl border transition-all cursor-pointer group
                  ${isToday 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm' 
                    : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
                  }
                  ${dayData?.is_completed ? 'opacity-60' : ''}
                  hover:shadow-md
                `}
                onClick={() => template && onSelectDay(template)}
              >
                {/* Header Giorno */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold ${
                    isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {dayName}
                  </span>
                  {dayData?.is_completed && (
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  )}
                </div>

                {/* Data e nome */}
                <div className="mb-2">
                  <p className="text-[10px] font-semibold text-gray-900 dark:text-white leading-tight">
                    {template?.day_name || 'Riposo'}
                  </p>
                  <p className="text-[9px] text-gray-500 dark:text-gray-400">
                    {dayData && new Date(dayData.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                  </p>
                </div>

                {/* Muscoli indicatori */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {muscles.slice(0, 4).map((muscle, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full ${MUSCLE_COLORS[muscle] || 'bg-gray-400'}`}
                      title={muscle}
                    />
                  ))}
                  {muscles.length > 4 && (
                    <span className="text-[8px] text-gray-500">+{muscles.length - 4}</span>
                  )}
                </div>

                {/* Progress bar stato */}
                <div className="mt-auto">
                  <div className={`w-full h-1 rounded-full transition-colors ${
                    dayData?.is_completed ? 'bg-green-500' : 'bg-gray-200 dark:bg-zinc-700'
                  }`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda muscoli */}
      <div className="px-4 pb-4 pt-2">
        <div className="flex flex-wrap gap-2 text-[10px]">
          {Object.entries(MUSCLE_COLORS).map(([muscle, color]) => (
            <div key={muscle} className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
              <span className="text-gray-600 dark:text-gray-400 capitalize">{muscle}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}