import { useEffect, useRef } from 'react';
import { api } from '../api/client';
import { getLocalState } from '../db/localDb';
import { getSharedDashboardWsUrl } from '../config';
import { useDashboardStore } from '../store/dashboardStore';
import { extractDashboardPayload, hasMeaningfulDashboardData } from '../utils/dashboardState';
import { DASHBOARD_LOGS_RESET_FLAG } from '../utils/resetDashboardDailyLogs';
import { mergeSharedDashboardData, type SharedDashboardData } from '../utils/mergeSharedDashboard';

/**
 * Handles dashboard initial load: hydrate from IndexedDB instantly,
 * fetch from API in background, manage shared dashboards WebSocket/BroadcastChannel.
 */
export function useDashboardSync(): void {
  const syncWithServer = useDashboardStore((s: any) => s.syncWithServer);
  const setSharedDashboards = useDashboardStore((s: any) => s.setSharedDashboards);
  const setIsLoaded = useDashboardStore((s: any) => s.setIsLoaded);
  const sharedDashboards = useDashboardStore((s: any) => s.sharedDashboards) ?? [];
  const updateSharedDashboardData = useDashboardStore((s: any) => s.updateSharedDashboardData);

  const wsConnections = useRef<Record<string, WebSocket>>({});
  const bcChannels = useRef<Record<string, BroadcastChannel>>({});
  const applyingFromSharedBC = useRef(false);
  const retryDelays = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const retryAttempts = useRef<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboardWithRetry() {
      for (let attempt = 0; attempt < 3; attempt++) {
        const currentRes = await api.training.getDashboardState({ timeout: 20_000 }).catch(() => null);
        if (cancelled || !currentRes) {
          if (attempt < 2) await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
          continue;
        }
        if (currentRes.notModified) return;

        const payload =
          extractDashboardPayload(currentRes) ??
          extractDashboardPayload((currentRes as { data?: unknown }).data);

        if (payload && syncWithServer && hasMeaningfulDashboardData(payload)) {
          syncWithServer(payload as Parameters<typeof syncWithServer>[0]);
        }
        if (!cancelled) sessionStorage.removeItem(DASHBOARD_LOGS_RESET_FLAG);
        return;
      }
    }

    async function hydrateAndFetch() {
      // 1. IndexedDB → instant UI (local-first)
      try {
        const localState = await getLocalState();
        const idbState = hasMeaningfulDashboardData(localState)
          ? extractDashboardPayload(localState)
          : null;
        if (idbState && syncWithServer) {
          syncWithServer(idbState as Parameters<typeof syncWithServer>[0]);
        }
      } catch (err) {
        console.warn('Failed to load from IndexedDB:', err);
      }

      if (!cancelled) setIsLoaded(true);

      // 2. Background sync: shared boards + dashboard in parallel
      try {
        const [,] = await Promise.all([
          api.training
            .listSharedDashboards({ timeout: 10_000 })
            .then((shared) => {
              if (!cancelled && Array.isArray(shared) && setSharedDashboards) {
                setSharedDashboards(shared);
              }
            })
            .catch(() => null),
          fetchDashboardWithRetry(),
        ]);
      } catch (err) {
        if (typeof window !== 'undefined' && (window as any).process?.env?.NODE_ENV !== 'production') {
          console.warn('Dashboard sync failed:', (err as Error)?.message || err);
        }
      }
    }

    hydrateAndFetch();

    return () => {
      cancelled = true;
    };
  }, []);

  const isLoaded = useDashboardStore((s: any) => s.isLoaded);

  const updateSharedRef = useRef(updateSharedDashboardData);
  useEffect(() => { updateSharedRef.current = updateSharedDashboardData; }, [updateSharedDashboardData]);

  const connectWs = useRef((id: string) => {
    if (wsConnections.current[id]) return;
    const wsUrl = getSharedDashboardWsUrl(id);
    const socket = new WebSocket(wsUrl);
    wsConnections.current[id] = socket;

    const hb = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'ping' }));
    }, 25000);

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'pong' || message.type === 'server_restart' || message.type === 'error') return;
        if (message.type === 'chat' && message.data) {
          updateSharedRef.current(id, (prev: { chat?: unknown[] }) => {
            const chat = Array.isArray(prev.chat) ? prev.chat : [];
            if ((chat as Array<{ id?: string }>).some((m) => m.id === message.data.id)) return prev;
            return { ...prev, chat: [...chat.slice(-99), message.data] };
          });
        } else if (message.type === 'sync') {
          updateSharedRef.current(id, (prev: SharedDashboardData) =>
            mergeSharedDashboardData(prev, message.data ?? message)
          );
        }
        retryAttempts.current[id] = 0;
      } catch (err) {
        console.error(`WS message error for ${id}:`, err);
      }
    };

    socket.onclose = () => {
      clearInterval(hb);
      delete wsConnections.current[id];
      const attempt = (retryAttempts.current[id] ?? 0) + 1;
      retryAttempts.current[id] = attempt;
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
      retryDelays.current[id] = setTimeout(() => {
        delete retryDelays.current[id];
        connectWs.current(id);
      }, delay);
    };
  });

  useEffect(() => {
    if (!isLoaded || sharedDashboards.length === 0) return;
    const shareIds = sharedDashboards.map((sd: { share_id: string }) => sd.share_id);

    shareIds.forEach((shareId: string) => {
      if (!bcChannels.current[shareId]) {
        const bc = new BroadcastChannel(`km-shared-${shareId}`);
        bc.onmessage = (e: MessageEvent) => {
          const msg = e?.data;
          if (!msg || applyingFromSharedBC.current) return;
          applyingFromSharedBC.current = true;
          if (msg.type === 'chat' && msg.data) {
            updateSharedRef.current(shareId, (prev: { chat?: unknown[] }) => {
              const chat = Array.isArray(prev.chat) ? prev.chat : [];
              if ((chat as Array<{ id?: string }>).some((m) => m.id === msg.data.id)) return prev;
              return { ...prev, chat: [...chat.slice(-99), msg.data] };
            });
          } else if (msg.type === 'sync' && msg.data) {
            updateSharedRef.current(shareId, (prev: SharedDashboardData) =>
              mergeSharedDashboardData(prev, msg.data)
            );
          }
          setTimeout(() => { applyingFromSharedBC.current = false; }, 0);
        };
        bcChannels.current[shareId] = bc;
      }

      connectWs.current(shareId);
    });

    return () => {
      Object.keys(wsConnections.current).forEach((id) => {
        if (!shareIds.includes(id)) {
          wsConnections.current[id].close();
          delete wsConnections.current[id];
        }
      });
      Object.keys(bcChannels.current).forEach((id) => {
        if (!shareIds.includes(id)) {
          bcChannels.current[id].close();
          delete bcChannels.current[id];
        }
      });
      Object.keys(retryDelays.current).forEach((id) => {
        if (!shareIds.includes(id)) {
          clearTimeout(retryDelays.current[id]);
          delete retryDelays.current[id];
          delete retryAttempts.current[id];
        }
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, sharedDashboards]);
}
