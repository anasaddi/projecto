import React from 'react';
import { Card } from './TrainingUI';

export const AW_PROGRAM_FALLBACK = {
  max_day: {
    title: '30-36 REP - ESERCIZI MAX DAY',
    weeks: [
      { week: 1, exercises: [{ name: 'DITA MAZURENKO', anas_1rm: 23, flavio_1rm: 31 }, { name: 'RISING (45°)', anas_1rm: 18, flavio_1rm: 20 }, { name: 'LOW MULTI DRAG', anas_1rm: 30, flavio_1rm: 35 }] },
      { week: 2, exercises: [{ name: 'DITA MANIGLIA', anas_1rm: 22, flavio_1rm: 30 }, { name: 'HIGH MULTI SIDE', anas_1rm: 'Sx 15 dx 20', flavio_1rm: 'Sx 15 dx 22,5' }, { name: 'PRESS', anas_1rm: 30, flavio_1rm: 30 }] },
      { week: 3, exercises: [{ name: 'DITA MAZURENKO', anas_1rm: 26.5, flavio_1rm: 32 }, { name: 'PRONATION 45°', anas_1rm: 26.5, flavio_1rm: 30 }, { name: 'DEFENSE HOOK', anas_1rm: 38, flavio_1rm: 38 }] },
      { week: 4, exercises: [{ name: 'DITA MANIGLIA', anas_1rm: '', flavio_1rm: '' }, { name: 'HIGH MULTI DRAG', anas_1rm: '27(30)', flavio_1rm: '27 sx 32 (35) dx' }, { name: 'LOW PRONATION 45°', anas_1rm: 25, flavio_1rm: 30 }] },
      { week: 5, exercises: [{ name: 'DITA MAZURENKO', anas_1rm: '', flavio_1rm: '' }, { name: 'LOW MULTI SIDE', anas_1rm: '', flavio_1rm: '' }, { name: 'LAT DRAG', anas_1rm: '', flavio_1rm: '' }] }
    ]
  },
  light: {
    title: 'LIGHT (60% 1RM) - 2 serie 15 sec',
    exercises: [
      { name: 'Rising + back', w1: 12, w2: 12, w3: 12, w4: 12, w5: 12 },
      { name: 'Cup + drag', w1: 18, w2: 18, w3: 18, w4: 18, w5: 18 },
      { name: 'Pronation 45°', w1: 15, w2: 15, w3: 15, w4: 15, w5: 15 },
      { name: 'Side + supination', w1: 9, w2: 9, w3: 9, w4: 9, w5: 9 },
      { name: 'Mazurenko dita', w1: 15, w2: 15, w3: 15, w4: 15, w5: 15 },
      { name: 'Press', w1: 15, w2: 15, w3: 15, w4: 15, w5: 15 },
      { name: 'Bicipite', w1: 18, w2: 18, w3: 18, w4: 18, w5: 18 }
    ]
  },
  heavy: {
    title: 'HEAVY (85% 1RM) - 2 serie 5 sec',
    exercises: [
      { name: 'Rising + back', w1: 17, w2: 17, w3: 17, w4: 17, w5: 17 },
      { name: 'Cup + drag', w1: 23, w2: 23, w3: 23, w4: 23, w5: 23 },
      { name: 'Pronation 45°', w1: 20, w2: 20, w3: 20, w4: 20, w5: 20 },
      { name: 'Side + supination', w1: 13, w2: 13, w3: 13, w4: 13, w5: 13 },
      { name: 'Mazurenko dita', w1: 20, w2: 20, w3: 20, w4: 20, w5: 20 },
      { name: 'Press', w1: 19, w2: 19, w3: 19, w4: 19, w5: 19 },
      { name: 'Bicipite', w1: 23, w2: 23, w3: 23, w4: 23, w5: 23 }
    ]
  },
  speed: {
    title: 'SPEED AW - 50% 1RM + BANDS - 6x6',
    exercises: [
      { name: 'LAT + CUP', weight: 10 },
      { name: 'PRONATION 45', weight: 10 },
      { name: 'LOW MULTI SIDE', weight: 10 },
      { name: 'HIGH MULTI SIDE', weight: 10 }
    ]
  }
};

const AWProgramReference = ({ awProgram }) => {
  if (!awProgram) return null;

  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">Protocollo Riferimento</span>
        <div className="h-px flex-1 bg-gradient-to-r from-amber-200 to-transparent" />
      </div>

      {awProgram.max_day && (
        <Card className="border-amber-100 dark:border-amber-900/30 overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-500/10 dark:to-transparent border-b border-amber-100 dark:border-amber-800/30">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white">{awProgram.max_day.title}</h3>
          </div>
          <div className="p-3 overflow-x-auto custom-scrollbar">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-amber-100 dark:border-amber-800/50">
                  <th className="py-2 px-2 text-left font-bold text-amber-600 dark:text-amber-400">W</th>
                  <th className="py-2 px-2 text-left font-bold text-gray-600 dark:text-gray-400">Esercizio</th>
                  <th className="py-2 px-2 text-center font-bold text-blue-600 dark:text-blue-400">Anas 1RM</th>
                  <th className="py-2 px-2 text-center font-bold text-emerald-600 dark:text-emerald-400">Flavio 1RM</th>
                </tr>
              </thead>
              <tbody>
                {(awProgram.max_day.weeks || []).flatMap((w, wi) => (w.exercises || []).map((ex, ei) => (
                  <tr key={`${wi}-${ei}`} className="border-b border-amber-50 dark:border-amber-900/30 hover:bg-amber-50/30 dark:hover:bg-amber-900/20">
                    <td className="py-2 px-2 font-bold text-amber-600 dark:text-amber-400">{ei === 0 ? `W${w.week}` : ''}</td>
                    <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{ex.name}</td>
                    <td className="py-2 px-2 text-center">{ex.anas_1rm ?? '-'}</td>
                    <td className="py-2 px-2 text-center">{ex.flavio_1rm ?? '-'}</td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {awProgram.light && (
        <Card className="border-amber-100 dark:border-amber-900/30 overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-500/10 dark:to-transparent border-b border-amber-100 dark:border-amber-800/30">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white">{awProgram.light.title}</h3>
          </div>
          <div className="p-3 overflow-x-auto custom-scrollbar">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-amber-100 dark:border-amber-800/50">
                  <th className="py-2 px-2 text-left font-bold text-gray-600 dark:text-gray-400">Esercizio</th>
                  <th className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">W1</th>
                  <th className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">W2</th>
                  <th className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">W3</th>
                  <th className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">W4</th>
                  <th className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">W5</th>
                </tr>
              </thead>
              <tbody>
                {(awProgram.light.exercises || []).map((ex, i) => (
                  <tr key={i} className="border-b border-amber-50 dark:border-amber-900/30 hover:bg-amber-50/30 dark:hover:bg-amber-900/20">
                    <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{ex.name}</td>
                    <td className="py-2 px-2 text-center">{ex.w1 ? `${ex.w1}kg` : '-'}</td>
                    <td className="py-2 px-2 text-center">{ex.w2 ? `${ex.w2}kg` : '-'}</td>
                    <td className="py-2 px-2 text-center">{ex.w3 ? `${ex.w3}kg` : '-'}</td>
                    <td className="py-2 px-2 text-center">{ex.w4 ? `${ex.w4}kg` : '-'}</td>
                    <td className="py-2 px-2 text-center">{ex.w5 ? `${ex.w5}kg` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {awProgram.heavy && (
        <Card className="border-amber-100 dark:border-amber-900/30 overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-500/10 dark:to-transparent border-b border-amber-100 dark:border-amber-800/30">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white">{awProgram.heavy.title}</h3>
          </div>
          <div className="p-3 overflow-x-auto custom-scrollbar">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-amber-100 dark:border-amber-800/50">
                  <th className="py-2 px-2 text-left font-bold text-gray-600 dark:text-gray-400">Esercizio</th>
                  <th className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">W1</th>
                  <th className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">W2</th>
                  <th className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">W3</th>
                  <th className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">W4</th>
                  <th className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">W5</th>
                </tr>
              </thead>
              <tbody>
                {(awProgram.heavy.exercises || []).map((ex, i) => (
                  <tr key={i} className="border-b border-amber-50 dark:border-amber-900/30 hover:bg-amber-50/30 dark:hover:bg-amber-900/20">
                    <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{ex.name}</td>
                    <td className="py-2 px-2 text-center">{ex.w1 ? `${ex.w1}kg` : '-'}</td>
                    <td className="py-2 px-2 text-center">{ex.w2 ? `${ex.w2}kg` : '-'}</td>
                    <td className="py-2 px-2 text-center">{ex.w3 ? `${ex.w3}kg` : '-'}</td>
                    <td className="py-2 px-2 text-center">{ex.w4 ? `${ex.w4}kg` : '-'}</td>
                    <td className="py-2 px-2 text-center">{ex.w5 ? `${ex.w5}kg` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {awProgram.speed && (
        <Card className="border-amber-100 dark:border-amber-900/30 overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-500/10 dark:to-transparent border-b border-amber-100 dark:border-amber-800/30">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white">{awProgram.speed.title}</h3>
          </div>
          <div className="p-3 overflow-x-auto custom-scrollbar">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-amber-100 dark:border-amber-800/50">
                  <th className="py-2 px-2 text-left font-bold text-gray-600 dark:text-gray-400">Esercizio</th>
                  <th className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">Peso (kg)</th>
                </tr>
              </thead>
              <tbody>
                {(awProgram.speed.exercises || []).map((ex, i) => (
                  <tr key={i} className="border-b border-amber-50 dark:border-amber-900/30 hover:bg-amber-50/30 dark:hover:bg-amber-900/20">
                    <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{ex.name}</td>
                    <td className="py-2 px-2 text-center">{ex.weight ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AWProgramReference;
