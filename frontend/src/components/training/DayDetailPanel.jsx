import React from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import StrengthTable2 from '../StrengthTable2';
import AwUnifiedPanel from './AwUnifiedPanel';
import UnifiedExerciseTable from './UnifiedExerciseTable';
import { TrainingSurface, TrainingSessionHeader, TrainingSection } from './TrainingUI';
import { getActiveMonth } from '../../utils/trainingUtils';
import { Undo2, Redo2 } from 'lucide-react';

export default function DayDetailPanel({
  dayName,
  strengthEx,
  awGroups,
  awEx,
  hypEx,
  allProgressions,
  awProgram,
  selectedDate,
  onProgressionChange,
  onRowsChange,
  setsByExercise,
  progressPercent,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) {
  const hasContent = strengthEx?.length > 0 || awEx?.length > 0 || hypEx?.length > 0;
  if (!hasContent) {
    return (
      <TrainingSurface>
        <TrainingSessionHeader title="Programma giorno" subtitle={dayName || 'Rest'} progressPercent={progressPercent} />
        <p className="text-center text-sm text-zinc-400 py-10 px-4">Nessun esercizio per questo giorno.</p>
      </TrainingSurface>
    );
  }

  return (
    <TrainingSurface>
      <TrainingSessionHeader
        title={`Programma · ${dayName || '—'}`}
        subtitle="Dettaglio sessione"
        progressPercent={progressPercent}
        right={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-indigo-500 disabled:opacity-30"
            >
              <Undo2 size={13} />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-indigo-500 disabled:opacity-30"
            >
              <Redo2 size={13} />
            </button>
          </div>
        }
      />

      {strengthEx?.length > 0 && (
        <TrainingSection accent="strength" title="Forza" subtitle={`${strengthEx.length} esercizi`} noBorder={false}>
          <div className="divide-y divide-zinc-100/90 dark:divide-zinc-800/50">
            {strengthEx.map(ex => (
              <ErrorBoundary key={`str-${ex.exercise_id}`}>
                <StrengthTable2
                  embedded
                  exercise={ex}
                  onRowsChange={onRowsChange}
                  onProgressionChange={onProgressionChange}
                  initialMonth={getActiveMonth(allProgressions[ex.exercise_id])}
                  resetTrigger={selectedDate}
                />
              </ErrorBoundary>
            ))}
          </div>
        </TrainingSection>
      )}

      {awEx?.length > 0 && (
        <TrainingSection accent="aw" title="Armwrestling" subtitle="Volume · Iso · Max · Speed">
          <ErrorBoundary>
            <AwUnifiedPanel
              embedded
              awGroups={awGroups}
              allProgressions={allProgressions}
              awProgram={awProgram}
              selectedDate={selectedDate}
              onProgressionChange={onProgressionChange}
              onRowsChange={onRowsChange}
            />
          </ErrorBoundary>
        </TrainingSection>
      )}

      {hypEx?.length > 0 && (
        <TrainingSection accent="hyp" title="Ipertrofia" subtitle={`${hypEx.length} esercizi`} noBorder>
          <ErrorBoundary>
            <UnifiedExerciseTable
              mode="hypertrophy-grid"
              embedded
              exercises={hypEx}
              onRowsChange={onRowsChange}
              onProgressionChange={onProgressionChange}
              setsByExercise={setsByExercise}
              allProgressions={allProgressions}
            />
          </ErrorBoundary>
        </TrainingSection>
      )}
    </TrainingSurface>
  );
}
