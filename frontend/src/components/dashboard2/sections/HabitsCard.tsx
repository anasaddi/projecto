import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, TrendingUp, Zap } from 'lucide-react';
import { Card } from '../design/Card';
import { Button } from '../design/Button';
import { Badge } from '../design/Badge';
import { Progress } from '../design/Progress';

interface Habit {
  id: string;
  name: string;
  streak: number;
  completed: boolean;
  icon: string;
}

const MOCK_HABITS: Habit[] = [
  { id: '1', name: 'Morning meditation', streak: 12, completed: true, icon: '🧘' },
  { id: '2', name: 'Read 30 minutes', streak: 5, completed: false, icon: '📚' },
  { id: '3', name: 'Drink 2L water', streak: 8, completed: true, icon: '💧' },
  { id: '4', name: 'Exercise', streak: 3, completed: false, icon: '💪' },
];

export const HabitsCard: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>(MOCK_HABITS);

  const toggleHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? { ...h, completed: !h.completed, streak: h.completed ? h.streak - 1 : h.streak + 1 }
          : h
      )
    );
  };

  const completedCount = habits.filter((h) => h.completed).length;
  const totalStreak = habits.reduce((acc, h) => acc + h.streak, 0);

  return (
    <Card variant="default" size="lg" className="h-full">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Daily Habits</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">Build consistency</p>
          </div>
        </div>
        <Badge variant="success">{completedCount}/{habits.length}</Badge>
      </div>

      <Progress
        value={completedCount}
        max={habits.length}
        color="success"
        className="mb-5"
      />

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {habits.map((habit, index) => (
            <motion.div
              key={habit.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => toggleHabit(habit.id)}
              className={`
                group flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all
                ${habit.completed
                  ? 'bg-emerald-50/50 dark:bg-emerald-900/20'
                  : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                }
              `}
            >
              <span className="text-xl">{habit.icon}</span>
              
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${habit.completed ? 'text-stone-500 dark:text-stone-400 line-through' : 'text-stone-800 dark:text-stone-200'}`}>
                  {habit.name}
                </p>
                <div className="flex items-center gap-1 text-xs text-stone-400 dark:text-stone-500">
                  <TrendingUp className="w-3 h-3" />
                  <span>{habit.streak} day streak</span>
                </div>
              </div>

              <motion.div
                className={`
                  w-6 h-6 rounded-lg flex items-center justify-center transition-all
                  ${habit.completed
                    ? 'bg-emerald-500 text-white'
                    : 'bg-stone-100 dark:bg-stone-700 border-2 border-transparent'
                  }
                `}
                whileTap={{ scale: 0.9 }}
              >
                <AnimatePresence>
                  {habit.completed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Button variant="ghost" size="sm" className="w-full mt-4 text-stone-500 dark:text-stone-400">
        <Plus className="w-4 h-4 mr-1" />
        Add habit
      </Button>
    </Card>
  );
};
