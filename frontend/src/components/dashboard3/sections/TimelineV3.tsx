import React, { useMemo, memo } from 'react';
import { CardV3 } from '../ui/CardV3';

interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  type: 'prayer' | 'task' | 'habit' | 'event';
  completed: boolean;
}

const EVENTS: TimelineEvent[] = [
  { id: '1', time: '05:30', title: 'Fajr Prayer', type: 'prayer', completed: true },
  { id: '2', time: '06:00', title: 'Morning Workout', type: 'habit', completed: true },
  { id: '3', time: '08:00', title: 'Deep Work Block', type: 'task', completed: false },
  { id: '4', time: '12:45', title: 'Dhuhr Prayer', type: 'prayer', completed: true },
  { id: '5', time: '13:00', title: 'Lunch Break', type: 'event', completed: false },
  { id: '6', time: '15:30', title: 'Asr Prayer', type: 'prayer', completed: false },
  { id: '7', time: '18:00', title: 'Team Meeting', type: 'event', completed: false },
  { id: '8', time: '18:45', title: 'Maghrib Prayer', type: 'prayer', completed: false },
  { id: '9', time: '20:15', title: 'Isha Prayer', type: 'prayer', completed: false },
];

const TYPE_COLORS = {
  prayer: '#6366f1',
  task: '#22c55e',
  habit: '#f59e0b',
  event: '#737373',
};

const TYPE_ICONS = {
  prayer: '🕌',
  task: '📋',
  habit: '💪',
  event: '📅',
};

export const TimelineV3 = memo(function TimelineV3() {
  const currentTime = useMemo(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, []);

  const currentIndex = useMemo(() => {
    for (let i = 0; i < EVENTS.length; i++) {
      const [h, m] = EVENTS[i].time.split(':').map(Number);
      const eventTime = h * 60 + m;
      if (eventTime > currentTime) return i;
    }
    return EVENTS.length - 1;
  }, [currentTime]);

  return (
    <CardV3>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--d3-text)]">Daily Timeline</h3>
        <div className="flex gap-2">
          {(['prayer', 'task', 'habit', 'event'] as const).map((type) => (
            <div key={type} className="flex items-center gap-1 text-xs text-[var(--d3-text-muted)]">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] }} />
              <span className="capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        {/* Current time indicator */}
        <div
          className="absolute top-0 bottom-0 w-px bg-[var(--d3-primary)] z-10"
          style={{
            left: `${(currentIndex / EVENTS.length) * 100}%`,
          }}
        >
          <div className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full bg-[var(--d3-primary)]" />
        </div>

        {/* Timeline events */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {EVENTS.map((event, index) => (
            <div
              key={event.id}
              className={`flex-shrink-0 w-28 p-3 rounded-[var(--d3-radius-md)] border transition-all ${
                event.completed
                  ? 'bg-[var(--d3-success)]/5 border-[var(--d3-success)]/20'
                  : index === currentIndex
                  ? 'bg-[var(--d3-primary)]/5 border-[var(--d3-primary)]'
                  : 'bg-[var(--d3-surface-elevated)] border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">{TYPE_ICONS[event.type]}</span>
                <span
                  className="text-xs font-medium"
                  style={{ color: TYPE_COLORS[event.type] }}
                >
                  {event.time}
                </span>
              </div>
              <p
                className={`text-sm font-medium truncate ${
                  event.completed ? 'line-through text-[var(--d3-text-muted)]' : 'text-[var(--d3-text)]'
                }`}
              >
                {event.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </CardV3>
  );
});
