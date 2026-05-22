import { describe, expect, it } from 'vitest';
import { mergeById } from './mergeById';

describe('mergeById', () => {
  it('local wins on id collision by default', () => {
    const local = [{ id: 'a', done: true }];
    const remote = [{ id: 'a', done: false }];
    const merged = mergeById(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0].done).toBe(true);
  });

  it('includes ids only present on remote', () => {
    const local = [{ id: 'a', done: true }];
    const remote = [{ id: 'b', done: false }];
    const merged = mergeById(local, remote);
    expect(merged.map((x) => x.id).sort()).toEqual(['a', 'b']);
  });

  it('remote wins when explicitly requested', () => {
    const local = [{ id: 'a', done: true }];
    const remote = [{ id: 'a', done: false }];
    const merged = mergeById(local, remote, 'remote');
    expect(merged[0].done).toBe(false);
  });
});
