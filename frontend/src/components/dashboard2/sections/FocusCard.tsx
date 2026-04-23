import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Flame, Target } from 'lucide-react';
import { Card } from '../design/Card';
import { Button } from '../design/Button';
import { Badge } from '../design/Badge';
import { CircularProgress } from '../design/Progress';
const POMODORO_STORAGE = 'km-pomodoro-v2';
const WORK_MINUTES = 25;

export const FocusCard: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(WORK_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [streak, setStreak] = useState(3); // Mock streak for demo

  useEffect(() => {
    const saved = localStorage.getItem(POMODORO_STORAGE);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.timeLeft) setTimeLeft(data.timeLeft);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return WORK_MINUTES * 60;
        }
        const newTime = prev - 1;
        localStorage.setItem(POMODORO_STORAGE, JSON.stringify({ timeLeft: newTime }));
        return newTime;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((WORK_MINUTES * 60 - timeLeft) / (WORK_MINUTES * 60)) * 100;

  const formatTime = (m: number, s: number) => `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(WORK_MINUTES * 60);
    localStorage.setItem(POMODORO_STORAGE, JSON.stringify({ timeLeft: WORK_MINUTES * 60 }));
  };

  return (
    <Card variant="elevated" size="lg" className="relative overflow-visible">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Focus Time</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">Pomodoro session</p>
        </div>
        <Badge variant="primary" className="flex items-center gap-1">
          <Flame className="w-3 h-3" />
          {streak} day streak
        </Badge>
      </div>

      <div className="flex items-center justify-center py-6">
        <CircularProgress
          value={progress}
          size={140}
          strokeWidth={6}
          color="stroke-indigo-500"
        >
          <div className="text-center">
            <motion.div
              key={timeLeft}
              initial={{ scale: 0.95, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-bold text-stone-900 dark:text-stone-100 tabular-nums tracking-tight"
            >
              {formatTime(minutes, seconds)}
            </motion.div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              {isRunning ? 'Focusing...' : 'Ready to start'}
            </p>
          </div>
        </CircularProgress>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button
          variant="primary"
          size="icon"
          onClick={() => setIsRunning(!isRunning)}
          className="w-12 h-12 rounded-full"
        >
          <AnimatePresence mode="wait">
            {isRunning ? (
              <motion.div
                key="pause"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Pause className="w-5 h-5" />
              </motion.div>
            ) : (
              <motion.div
                key="play"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Play className="w-5 h-5 ml-0.5" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
        <Button variant="ghost" size="icon" onClick={handleReset}>
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};
