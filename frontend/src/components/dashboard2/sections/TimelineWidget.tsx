import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Check, Sun, Moon, Sunrise, Sunset, Sparkles } from 'lucide-react';
import { Card } from '../design/Card';
import { Badge } from '../design/Badge';

interface TimelineEvent {
  id: string;
  time: string;
  label: string;
  type: 'prayer' | 'task' | 'habit' | 'focus';
  completed: boolean;
  icon?: React.ReactNode;
}

const TIMELINE_EVENTS: TimelineEvent[] = [
  { id: '1', time: '05:30', label: 'Fajr Prayer', type: 'prayer', completed: true, icon: <Sunrise className="w-3.5 h-3.5" /> },
  { id: '2', time: '07:00', label: 'Morning Routine', type: 'habit', completed: true },
  { id: '3', time: '09:00', label: 'Deep Work', type: 'focus', completed: false },
  { id: '4', time: '12:30', label: 'Dhuhr Prayer', type: 'prayer', completed: false, icon: <Sun className="w-3.5 h-3.5" /> },
  { id: '5', time: '15:30', label: 'Asr Prayer', type: 'prayer', completed: false, icon: <Sunset className="w-3.5 h-3.5" /> },
  { id: '6', time: '18:00', label: 'Review Tasks', type: 'task', completed: false },
  { id: '7', time: '19:30', label: 'Maghrib Prayer', type: 'prayer', completed: false, icon: <Moon className="w-3.5 h-3.5" /> },
  { id: '8', time: '21:00', label: 'Isha Prayer', type: 'prayer', completed: false, icon: <Sparkles className="w-3.5 h-3.5" /> },
];

const getEventColor = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'prayer': return 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
    case 'habit': return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    case 'focus': return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    case 'task': return 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700';
    default: return '';
  }
};

export const TimelineWidget: React.FC = () => {
  const [events, setEvents] = useState<TimelineEvent[]>(TIMELINE_EVENTS);
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const toggleEvent = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e))
    );
  };

  const completedCount = events.filter((e) => e.completed).length;

  return (
    <Card variant="default" size="lg" className="h-full">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Daily Timeline</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">{completedCount}/{events.length} completed</p>
          </div>
        </div>
        <Badge variant="outline">{currentTime}</Badge>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[52px] top-2 bottom-2 w-px bg-stone-200 dark:bg-stone-700" />

        <div className="space-y-3">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => toggleEvent(event.id)}
              className={`
                group flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all
                ${event.completed ? 'opacity-50' : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'}
              `}
            >
              {/* Time */}
              <span className="w-10 text-xs font-medium text-stone-500 dark:text-stone-400 tabular-nums">
                {event.time}
              </span>

              {/* Dot/Connector */}
              <div className={`
                relative z-10 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                ${event.completed 
                  ? 'bg-emerald-500 border-emerald-500' 
                  : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 group-hover:border-indigo-500'
                }
              `}>
                {event.completed && <Check className="w-2.5 h-2.5 text-white" />}
              </div>

              {/* Content */}
              <div className={`
                flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-sm
                ${getEventColor(event.type)}
                ${event.completed ? 'line-through opacity-60' : ''}
              `}>
                {event.icon && <span>{event.icon}</span>}
                <span className="font-medium">{event.label}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Card>
  );
};
