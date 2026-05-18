import Dexie from 'dexie';

export const db = new Dexie('ProjectoDB');

db.version(1).stores({
  dashboard_state: 'key, data',
  sync_queue: '++id, type, data, timestamp'
});

export const saveLocalState = async (state) => {
  await db.dashboard_state.put({ key: 'default', data: state });
};

export const getLocalState = async () => {
  const res = await db.dashboard_state.get('default');
  return res ? res.data : null;
};

export const addToSyncQueue = async (type, data) => {
  await db.sync_queue.add({ type, data, timestamp: Date.now() });
};

export const getSyncQueue = async () => {
  return await db.sync_queue.toArray();
};

export const clearSyncQueue = async (ids) => {
  await db.sync_queue.bulkDelete(ids);
};

export const clearAllSyncQueue = async () => {
  await db.sync_queue.clear();
};

export const clearDashboardPersistence = async () => {
  await db.dashboard_state.delete('default');
  await db.sync_queue.clear();
};

export const clearDailyLogsOnly = async () => {
  const res = await db.dashboard_state.get('default');
  if (res && res.data) {
    const patched = {
      ...res.data,
      dailyTaskLogs: {},
      prayerLogs: {},
      dailyCompletionLog: {},
      timelineRoutines: {},
    };
    await db.dashboard_state.put({ key: 'default', data: patched });
  }
  await db.sync_queue.clear();
};
