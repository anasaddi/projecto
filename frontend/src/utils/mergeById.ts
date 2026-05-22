export type MergeWinner = 'local' | 'remote';

/**
 * Merge two id-keyed arrays. Default: local wins on id collision (matches dashboard sync).
 */
export function mergeById<T extends { id?: string }>(
  local: T[],
  remote: T[],
  winner: MergeWinner = 'local'
): T[] {
  const byId = new Map<string, T>();
  const first = winner === 'local' ? remote : local;
  const second = winner === 'local' ? local : remote;
  for (const item of first) {
    if (item?.id) byId.set(item.id, item);
  }
  for (const item of second) {
    if (item?.id) byId.set(item.id, item);
  }
  return Array.from(byId.values());
}
