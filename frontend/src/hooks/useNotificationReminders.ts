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
  const { prayerLogs, quickTasks } = useDashboardStore((s) => ({
    prayerLogs: s.prayerLogs || {},
    quickTasks: s.quickTasks || [],
  }));
  const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Check every minute for notifications
    notificationIntervalRef.current = setInterval(() => {
      const now = new Date();
      const todayKey = now.toISOString().split('T')[0];
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Prayer notifications - 5 minutes before
      // Using approximate prayer times (simplified - in production use API)
      const prayerTimes: Record<string, number> = {
        Fajr: 5,    // 5:00 AM
        Dhuhr: 12,  // 12:00 PM
        Asr: 15,    // 3:00 PM
        Maghrib: 18, // 6:00 PM
        Isha: 19,   // 7:00 PM
      };

      PRAYERS.forEach((prayer: string) => {
        const prayerHour = prayerTimes[prayer] || 12;
        const prayerMinute = 0;
        const prayerTimeKey = `${prayer}-${todayKey}`;
        
        // Check if prayer is already done today
        const todayLog = (prayerLogs[todayKey] as Record<string, boolean>) || {};
        if (todayLog[prayer]) return;

        // Check if we already notified for this prayer today
        if (lastNotifiedRef.current[prayerTimeKey]) return;

        // Check if we're 5 minutes before prayer time
        const minutesUntilPrayer = (prayerHour - currentHour) * 60 + (prayerMinute - currentMinute);
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

      // Deadline notifications for quick tasks due today
      quickTasks.forEach((task: any) => {
        if (!task.deadline || task.done) return;
        
        const deadlineDate = new Date(task.deadline);
        const isToday = deadlineDate.toISOString().split('T')[0] === todayKey;
        const deadlineKey = `deadline-${task.id}`;
        
        if (!isToday) return;
        if (lastNotifiedRef.current[deadlineKey]) return;

        const deadlineHour = deadlineDate.getHours();
        const minutesUntilDeadline = (deadlineHour - currentHour) * 60 - currentMinute;

        // Notify if deadline is in 1 hour or less
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
    }, 60000); // Check every minute

    return () => {
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
      }
    };
  }, [PRAYERS, prayerLogs, quickTasks]);
}
