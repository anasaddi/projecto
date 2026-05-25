import React, { useMemo, useState, useEffect } from 'react';
import { TrainingCard, TrainingBlockHeader, ACCENT, PERIOD_TRACK, PERIOD_BTN, PERIOD_BTN_IDLE } from './TrainingUI';
import { cn } from '../../lib/utils';
import UnifiedExerciseTable from './UnifiedExerciseTable';
import { getActiveWeek } from '../../utils/trainingUtils';

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
  const aw = ACCENT.aw;

  useEffect(() => {
    if (!tabs.length) return;
    if (!tabs.some(t => t.id === active)) setActive(tabs[0].id);
  }, [tabs, active]);

  if (!tabs.length) return null;

  const current = tabs.find(t => t.id === active) || tabs[0];

  return (
    <TrainingCard accent="aw">
      <TrainingBlockHeader
        accent="aw"
        title="Armwrestling"
        subtitle={`Un pannello · ${tabs.length} blocchi`}
        stacked
        right={
          <div className={cn(PERIOD_TRACK, 'gap-1.5 p-1')}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className={cn(
                  PERIOD_BTN,
                  'px-3 h-7 rounded-lg text-[10px] uppercase tracking-wider',
                  active === tab.id ? aw.pillActive : PERIOD_BTN_IDLE
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="bg-white/50 dark:bg-zinc-900/20">
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
    </TrainingCard>
  );
}
