import React, { useState, useEffect, useMemo, memo } from 'react';
import { CardV3 } from '../ui/CardV3';

interface Prayer {
  name: string;
  time: string;
  completed: boolean;
}

const PRAYERS: Prayer[] = [
  { name: 'Fajr', time: '05:30', completed: true },
  { name: 'Dhuhr', time: '12:45', completed: true },
  { name: 'Asr', time: '15:30', completed: false },
  { name: 'Maghrib', time: '18:45', completed: false },
  { name: 'Isha', time: '20:15', completed: false },
];

const COUNTDOWNS = [
  { label: 'Day', pct: 0.6 },
  { label: 'Week', pct: 0.3 },
  { label: 'Month', pct: 0.8 },
];

export const PrayerCountdownV3 = memo(function PrayerCountdownV3() {
  const [prayers, setPrayers] = useState<Prayer[]>(PRAYERS);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const togglePrayer = (name: string) => {
    setPrayers((prev) =>
      prev.map((p) => (p.name === name ? { ...p, completed: !p.completed } : p))
    );
  };

  const nextPrayer = useMemo(() => {
    const currentTime = now.getHours() * 60 + now.getMinutes();
    for (const prayer of prayers) {
      const [hours, mins] = prayer.time.split(':').map(Number);
      const prayerTime = hours * 60 + mins;
      if (prayerTime > currentTime && !prayer.completed) {
        return prayer;
      }
    }
    return prayers.find((p) => !p.completed) || prayers[prayers.length - 1];
  }, [prayers, now]);

  const completedCount = prayers.filter((p) => p.completed).length;
  const progress = (completedCount / prayers.length) * 100;

  return (
    <CardV3 className="w-full" elevated>
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        {/* Left: Next Prayer */}
        <div className="flex-1">
          <p className="text-sm text-[var(--d3-text-muted)] mb-1">Next Prayer</p>
          <div className="flex items-baseline gap-3">
            <h2 className="text-3xl font-bold text-[var(--d3-text)]">
              {nextPrayer?.name}
            </h2>
            <span className="text-xl text-[var(--d3-primary)] font-medium">
              {nextPrayer?.time}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-2 bg-[var(--d3-border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--d3-primary)] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-[var(--d3-text-muted)]">
              {completedCount}/{prayers.length}
            </span>
          </div>
        </div>

        {/* Center: Prayer Toggles */}
        <div className="flex gap-2">
          {prayers.map((prayer) => (
            <button
              key={prayer.name}
              onClick={() => togglePrayer(prayer.name)}
              className={`flex flex-col items-center gap-1 p-2 rounded-[var(--d3-radius-md)] transition-all ${
                prayer.completed
                  ? 'bg-[var(--d3-success)]/10'
                  : 'bg-[var(--d3-surface-elevated)] hover:bg-[var(--d3-border)]'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                  prayer.completed
                    ? 'bg-[var(--d3-success)] text-white'
                    : 'bg-[var(--d3-border)] text-[var(--d3-text-muted)]'
                }`}
              >
                {prayer.name[0]}
              </div>
              <span
                className={`text-[10px] ${
                  prayer.completed
                    ? 'text-[var(--d3-success)]'
                    : 'text-[var(--d3-text-muted)]'
                }`}
              >
                {prayer.time}
              </span>
            </button>
          ))}
        </div>

        {/* Right: Countdowns */}
        <div className="flex gap-4">
          {COUNTDOWNS.map((cd) => (
            <div key={cd.label} className="text-center">
              <div className="relative w-12 h-12 mb-1">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="var(--d3-border)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="var(--d3-primary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${cd.pct * 126} 126`}
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-[var(--d3-text)]">
                  {Math.round(cd.pct * 100)}%
                </span>
              </div>
              <span className="text-xs text-[var(--d3-text-muted)]">{cd.label}</span>
            </div>
          ))}
        </div>
      </div>
    </CardV3>
  );
});
