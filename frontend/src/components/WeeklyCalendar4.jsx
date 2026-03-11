import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Target, 
  Dumbbell, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Edit2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { CompactExerciseCard } from './training/CalendarComponents';

// --- Costanti ---
const GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

function WeeklyCalendar4({ onSelectDay, progressions, schedule, loading, onEditAction, onToggleComplete }) {
  const [showMuscleNames, setShowMuscleNames] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const scrollRef = useRef(null);

  const rows = [
    { key: 'strength', label: 'FORZA', filter: e => e.category === 'STRENGTH', color: 'text-blue-500', icon: Zap },
    { key: 'aw', label: 'AW', filter: e => e.category === 'AW', color: 'text-amber-500', icon: Target },
    { key: 'hyper', label: 'IPER', filter: e => e.category === 'HYPERTROPHY', color: 'text-emerald-500', icon: Dumbbell }
  ];

  // Auto-scroll a oggi
  useEffect(() => {
    if (!loading && schedule?.length > 0 && scrollRef.current) {
      setTimeout(() => {
        const todayEl = scrollRef.current.querySelector('.is-today-marker');
        if (todayEl) {
          todayEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 100);
    }
  }, [loading, schedule]);

  const handleEditAction = (action, exercise, template_id) => {
    if (onEditAction) onEditAction(action, exercise, template_id);
  };

  const toggleComplete = (date, current) => {
    if (onToggleComplete) onToggleComplete(date, !current);
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]" />
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full select-none">
      {/* Tool Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center">
            <Zap className="text-white dark:text-zinc-900 w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight uppercase">Programma</h2>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Weekly Protocol</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowMuscleNames(!showMuscleNames)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
              ${showMuscleNames 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
          >
            {showMuscleNames ? <Eye size={12} /> : <EyeOff size={12} />}
            <span>{showMuscleNames ? 'Dettagli' : 'Compatto'}</span>
          </button>

          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
              ${isEditMode 
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
          >
            <Edit2 size={12} />
            <span>{isEditMode ? 'Fine' : 'Gestisci'}</span>
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Area */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-8 pt-2 px-2 snap-x snap-mandatory custom-scrollbar"
        style={{ scrollPadding: '1rem' }}
      >
        {schedule?.map((day, idx) => {
          const dateObj = new Date(day.date || day.date_);
          const isToday = dateObj.toDateString() === new Date().toDateString();
          const dayName = GIORNI[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1];
          const dateLabel = dateObj.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
          const isSunday = dateObj.getDay() === 0;
          const template = day.template;

          return (
            <div 
              key={idx} 
              className={`flex-shrink-0 w-[185px] snap-start transition-all duration-500 ${isToday ? 'is-today-marker' : ''}`}
            >
              <div 
                onClick={() => template && !isSunday && onSelectDay(template, day.date || day.date_)}
                className={`h-full flex flex-col gap-3 p-4 rounded-[2.5rem] border transition-all duration-300 relative cursor-pointer
                  ${isToday 
                    ? 'bg-white dark:bg-zinc-900 border-amber-500/40 shadow-2xl shadow-amber-500/10 scale-[1.02] z-10' 
                    : 'bg-white/60 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }
                  ${day.is_completed ? 'border-emerald-500/30' : ''}
                  ${isSunday ? 'opacity-50 grayscale' : ''}
                `}
              >
                {/* Header Giorno */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-amber-500' : 'text-zinc-400'}`}>
                      {dayName}
                    </span>
                    <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">
                      {dateLabel}
                    </span>
                  </div>
                  
                  {!isSunday && (
                    <motion.button 
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); toggleComplete(day.date || day.date_, day.is_completed); }}
                      className={`p-2.5 rounded-2xl transition-all shadow-lg ${day.is_completed ? 'text-white bg-emerald-500 shadow-emerald-500/20' : 'text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:text-amber-500 hover:bg-amber-500/10'}`}
                    >
                      <CheckCircle2 size={16} />
                    </motion.button>
                  )}
                </div>

                {/* Lista Esercizi */}
                <div className="flex-1 flex flex-col gap-2">
                  {rows.map(row => {
                    let exercises = template?.exercises?.filter(row.filter) || [];
                    
                    const isPast = !isToday && dateObj < new Date();
                    if (isPast && !day.is_completed && !isEditMode) {
                      exercises = [];
                    }

                    exercises = [...exercises].sort((a, b) => {
                      const activeA = a.is_active !== 0 ? 1 : 0;
                      const activeB = b.is_active !== 0 ? 1 : 0;
                      return activeB - activeA;
                    });

                    if (row.key === 'aw' && !isEditMode) {
                      const hasVol1 = exercises.some(e => e.exercise_id?.startsWith('aw_v1_'));
                      const hasVol2 = exercises.some(e => e.exercise_id?.startsWith('aw_v2_'));
                      const others = exercises.filter(e => !e.exercise_id?.startsWith('aw_v1_') && !e.exercise_id?.startsWith('aw_v2_') && e.is_active !== 0);
                      const inactiveExercises = exercises.filter(e => e.is_active === 0);
                      
                      const compacted = [];
                      if (hasVol1) compacted.push({ exercise_id: 'vol1', exercise_name: 'AW Vol. 1', category: 'AW', is_active: 1 });
                      if (hasVol2) compacted.push({ exercise_id: 'vol2', exercise_name: 'AW Vol. 2', category: 'AW', is_active: 1 });
                      compacted.push(...others);
                      compacted.push(...inactiveExercises);
                      exercises = compacted;
                    }

                    return (
                      <div key={row.key} className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 px-1 opacity-20">
                          <row.icon size={10} className={row.color} />
                          <span className="text-[8px] font-black tracking-widest text-zinc-500">{row.label}</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {exercises.map((ex, eIdx) => (
                            <CompactExerciseCard 
                              key={`${row.key}-${eIdx}`} 
                              exercise={ex} 
                              showMuscleNames={showMuscleNames} 
                              progressions={progressions}
                              date={day.date || day.date_}
                              isEditMode={isEditMode}
                              onEditAction={(action, exercise) => handleEditAction(action, exercise, day.template_id)}
                            />
                          ))}
                          {exercises.length === 0 && (
                             <div className={`${row.key === 'aw' ? 'min-h-[34px]' : 'min-h-[68px]'} rounded-xl border border-dashed border-zinc-100 dark:border-zinc-800/50 flex items-center justify-center opacity-30`}>
                               <span className="text-[7px] font-black uppercase tracking-widest text-zinc-400">Rest</span>
                             </div>
                           )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}} />
    </div>
  );
}

export default WeeklyCalendar4;
