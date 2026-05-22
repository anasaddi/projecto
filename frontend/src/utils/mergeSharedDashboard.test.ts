import { describe, expect, it } from 'vitest';
import { mergeSharedDashboardData } from './mergeSharedDashboard';

describe('mergeSharedDashboardData', () => {
  it('local quickTasks win on id collision', () => {
    const prev = { quickTasks: [{ id: 'q1', done: true, title: 'A' }] };
    const incoming = { quickTasks: [{ id: 'q1', done: false, title: 'A' }] };
    const merged = mergeSharedDashboardData(prev, incoming);
    expect(merged.quickTasks?.[0]?.done).toBe(true);
  });
});
