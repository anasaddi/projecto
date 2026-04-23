import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Sunrise, Sun, Sunset, Moon, Sparkles } from 'lucide-react';
import { Card } from '../design/Card';
import { Badge } from '../design/Badge';
import { Progress } from '../design/Progress';

interface Prayer {
  name: string;
  time: string;
  completed: boolean;
  icon: React.ReactNode;
}

const PRAYERS: Prayer[] = [
  { name: 'Fajr', time: '05:30', completed: true, icon: <Sunrise className="w-3.5 h-3.5" /> },
  { name: 'Dhuhr', time: '12:30', completed: true, icon: <Sun className="w-3.5 h-3.5" /> },
  { name: 'Asr', time: '15:30', completed: false, icon: <Sunset className="w-3.5 h-3.5" /> },
  { name: 'Maghrib', time: '18:45', completed: false, icon: <Moon className="w-3.5 h-3.5" /> },
  { name: 'Isha', time: '20:15', completed: false, icon: <Sparkles className="w-3.5 h-3.5" /> },
];

export const PrayerCountdownsCard: React.FC = () => {
  const completedCount = PRAYERS.filter((p) => p.completed).length;
  const nextPrayer = PRAYERS.find((p) => !p.completed);

  return (
    <Card variant="default" size="lg" className="h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Prayers</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">{completedCount}/5 completed</p>
          </div>
        </div>
        {nextPrayer && (
          <Badge variant="primary">Next: {nextPrayer.time}</Badge>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {PRAYERS.map((prayer, index) => (
          <motion.div
            key={prayer.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`
              flex items-center justify-between p-2.5 rounded-xl transition-all
              ${prayer.completed 
                ? 'bg-emerald-50/50 dark:bg-emerald-900/20' 
                : 'bg-stone-50 dark:bg-stone-800/50'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <div className={`
                w-7 h-7 rounded-lg flex items-center justify-center
                ${prayer.completed 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
                }
              `}>
                {prayer.icon}
              </div>
              <span className={`text-sm font-medium ${prayer.completed ? 'text-emerald-700 dark:text-emerald-300' : 'text-stone-700 dark:text-stone-300'}`}>
                {prayer.name}
              </span>
            </div>
            <span className={`text-xs tabular-nums ${prayer.completed ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-500 dark:text-stone-400'}`}>
              {prayer.time}
            </span>
          </motion.div>
        ))}
      </div>

      <Progress
        value={completedCount}
        max={PRAYERS.length}
        color="success"
        showLabel
        labelClassName="flex justify-between text-xs font-medium"
      />
    </Card>
  );
};
