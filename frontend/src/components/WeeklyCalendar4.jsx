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

const AW_CARD_STYLE = {
  border: 'border-amber-300/70 dark:border-amber-600/30',
  bg: 'bg-gradient-to-br from-amber-50/80 to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/10',
  badge: 'bg-amber-500',
  label: 'text-amber-800 dark:text-amber-300',
  dot: 'bg-amber-400',
};

const CYCLE_COLORS = [
  { ...AW_CARD_STYLE },
  { ...AW_CARD_STYLE, border: 'border-orange-400/60 dark:border-orange-500/30', badge: 'bg-orange-500', dot: 'bg-orange-400' },
  { ...AW_CARD_STYLE, border: 'border-rose-400/60 dark:border-rose-500/30', badge: 'bg-rose-500', dot: 'bg-rose-400' },
  { ...AW_CARD_STYLE, border: 'border-violet-400/60 dark:border-violet-500/30', badge: 'bg-violet-500', dot: 'bg-violet-400' },
];

function AwMiniCard({ type, title, week, awProgram }) {
  const cycle = type === 'max'
    ? CYCLE_COLORS[Math.floor(((week || 1) - 1) / 5) % 4]
    : { ...AW_CARD_STYLE };

  const maxExercises = type === 'max' && awProgram
    ? (awProgram?.max_day?.weeks?.find(w => w.week === (((week || 1) - 1) % 5) + 1)?.exercises || []).map(e => e.name.toUpperCase())
    : null;

  return (
    <div className={`relative group flex flex-col rounded-xl border ${cycle.border} ${cycle.bg} p-1.5 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden justify-center min-h-[4.5rem] text-center`}>
      <div className="flex flex-col items-center justify-center w-full gap-1">
        <div className={`w-4 h-4 rounded ${cycle.badge} shadow-sm flex items-center justify-center shrink-0`}>
          <Target size={9} className="text-white" />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-tight text-center px-1 line-clamp-1 leading-tight ${cycle.label}`}>{title}</span>
        <span className={`text-[8px] font-bold px-1 py-0.5 rounded bg-white/20 dark:bg-black/20 ${cycle.label} shrink-0 whitespace-nowrap`}>W{week}</span>
      </div>

      {type === 'max' && (
        <div className="flex flex-wrap justify-center gap-1 mt-2.5 w-full">
          {maxExercises?.length > 0 ? maxExercises.map((name, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] bg-white/80 dark:bg-zinc-900/60 border border-amber-200/60 dark:border-amber-700/30 shadow-sm">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cycle.dot}`} />
              <span className="text-[8px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-tighter leading-tight">{name}</span>
            </span>
          )) : <span className="text-[10px] text-zinc-400 font-medium mt-1">—</span>}
        </div>
      )}
    </div>
  );
}

function getAwCardProps(ex) {
  const id = (ex.exercise_id || '').toLowerCase();
  const name = (ex.exercise_name || '').toLowerCase();
  if (id === 'vol1' || name.includes('vol. 1') || name.includes('volume 1')) return { type: 'vol1', title: 'AW Vol. 1' };
  if (id === 'vol2' || name.includes('vol. 2') || name.includes('volume 2')) return { type: 'vol2', title: 'AW Vol. 2' };
  if (id.includes('aw_max') || name.includes('max day')) return { type: 'max', title: 'AW Max Day' };
  if (id.includes('speed')) return { type: 'speed', title: 'AW Speed' };
  if (name.includes('leggera') || (name.includes('light') && !name.includes('heavy')) || id.includes('iso_light')) return { type: 'iso_light', title: 'Iso Leggera' };
  if (name.includes('pesante') || name.includes('heavy') || id.includes('iso_heavy')) return { type: 'iso_heavy', title: 'Iso Pesante' };
  return { type: 'other', title: (ex.exercise_name || ex.name || '').slice(0, 14) };
}

function WeeklyCalendar4({ onSelectDay, progressions, schedule, loading, onEditAction, onToggleComplete, awProgram, currentMaxDayWeek, selectedDate }) {
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


      {/* Horizontal Scroll Area — grid con righe condivise e carte unite */}
      {/* Horizontal Scroll Area — grid con righe condivise e carte unite */}
      <div
        ref={scrollRef}
        className="overflow-x-auto pb-6 pt-4 px-4 snap-x snap-mandatory custom-scrollbar"
        style={{ scrollPadding: '1rem' }}
      >
        <div
          className="grid gap-x-2 min-w-max items-start"
          style={{
            gridTemplateColumns: `repeat(${schedule?.length || 1}, 155px)`,
            gridTemplateRows: 'auto auto auto auto',
          }}
        >
          {schedule?.map((day, idx) => {
            const dateObj = new Date(day.date || day.date_);
            const dayStr = day.date || day.date_;
            const isToday = dateObj.toDateString() === new Date().toDateString();
            const isSelected = selectedDate && (
              dayStr === selectedDate ||
              dayStr?.slice(0, 10) === selectedDate?.slice(0, 10)
            );

            const dayName = GIORNI[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1];
            const dateLabel = dateObj.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
            const isSunday = dateObj.getDay() === 0;
            const template = day.template;
            const col = idx + 1;

            const getExercises = (rowKey) => {
              let exs = template?.exercises?.filter(rows.find(r => r.key === rowKey).filter) || [];
              const isPast = !isToday && dateObj < new Date();
              if (isPast && !day.is_completed && !isEditMode) exs = [];
              exs = [...exs].sort((a, b) => (b.is_active !== 0 ? 1 : 0) - (a.is_active !== 0 ? 1 : 0));
              if (rowKey === 'aw' && !isEditMode) {
                const hasVol1 = exs.some(e => e.exercise_id?.startsWith('aw_v1_'));
                const hasVol2 = exs.some(e => e.exercise_id?.startsWith('aw_v2_'));
                const hasIsoLight = exs.some(e => (e.exercise_id || '').includes('iso') && ((e.exercise_name || '').toLowerCase().includes('light') || (e.exercise_name || '').toLowerCase().includes('leggera') || (e.exercise_id || '').includes('light')));
                const hasIsoHeavy = exs.some(e => (e.exercise_id || '').includes('iso') && ((e.exercise_name || '').toLowerCase().includes('heavy') || (e.exercise_name || '').toLowerCase().includes('pesante') || (e.exercise_id || '').includes('heavy')));
                const id = (e) => (e.exercise_id || '').toLowerCase();
                const isIsoBlock = (e) => id(e).includes('iso_light') || id(e).includes('iso_heavy') || id(e) === 'aw_iso_l' || id(e) === 'aw_iso_h';
                const isMaxDay = (e) => id(e).includes('aw_max') || (e.exercise_name || '').toLowerCase().includes('max day');
                const others = exs.filter(e => !e.exercise_id?.startsWith('aw_v1_') && !e.exercise_id?.startsWith('aw_v2_') && !isIsoBlock(e) && !isMaxDay(e) && e.is_active !== 0);
                const inactive = exs.filter(e => e.is_active === 0 && !isMaxDay(e));
                const compacted = [];
                if (hasVol1) compacted.push({ exercise_id: 'vol1', exercise_name: 'AW Vol. 1', category: 'AW', is_active: 1 });
                if (hasVol2) compacted.push({ exercise_id: 'vol2', exercise_name: 'AW Vol. 2', category: 'AW', is_active: 1 });
                if (hasIsoLight) compacted.push({ exercise_id: 'aw_iso_light', exercise_name: 'Isometria Leggera', category: 'AW', is_active: 1 });
                if (hasIsoHeavy) compacted.push({ exercise_id: 'aw_iso_heavy', exercise_name: 'Isometria Pesante', category: 'AW', is_active: 1 });
                compacted.push(...others, ...inactive);
                return compacted;
              }
              return exs;
            };

            return (
              <React.Fragment key={idx}>
                {/* Background spanning all rows */}
                <div
                  className={`snap-start rounded-2xl border transition-all duration-500 z-0
                    ${isToday ? 'is-today-marker bg-white dark:bg-zinc-900 border-indigo-500/50 shadow-xl shadow-indigo-500/5' : 'bg-white/10 dark:bg-zinc-900/10 border-zinc-200 dark:border-white/[0.06]'}
                    ${isSelected && !isToday ? 'border-indigo-500/50 shadow-lg bg-indigo-50/10 dark:bg-indigo-900/5' : ''}
                    ${day.is_completed ? 'border-emerald-500/30' : ''}
                    ${isSunday ? 'opacity-50 grayscale' : ''}
                    ${isToday ? 'scale-[1.01]' : ''}`}
                  style={{ gridColumn: col, gridRow: '1 / 5' }}
                />

                {/* Header (Row 1) - Enhanced Forecast Button Style */}
                <div
                  className="px-2 pt-3 pb-2 z-10"
                  style={{ gridColumn: col, gridRow: 1 }}
                >
                  <div className="relative">
                    <button
                      onClick={() => template && !isSunday && onSelectDay(template, dayStr)}
                      className={`flex flex-col items-center gap-0.5 py-3 rounded-2xl transition-all duration-300 w-full border shadow-sm
                        ${isSelected
                          ? 'bg-zinc-900 border-zinc-900 shadow-xl shadow-zinc-900/10 dark:bg-white dark:border-white'
                          : isToday
                            ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/30'
                            : 'bg-white border-zinc-200/60 dark:bg-white/[0.02] dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.12]'
                        }`}
                    >
                      <span className={`text-[8px] font-black uppercase tracking-widest ${isSelected ? 'text-zinc-400 dark:text-zinc-500' :
                        isToday ? 'text-indigo-500' : 'text-zinc-400'
                        }`}>{dayName}</span>
                      <span className={`text-[15px] font-black leading-none tabular-nums ${isSelected ? 'text-white dark:text-zinc-950' :
                        isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-800 dark:text-zinc-100'
                        }`}>{dateObj.getDate()}</span>

                      <div className="flex gap-1 h-1 items-center mt-1">
                        {template?.exercises?.some(e => e.category === 'STRENGTH' && e.is_active !== 0) && <div className="w-1 h-1 rounded-full bg-indigo-500" />}
                        {template?.exercises?.some(e => e.category === 'AW' && e.is_active !== 0) && <div className="w-1 h-1 rounded-full bg-amber-500" />}
                        {template?.exercises?.some(e => e.category === 'HYPERTROPHY' && e.is_active !== 0) && <div className="w-1 h-1 rounded-full bg-emerald-500" />}
                      </div>
                    </button>

                    {!isSunday && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleComplete(day.date || day.date_, day.is_completed); }}
                        className={`absolute top-1.5 right-1.5 p-1 rounded-lg transition-all z-20 ${day.is_completed ? 'text-white bg-emerald-500 shadow-sm' : 'text-zinc-300 dark:text-zinc-600 hover:text-indigo-500'}`}
                      >
                        <CheckCircle2 size={10} />
                      </button>
                    )}
                  </div>
                </div>

                {/* FORZA (Row 2) */}
                <div className={`px-2 py-2 z-10 flex flex-col gap-1 transition-all border-x border-transparent ${isSelected ? 'bg-indigo-500/[0.02] dark:bg-indigo-500/[0.04] border-indigo-500/10' : ''} ${isToday ? 'scale-[1.01]' : ''}`} style={{ gridColumn: col, gridRow: 2 }}>
                  <div className="flex items-center gap-1 px-1 opacity-40">
                    <Zap size={9} className="text-blue-500" />
                    <span className="text-[7px] font-bold tracking-widest text-zinc-500 uppercase">FORZA</span>
                  </div>
                  <div className="flex flex-col gap-2.5 h-full">
                    {getExercises('strength').map((ex, eIdx) => (
                      <CompactExerciseCard key={`str-${eIdx}`} exercise={ex} showMuscleNames={showMuscleNames} progressions={progressions} date={day.date || day.date_} isEditMode={isEditMode} onEditAction={(a, ex) => handleEditAction(a, ex, day.template_id)} />
                    ))}
                    {getExercises('strength').length === 0 && (
                      <div className="flex-1 min-h-[80px] rounded-[1.25rem] border border-dashed border-zinc-200 dark:border-zinc-800/60 flex items-center justify-center opacity-40">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Rest</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* AW (Row 3) */}
                <div className={`px-2 py-2 z-10 flex flex-col gap-1 transition-all border-x border-transparent ${isSelected ? 'bg-indigo-500/[0.02] dark:bg-indigo-500/[0.04] border-indigo-500/10' : ''} ${isToday ? 'scale-[1.01]' : ''}`} style={{ gridColumn: col, gridRow: 3 }}>
                  <div className="flex items-center gap-1 px-1 opacity-40">
                    <Target size={9} className="text-amber-500" />
                    <span className="text-[7px] font-bold tracking-widest text-zinc-500 uppercase">AW</span>
                  </div>
                  <div className="flex flex-col gap-2.5 h-full">
                    {!isEditMode ? getExercises('aw').map((ex, eIdx) => {
                      const props = getAwCardProps(ex);
                      return <AwMiniCard key={`aw-${eIdx}`} type={props.type} title={props.title} week={currentMaxDayWeek || 1} awProgram={awProgram} />;
                    }) : getExercises('aw').map((ex, eIdx) => (
                      <CompactExerciseCard key={`aw-${eIdx}`} exercise={ex} showMuscleNames={showMuscleNames} progressions={progressions} date={day.date || day.date_} isEditMode={isEditMode} onEditAction={(a, ex) => handleEditAction(a, ex, day.template_id)} />
                    ))}
                    {getExercises('aw').length === 0 && (
                      <div className="flex-1 min-h-[80px] rounded-[1.25rem] border border-dashed border-zinc-200 dark:border-zinc-800/60 flex items-center justify-center opacity-40">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Rest</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* IPER (Row 4) */}
                <div className={`px-2 pt-2 pb-4 z-10 flex flex-col gap-1 transition-all border-x border-transparent rounded-b-2xl ${isSelected ? 'bg-indigo-500/[0.02] dark:bg-indigo-500/[0.04] border-indigo-500/10' : ''} ${isToday ? 'scale-[1.01]' : ''}`} style={{ gridColumn: col, gridRow: 4 }}>
                  <div className="flex items-center gap-1 px-1 opacity-40">
                    <Dumbbell size={9} className="text-emerald-500" />
                    <span className="text-[7px] font-bold tracking-widest text-zinc-500 uppercase">IPER</span>
                  </div>
                  <div className="flex flex-col gap-2.5 h-full">
                    {getExercises('hyper').map((ex, eIdx) => (
                      <CompactExerciseCard key={`hyp-${eIdx}`} exercise={ex} showMuscleNames={showMuscleNames} progressions={progressions} date={day.date || day.date_} isEditMode={isEditMode} onEditAction={(a, ex) => handleEditAction(a, ex, day.template_id)} />
                    ))}
                    {getExercises('hyper').length === 0 && (
                      <div className="flex-1 min-h-[80px] rounded-[1.25rem] border border-dashed border-zinc-200 dark:border-zinc-800/60 flex items-center justify-center opacity-40">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Rest</span>
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}} />
    </div>
  );
}

export default WeeklyCalendar4;
