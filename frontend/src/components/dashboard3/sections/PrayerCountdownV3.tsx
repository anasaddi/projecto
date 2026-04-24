import React, { useEffect, useMemo, useCallback, memo, useState } from 'react';
import { CardV3 } from '../ui/CardV3';
import { useGlobalConfig } from '../../../context/GlobalConfigContext';
import { useDashboardStore } from '../../../store/dashboardStore';
import { toDateKey, startOfDay, startOfWeek, startOfMonth } from '../../../components/dashboard/DashboardUtils';

interface Prayer {
  name: string;
  time: string;
}

const DEFAULT_PRAYER_TIMES: Record<string, string> = {
  Fajr: '05:24',
  Dhuhr: '12:31',
  Asr: '15:47',
  Maghrib: '18:22',
  Isha: '19:48',
};

export const PrayerCountdownV3 = memo(function PrayerCountdownV3() {
  const [now, setNow] = useState(new Date());
  const globalConfig = useGlobalConfig() as { config?: { PRAYERS?: string[] } } | null;
  const config = globalConfig?.config;
  const PRAYERS = useMemo(() => config?.PRAYERS || ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'], [config]);
  const todayKey = toDateKey(now);
  const prayerLogs = (useDashboardStore((s) => s.prayerLogs) ?? {}) as Record<string, Record<string, boolean>>;
  const togglePrayer = useDashboardStore((s) => s.togglePrayer);
  const todayPrayerLog = prayerLogs[todayKey] || {};

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const prayerRows = useMemo<Prayer[]>(() => {
    return PRAYERS.map((name: string) => ({ name, time: DEFAULT_PRAYER_TIMES[name] || DEFAULT_PRAYER_TIMES.Dhuhr }));
  }, [PRAYERS]);

  const nextPrayer = useMemo(() => {
    const currentTime = now.getHours() * 60 + now.getMinutes();
    for (const prayer of prayerRows) {
      const [hours, mins] = prayer.time.split(':').map(Number);
      const prayerTime = hours * 60 + mins;
      if (prayerTime > currentTime && !todayPrayerLog[prayer.name]) {
        return prayer;
      }
    }
    return prayerRows.find((p) => !todayPrayerLog[p.name]) || prayerRows[prayerRows.length - 1];
  }, [prayerRows, now, todayPrayerLog]);

  const completedCount = PRAYERS.reduce((acc: number, p: string) => acc + (todayPrayerLog[p] ? 1 : 0), 0);
  const progress = PRAYERS.length ? (completedCount / PRAYERS.length) * 100 : 0;

  const countdowns = useMemo(() => {
    const sod = startOfDay(now);
    const eod = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const eow = new Date(startOfWeek(now).getTime() + 7 * 86400000);
    const eom = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return [
      { label: 'Day', pct: (now.getTime() - sod.getTime()) / (eod.getTime() - sod.getTime()) },
      { label: 'Week', pct: (now.getTime() - startOfWeek(now).getTime()) / (eow.getTime() - startOfWeek(now).getTime()) },
      { label: 'Month', pct: (now.getTime() - startOfMonth(now).getTime()) / (eom.getTime() - startOfMonth(now).getTime()) },
    ];
  }, [now]);

  return (
    <CardV3 className="w-full" elevated>
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Left: Next Prayer */}
        <div className="flex-1">
          <p className="text-xs md:text-sm text-[var(--d3-text-muted)] mb-1">Next Prayer</p>
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--d3-text)]">
              {nextPrayer?.name}
            </h2>
            <span className="text-lg md:text-xl text-[var(--d3-primary)] font-medium">
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
              {completedCount}/{PRAYERS.length}
            </span>
          </div>
        </div>

        {/* Center: Prayer Toggles */}
        <div className="flex gap-2 flex-wrap">
          {prayerRows.map((prayer: Prayer) => {
            const done = !!todayPrayerLog[prayer.name];
            return (
              <button
                key={prayer.name}
                onClick={() => togglePrayer(prayer.name, !done)}
                className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-[var(--d3-radius-md)] transition-colors ${done ? '' : 'hover:bg-[var(--d3-surface-elevated)]'}`}
                style={{ backgroundColor: done ? 'var(--d3-success-bg)' : 'transparent' }}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium transition-colors ${
                    done
                      ? 'bg-[var(--d3-success)] text-white'
                      : 'bg-[var(--d3-surface-elevated)] text-[var(--d3-text-muted)]'
                  }`}
                >
                  {prayer.name[0]}
                </div>
                <span
                  className={`text-[10px] ${
                    done
                      ? 'text-[var(--d3-success)]'
                      : 'text-[var(--d3-text-muted)]'
                  }`}
                >
                  {prayer.time}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Countdowns */}
        <div className="flex gap-3">
          {countdowns.map((cd) => (
            <div key={cd.label} className="text-center">
              <div className="relative w-10 h-10 mb-1">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="var(--d3-border)"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="var(--d3-primary)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={`${cd.pct * 100} 100`}
                    className="d3-progress-ring-circle"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-[var(--d3-text)]">
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
