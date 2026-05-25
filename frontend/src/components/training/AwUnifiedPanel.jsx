import React, { useMemo, useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import { Card } from './TrainingUI';
import UnifiedExerciseTable from './UnifiedExerciseTable';
import { getActiveWeek } from '../../utils/trainingUtils';

const TAB_BASE =
  'shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-transparent';
const TAB_ACTIVE =
  'bg-amber-500 text-white border-amber-600/30 shadow-sm shadow-amber-500/20';
const TAB_IDLE =
  'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300';

export default function AwUnifiedPanel({
  awGroups,
  allProgressions,
  awProgram,
  selectedDate,
  onProgressionChange,
  onRowsChange,
}) {
  const tabs = useMemo(() => {
    const list = [];
    if (awGroups.vol1?.length) {
      list.push({
        id: 'vol1',
        label: 'Volume 1',
        mode: 'volume',
        title: 'Volume 1',
        exercises: awGroups.vol1,
        initialWeek: getActiveWeek(allProgressions[awGroups.vol1[0]?.exercise_id]),
      });
    }
    if (awGroups.vol2?.length) {
      list.push({
        id: 'vol2',
        label: 'Volume 2',
        mode: 'volume',
        title: 'Volume 2',
        exercises: awGroups.vol2,
        initialWeek: getActiveWeek(allProgressions[awGroups.vol2[0]?.exercise_id]),
      });
    }
    if (awGroups.isoLight?.length) {
      list.push({
        id: 'isoLight',
        label: 'Iso leggera',
        mode: 'iso',
        title: 'Isometria Leggera',
        exercises: awGroups.isoLight,
        programData: awProgram?.light,
        initialWeek: getActiveWeek(allProgressions[awGroups.isoLight[0]?.exercise_id]),
      });
    }
    if (awGroups.isoHeavy?.length) {
      list.push({
        id: 'isoHeavy',
        label: 'Iso pesante',
        mode: 'iso',
        title: 'Isometria Pesante',
        exercises: awGroups.isoHeavy,
        programData: awProgram?.heavy,
        initialWeek: getActiveWeek(allProgressions[awGroups.isoHeavy[0]?.exercise_id]),
      });
    }
    if (awGroups.maxDay?.length) {
      list.push({
        id: 'maxday',
        label: 'Max Day',
        mode: 'maxday',
        exercise: awGroups.maxDay[0],
        programData: awProgram?.max_day,
        initialWeek: getActiveWeek(allProgressions[awGroups.maxDay[0]?.exercise_id]),
      });
    }
    if (awGroups.speed?.length) {
      list.push({
        id: 'speed',
        label: 'Speed',
        mode: 'speed',
        exercises: awGroups.speed,
      });
    }
    if (awGroups.others?.length) {
      list.push({
        id: 'others',
        label: `Altro (${awGroups.others.length})`,
        mode: 'others',
        exercises: awGroups.others,
      });
    }
    return list;
  }, [awGroups, allProgressions, awProgram]);

  const [active, setActive] = useState(tabs[0]?.id);

  useEffect(() => {
    if (!tabs.length) return;
    if (!tabs.some(t => t.id === active)) setActive(tabs[0].id);
  }, [tabs, active]);

  if (!tabs.length) return null;

  const current = tabs.find(t => t.id === active) || tabs[0];

  return (
    <Card className="border-amber-500/35 dark:border-amber-500/40 overflow-hidden ring-1 ring-amber-500/10">
      <div className="px-4 py-3 bg-gradient-to-r from-amber-500/[0.12] via-amber-500/[0.04] to-transparent border-b border-amber-500/15 dark:border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/25">
            <Target size={16} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">
              Armwrestling
            </h2>
            <p className="text-[10px] font-semibold text-amber-600/80 dark:text-amber-400/80 mt-0.5">
              Un pannello · {tabs.length} blocchi programma
            </p>
          </div>
        </div>
        <div className="flex gap-1.5 mt-3 overflow-x-auto custom-scrollbar pb-0.5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`${TAB_BASE} ${active === tab.id ? TAB_ACTIVE : TAB_IDLE}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/50 dark:bg-zinc-900/30">
        {current.mode === 'others' ? (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {current.exercises.map(ex => (
              <UnifiedExerciseTable
                key={ex.exercise_id}
                mode="generic"
                embedded
                exercise={ex}
                onRowsChange={onRowsChange}
                initialData={allProgressions[ex.exercise_id]}
                onProgressionChange={onProgressionChange}
              />
            ))}
          </div>
        ) : (
          <UnifiedExerciseTable
            key={current.id}
            embedded
            mode={current.mode}
            title={current.title}
            exercise={current.exercise}
            exercises={current.exercises}
            programData={current.programData}
            progressions={allProgressions}
            onProgressionChange={onProgressionChange}
            initialWeek={current.initialWeek}
            resetTrigger={selectedDate}
          />
        )}
      </div>
    </Card>
  );
}
