import { useCallback, useRef } from 'react';

/** Skip echo sync when applying remote snapshots; dedupe outbound pushes. */
export function useSnapshotDedup<T>(buildSnapshot: (state: T) => string) {
  const lastSnapshotRef = useRef<string | null>(null);
  const skipNextSyncRef = useRef(true);
  const buildRef = useRef(buildSnapshot);
  buildRef.current = buildSnapshot;

  const markRemote = useCallback((state: T) => {
    lastSnapshotRef.current = buildRef.current(state);
    skipNextSyncRef.current = true;
  }, []);

  const consumeSkipSync = useCallback(() => {
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return true;
    }
    return false;
  }, []);

  const isDuplicatePush = useCallback((state: T) => {
    return buildRef.current(state) === lastSnapshotRef.current;
  }, []);

  const markPushed = useCallback((state: T) => {
    lastSnapshotRef.current = buildRef.current(state);
  }, []);

  return { markRemote, consumeSkipSync, isDuplicatePush, markPushed };
}
