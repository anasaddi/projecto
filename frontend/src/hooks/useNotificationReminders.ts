import { useEffect, useRef } from 'react';
import { useDashboardStore } from '../store/dashboardStore';

/**
 * Hook per browser notifications - preghiere e scadenze
 * Notifica 5 minuti prima della prossima preghiera
 * Notifica per task in scadenza oggi
 */
export function useNotificationReminders() {
  const notificationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastNotifiedRef = useRef<Record<string, number>>({});
  // Refs to store the latest state without triggering re-renders of the effect
  const prayerLogsRef = useRef(useDashboardStore.getState().prayerLogs || {});
  const quickTasksRef = useRef(useDashboardStore.getState().quickTasks || []);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Subscribe to store updates once
    const unsub = useDashboardStore.subscribe((state: any) => {
      prayerLogsRef.current = state.prayerLogs || {};
      quickTasksRef.current = state.quickTasks || [];
    });

    const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const prayerTimes: Record<string, number> = {
      Fajr: 5, Dhuhr: 12, Asr: 15, Maghrib: 18, Isha: 19,
    };

    notificationIntervalRef.current = setInterval(() => {
      const now = new Date();
      const todayKey = now.toISOString().split('T')[0];
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentPrayerLogs = prayerLogsRef.current;
      const currentQuickTasks = quickTasksRef.current;

      PRAYERS.forEach((prayer) => {
        const prayerHour = prayerTimes[prayer] || 12;
        const prayerTimeKey = `${prayer}-${todayKey}`;
        const todayLog = (currentPrayerLogs[todayKey] as Record<string, any>) || {};
        // Handle both old boolean and new object format for prayer completion
        const entry = todayLog[prayer];
        const isCompleted = typeof entry === 'object' ? !!entry?.completedAt : !!entry;
        
        if (isCompleted || lastNotifiedRef.current[prayerTimeKey]) return;

        const minutesUntilPrayer = (prayerHour - currentHour) * 60 - currentMinute;
        if (minutesUntilPrayer === 5) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Preghiera imminente', {
              body: `${prayer} tra 5 minuti`,
              icon: '/favicon.ico',
              tag: `prayer-${prayer}`,
            });
            lastNotifiedRef.current[prayerTimeKey] = Date.now();
          }
        }
      });

      currentQuickTasks.forEach((task: any) => {
        if (!task.deadline || task.done) return;
        const deadlineDate = new Date(task.deadline);
        if (deadlineDate.toISOString().split('T')[0] !== todayKey) return;
        const deadlineKey = `deadline-${task.id}`;
        if (lastNotifiedRef.current[deadlineKey]) return;

        const minutesUntilDeadline = (deadlineDate.getHours() - currentHour) * 60 - currentMinute;
        if (minutesUntilDeadline <= 60 && minutesUntilDeadline > 0) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Scadenza imminente', {
              body: `Task "${task.title}" scade tra ${Math.ceil(minutesUntilDeadline)} minuti`,
              icon: '/favicon.ico',
              tag: `deadline-${task.id}`,
            });
            lastNotifiedRef.current[deadlineKey] = Date.now();
          }
        }
      });
    }, 60000);

    return () => {
      // @ts-expect-error unsubscribe callable at runtime
      unsub?.();
      if (notificationIntervalRef.current) clearInterval(notificationIntervalRef.current);
    };
  }, []);
}
