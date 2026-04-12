import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Target, Link2 } from 'lucide-react';
import StrengthTable2 from '../StrengthTable2';
import HypertrophyTable from './HypertrophyTable';
import ExerciseTable from './ExerciseTable';

const FocusMode = ({
  isOpen,
  onClose,
  strengthEx,
  awEx,
  hypEx,
  focusExIndex,
  setFocusExIndex,
  isSuperSetLinked,
  setIsSuperSetLinked,
  progressPercent,
  selectedDay,
  allProgressions,
  handleRowsChange,
  handleProgressionChange,
  setsByExercise,
  selectedDate,
  getActiveMonth
}) => {
  if (!isOpen) return null;

  const flatExercises = [...strengthEx, ...awEx, ...hypEx];
  const currentEx = flatExercises[focusExIndex];

  // Determine if we show a Super Set
  const showSuperSet = isSuperSetLinked[focusExIndex] && focusExIndex < flatExercises.length - 1;
  const nextEx = showSuperSet ? flatExercises[focusExIndex + 1] : null;

  if (!currentEx) {
    onClose();
    return null;
  }

  const nextExercise = () => {
    const step = showSuperSet ? 2 : 1;
    if (focusExIndex + step < flatExercises.length) setFocusExIndex(i => i + step);
  };

  const prevExercise = () => {
    if (focusExIndex > 0) {
      if (focusExIndex > 1 && isSuperSetLinked[focusExIndex - 2]) {
        setFocusExIndex(i => i - 2);
      } else {
        setFocusExIndex(i => i - 1);
      }
    }
  };

  const renderCard = (exercise, index) => {
    if (!exercise) return null;
    return (
      <div key={`focus-${exercise.exercise_id || index}`} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 lg:p-8 relative overflow-hidden mb-4 sm:mb-6 lg:mb-8 last:mb-0">
        <div className="absolute top-4 right-4 z-20">
          {index < flatExercises.length - 1 && (
            <button
              onClick={() => setIsSuperSetLinked(prev => ({ ...prev, [index]: !prev[index] }))}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${isSuperSetLinked[index]
                ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                }`}
            >
              <Link2 size={12} className={isSuperSetLinked[index] ? 'animate-pulse' : ''} />
              {isSuperSetLinked[index] ? 'SUPERSET ATTIVO' : 'LEGA AL PROSSIMO'}
            </button>
          )}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black mb-8 text-center bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent px-20">
          {exercise.exercise_name}
        </h2>

        <div className="relative z-10 scale-[1.02] sm:scale-105 origin-top mb-4">
          {exercise.category === 'STRENGTH' ? (
            <div className="bg-zinc-950 p-2 rounded-2xl w-full mx-auto max-w-3xl">
              <StrengthTable2 
                exercise={exercise} 
                onRowsChange={handleRowsChange} 
                onProgressionChange={handleProgressionChange}
                initialMonth={getActiveMonth(allProgressions[exercise.exercise_id])}
                resetTrigger={selectedDate}
              />
            </div>
          ) : exercise.category === 'HYPERTROPHY' ? (
            <div className="max-w-md mx-auto relative group">
              <div className="absolute inset-0 bg-emerald-500/5 blur-xl transition-colors pointer-events-none rounded-[24px]" />
              <div className="relative">
                <HypertrophyTable 
                  exercise={exercise} 
                  onRowsChange={handleRowsChange} 
                  onProgressionChange={handleProgressionChange}
                  initialRows={setsByExercise[exercise.exercise_id]} 
                  expandedOverride={true} 
                  initialData={allProgressions[exercise.exercise_id]}
                />
              </div>
            </div>
          ) : (
            <div className="bg-zinc-950 p-2 rounded-2xl w-full mx-auto max-w-2xl border border-zinc-800">
              <ExerciseTable 
                exercise={exercise} 
                onRowsChange={handleRowsChange} 
                expandedOverride={true} 
                initialData={allProgressions[exercise.exercise_id]}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 text-white flex flex-col items-center justify-between pointer-events-auto overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="w-full h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold transition-colors">
            Esci
          </button>
          <div className="text-xs font-medium text-emerald-400">Day {selectedDay?.weekday + 1}</div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-bold">{focusExIndex + 1} / {flatExercises.length}</span>
          <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-4xl px-4 py-8 flex flex-col justify-center min-h-[500px]">
        <motion.div
          key={focusExIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="w-full relative"
        >
          {renderCard(currentEx, focusExIndex)}
          {showSuperSet && nextEx && renderCard(nextEx, focusExIndex + 1)}
        </motion.div>
      </div>

      <div className="w-full h-24 bg-gradient-to-t from-black to-transparent flex items-center justify-between px-8 pb-6 shrink-0 sticky bottom-0 z-10">
        <button
          onClick={prevExercise}
          disabled={focusExIndex === 0}
          className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
        >
          <ChevronDown size={28} className="rotate-90 text-white" />
        </button>

        <button
          onClick={nextExercise}
          disabled={focusExIndex === flatExercises.length - 1}
          className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all"
        >
          <ChevronDown size={28} className="-rotate-90 text-white" />
        </button>
      </div>
    </div>
  );
};

export default FocusMode;
