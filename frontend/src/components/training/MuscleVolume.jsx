import React from 'react';
import { Card, SectionHeader } from './TrainingUI';
import { Target } from 'lucide-react';

export const MuscleVolumeLegend = ({ totalVolume }) => {
  const muscleGroups = {
    quads: { label: 'Quadricipiti', color: 'bg-blue-500' },
    glutes: { label: 'Glutei', color: 'bg-emerald-500' },
    hamstrings: { label: 'Femorali', color: 'bg-amber-500' },
    back: { label: 'Schiena', color: 'bg-indigo-500' },
    chest: { label: 'Petto', color: 'bg-rose-500' },
    shoulders: { label: 'Spalle', color: 'bg-purple-500' },
    arms: { label: 'Braccia', color: 'bg-orange-500' },
    core: { label: 'Core', color: 'bg-teal-500' },
  };

  return (
    <Card className="p-4 border-0 bg-white dark:bg-[#151718] rounded-[24px]">
      <SectionHeader icon={Target} title="Volume Muscolare" subtitle="Distribuzione set settimanali" colorClass="bg-blue-500" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(muscleGroups).map(([id, { label, color }]) => {
          const volume = totalVolume[id] || 0;
          const percentage = Math.min((volume / 20) * 100, 100);
          return (
            <div key={id} className="p-3 bg-gray-50/50 dark:bg-zinc-800/30 rounded-2xl border border-gray-100 dark:border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
                <span className="text-xs font-black text-gray-900 dark:text-white">{volume}</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 dark:bg-zinc-700/50 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export const ExerciseMuscleMatrix = ({ exercises, activeMuscles }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {exercises.map(ex => (
        <div key={ex.exercise_id} className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{ex.exercise_name}</span>
          <div className="flex gap-1">
            {(ex.primary_muscles || []).map(m => (
              <div key={m} className={`w-2 h-2 rounded-full ${activeMuscles.includes(m) ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-gray-300 dark:bg-zinc-700'}`} title={m} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
