import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, Check, Trash2, GripVertical } from 'lucide-react';
import { Card } from '../design/Card';
import { Button } from '../design/Button';
import { Input } from '../design/Input';

interface QuickTask {
  id: string;
  text: string;
  completed: boolean;
}

const INITIAL_TASKS: QuickTask[] = [
  { id: '1', text: 'Review design mockups', completed: false },
  { id: '2', text: 'Reply to client email', completed: true },
  { id: '3', text: 'Update documentation', completed: false },
];

export const QuickTasksCard: React.FC = () => {
  const [tasks, setTasks] = useState<QuickTask[]>(INITIAL_TASKS);
  const [newTask, setNewTask] = useState('');

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([{ id: Date.now().toString(), text: newTask, completed: false }, ...tasks]);
    setNewTask('');
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <Card variant="default" size="lg" className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Quick Tasks</h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">{activeTasks.length} remaining</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Add a quick task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          wrapperClassName="flex-1"
        />
        <Button variant="primary" size="icon" onClick={addTask}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {activeTasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="group flex items-center gap-2 p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
            >
              <button
                onClick={() => toggleTask(task.id)}
                className="w-5 h-5 rounded-md border-2 border-stone-300 dark:border-stone-600 flex items-center justify-center transition-all hover:border-indigo-500"
              >
                <Check className="w-3 h-3 text-indigo-500 opacity-0 group-hover:opacity-100" />
              </button>
              <span className="flex-1 text-sm text-stone-700 dark:text-stone-300">{task.text}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </motion.div>
          ))}

          {completedTasks.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pt-2 mt-2 border-t border-stone-100 dark:border-stone-800"
            >
              <p className="text-xs text-stone-400 dark:text-stone-500 mb-2">Completed</p>
              {completedTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  className="group flex items-center gap-2 p-2 rounded-lg"
                >
                  <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="flex-1 text-sm text-stone-400 dark:text-stone-500 line-through">{task.text}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};
