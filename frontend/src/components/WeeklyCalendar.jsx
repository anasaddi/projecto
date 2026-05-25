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
import { TrainingDayHeader, CalendarExerciseChip } from './training/TrainingUI';
import { PAGE } from './training/trainingDesignSystem';

// --- Costanti ---
const GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

const CALENDAR_MAX_CHIPS = 2;

function AwCalendarChip({ type, title, week }) {
  return (
    <CalendarExerciseChip
      name={title}
      accent="aw"
      subtitle={type === 'max' ? `Sett. ${week}` : undefined}
    />
  );
}

function shortExerciseName(name) {
  if (!name) return '—';
  const n = name.trim();
  return n.length > 22 ? `${n.slice(0, 20)}…` : n;
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

function WeeklyCalendar({ onSelectDay, progressions, schedule, loading, onEditAction, onToggleComplete, awProgram, currentMaxDayWeek, selectedDate }) {
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
            gridTemplateColumns: `repeat(${schedule?.length || 1}, ${PAGE.columnWidth})`,
            gridTemplateRows: 'auto auto auto auto',
          }}
        >
          {schedule?.map((day, idx) => {
            // Fix #15: Parse date correctly using local date construction to avoid timezone offset issues
            const dayDateStr = (day.date || day.date_ || '').toString();
            // Extract YYYY-MM-DD part regardless of format
            const dateStr = dayDateStr.slice(0, 10);
            const [year, month, dayNum] = dateStr.split('-').map(Number);
            const dateObj = new Date(year, month - 1, dayNum); // Local midnight
            const dayStr = dayDateStr;
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
                    ${isToday ? 'scale-[1.01]' : ''}`}
                  style={{ gridColumn: col, gridRow: '1 / 5' }}
                />

                {/* Header (Row 1) - Enhanced Forecast Button Style */}
                <div className="px-1 pt-2 pb-1 z-10" style={{ gridColumn: col, gridRow: 1 }}>
                  <TrainingDayHeader
                    dayName={dayName}
                    dayNum={dateObj.getDate()}
                    isToday={isToday}
                    isSelected={isSelected}
                    isCompleted={!!day.is_completed}
                    onClick={() => template && onSelectDay(template, dayStr)}
                    onToggleComplete={() => toggleComplete(day.date || day.date_, day.is_completed)}
                  />
                </div>

                {/* FORZA (Row 2) */}
                <div className={`px-2 py-2 z-10 flex flex-col gap-1 transition-all border-x border-transparent ${isSelected ? 'bg-indigo-500/[0.02] dark:bg-indigo-500/[0.04] border-indigo-500/10' : ''} ${isToday ? 'scale-[1.01]' : ''}`} style={{ gridColumn: col, gridRow: 2 }}>
                  <div className="flex items-center gap-1 px-1">
                    <Zap size={10} className="text-blue-500" />
                    <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Forza</span>
                  </div>
                  <div className="flex flex-col gap-2 h-full">
                    {(() => {
                      const list = getExercises('strength');
                      if (isEditMode) {
                        return list.map((ex, eIdx) => (
                          <CompactExerciseCard key={`str-${eIdx}`} exercise={ex} showMuscleNames={showMuscleNames} progressions={progressions} date={day.date || day.date_} isEditMode onEditAction={(a, ex) => handleEditAction(a, ex, day.template_id)} />
                        ));
                      }
                      const shown = list.slice(0, CALENDAR_MAX_CHIPS);
                      const extra = list.length - shown.length;
                      return (
                        <>
                          {shown.map((ex, eIdx) => (
                            <CalendarExerciseChip key={`str-${eIdx}`} name={shortExerciseName(ex.exercise_name || ex.name)} accent="strength" />
                          ))}
                          {extra > 0 && <CalendarExerciseChip name={`+${extra} esercizi`} accent="strength" />}
                        </>
                      );
                    })()}
                    {getExercises('strength').length === 0 && (
                      <div className="flex-1 min-h-[80px] rounded-[1.25rem] border border-dashed border-zinc-200 dark:border-zinc-800/60 flex items-center justify-center opacity-40">
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Rest</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* AW (Row 3) */}
                <div className={`px-2 py-2 z-10 flex flex-col gap-1 transition-all border-x border-transparent ${isSelected ? 'bg-indigo-500/[0.02] dark:bg-indigo-500/[0.04] border-indigo-500/10' : ''} ${isToday ? 'scale-[1.01]' : ''}`} style={{ gridColumn: col, gridRow: 3 }}>
                  <div className="flex items-center gap-1 px-1">
                    <Target size={10} className="text-amber-500" />
                    <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">AW</span>
                  </div>
                  <div className="flex flex-col gap-2 h-full">
                    {!isEditMode ? getExercises('aw').map((ex, eIdx) => {
                      const props = getAwCardProps(ex);
                      return <AwCalendarChip key={`aw-${eIdx}`} type={props.type} title={props.title} week={currentMaxDayWeek || 1} />;
                    }) : getExercises('aw').map((ex, eIdx) => (
                      <CompactExerciseCard key={`aw-${eIdx}`} exercise={ex} showMuscleNames={showMuscleNames} progressions={progressions} date={day.date || day.date_} isEditMode={isEditMode} onEditAction={(a, ex) => handleEditAction(a, ex, day.template_id)} />
                    ))}
                    {getExercises('aw').length === 0 && (
                      <div className="flex-1 min-h-[80px] rounded-[1.25rem] border border-dashed border-zinc-200 dark:border-zinc-800/60 flex items-center justify-center opacity-40">
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Rest</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* IPER (Row 4) */}
                <div className={`px-2 pt-2 pb-4 z-10 flex flex-col gap-1 transition-all border-x border-transparent rounded-b-2xl ${isSelected ? 'bg-indigo-500/[0.02] dark:bg-indigo-500/[0.04] border-indigo-500/10' : ''} ${isToday ? 'scale-[1.01]' : ''}`} style={{ gridColumn: col, gridRow: 4 }}>
                  <div className="flex items-center gap-1 px-1">
                    <Dumbbell size={10} className="text-emerald-500" />
                    <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Ipertrofia</span>
                  </div>
                  <div className="flex flex-col gap-2 h-full">
                    {(() => {
                      const list = getExercises('hyper');
                      if (isEditMode) {
                        return list.map((ex, eIdx) => (
                          <CompactExerciseCard key={`hyp-${eIdx}`} exercise={ex} showMuscleNames={showMuscleNames} progressions={progressions} date={day.date || day.date_} isEditMode onEditAction={(a, ex) => handleEditAction(a, ex, day.template_id)} />
                        ));
                      }
                      const shown = list.slice(0, CALENDAR_MAX_CHIPS);
                      const extra = list.length - shown.length;
                      return (
                        <>
                          {shown.map((ex, eIdx) => (
                            <CalendarExerciseChip key={`hyp-${eIdx}`} name={shortExerciseName(ex.exercise_name || ex.name)} accent="hyp" />
                          ))}
                          {extra > 0 && <CalendarExerciseChip name={`+${extra} esercizi`} accent="hyp" />}
                        </>
                      );
                    })()}
                    {getExercises('hyper').length === 0 && (
                      <div className="flex-1 min-h-[80px] rounded-[1.25rem] border border-dashed border-zinc-200 dark:border-zinc-800/60 flex items-center justify-center opacity-40">
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Rest</span>
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

    </div>
  );
}

export default WeeklyCalendar;
