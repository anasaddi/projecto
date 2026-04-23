import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Star, Sparkles } from 'lucide-react';
import { Card } from '../design/Card';
import { Button } from '../design/Button';
import { Badge } from '../design/Badge';
import { useDashboardStore } from '../../../store/dashboardStore';
import confetti from 'canvas-confetti';

interface TaskItem {
  id: string;
  text: string;
  done: boolean;
}

export const Top3Priority: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: '1', text: 'Complete project review', done: false },
    { id: '2', text: 'Team meeting at 2pm', done: false },
    { id: '3', text: 'Review pull requests', done: false },
  ]);
  const [newTask, setNewTask] = useState('');

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id && !t.done) {
          confetti({
            particleCount: 30,
            spread: 60,
            origin: { y: 0.5, x: 0.5 },
            colors: ['#6366f1', '#8b5cf6', '#10b981'],
          });
        }
        return t.id === id ? { ...t, done: !t.done } : t;
      })
    );
  };

  const addTask = () => {
    if (!newTask.trim() || tasks.length >= 3) return;
    setTasks([...tasks, { id: Date.now().toString(), text: newTask, done: false }]);
    setNewTask('');
  };

  const completedCount = tasks.filter((t) => t.done).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <Card variant="default" size="lg" className="h-full">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
            <Star className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Top 3 Priorities</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">Focus on what matters most</p>
          </div>
        </div>
        <Badge variant={completedCount === 3 ? 'success' : 'primary'}>
          {completedCount}/3
        </Badge>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => toggleTask(task.id)}
              className={`
                group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
                ${task.done 
                  ? 'bg-emerald-50/50 dark:bg-emerald-900/20' 
                  : 'bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800'
                }
              `}
            >
              <motion.div
                className={`
                  w-6 h-6 rounded-lg flex items-center justify-center transition-all
                  ${task.done
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white dark:bg-stone-700 border-2 border-stone-200 dark:border-stone-600 group-hover:border-indigo-400'
                  }
                `}
                whileTap={{ scale: 0.9 }}
              >
                <AnimatePresence>
                  {task.done && (
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
              <span
                className={`
                  flex-1 text-sm font-medium transition-all
                  ${task.done 
                    ? 'text-stone-400 dark:text-stone-500 line-through' 
                    : 'text-stone-800 dark:text-stone-200'
                  }
                `}
              >
                {task.text}
              </span>
              {!task.done && (
                <Badge size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  #{index + 1}
                </Badge>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {tasks.length < 3 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mt-3"
          >
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="Add priority..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-stone-800 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500"
            />
            <Button variant="ghost" size="icon-sm" onClick={addTask} disabled={!newTask.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </div>

      {completedCount === 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-indigo-50 dark:from-emerald-900/20 dark:to-indigo-900/20 rounded-xl flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            All priorities completed! Great job!
          </span>
        </motion.div>
      )}
    </Card>
  );
};
