import { useEffect, useRef } from 'react';
import { api } from '../api/client';
import { getLocalState } from '../db/localDb';
import { getSharedDashboardWsUrl } from '../config';
import { useDashboardStore } from '../store/dashboardStore';
import { extractDashboardPayload, hasMeaningfulDashboardData } from '../utils/dashboardState';

/**
 * Handles dashboard initial load: hydrate from IndexedDB if localStorage empty,
 * fetch from API, and manage shared dashboards WebSocket/BroadcastChannel.
 * Call once in DashboardV2; effects run when store state (e.g. isLoaded, sharedDashboards) is ready.
 */
export function useDashboardSync(): void {
  const syncWithServer = useDashboardStore((s: any) => s.syncWithServer);
  const setSharedDashboards = useDashboardStore((s: any) => s.setSharedDashboards);
  const setIsLoaded = useDashboardStore((s: any) => s.setIsLoaded);
  const sharedDashboards = useDashboardStore((s: any) => s.sharedDashboards) ?? [];
  const updateSharedDashboardData = useDashboardStore((s: any) => s.updateSharedDashboardData);
  const dailyTaskTemplates = useDashboardStore((s: any) => s.dailyTaskTemplates) ?? [];
  const quickTasks = useDashboardStore((s: any) => s.quickTasks) ?? [];
  const projects = useDashboardStore((s: any) => s.projects) ?? [];
  const lifeGoals = useDashboardStore((s: any) => s.lifeGoals) ?? { tiers: [] };

  const hasLocalData = Boolean(
    (dailyTaskTemplates?.length ?? 0) > 0 ||
      (quickTasks?.length ?? 0) > 0 ||
      (projects?.length ?? 0) > 0
  );

  const wsConnections = useRef<Record<string, WebSocket>>({});
  const bcChannels = useRef<Record<string, BroadcastChannel>>({});
  const applyingFromSharedBC = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrateAndFetch() {
      try {
        if (!hasLocalData && syncWithServer) {
          try {
            const localState = await getLocalState();
            const idbState = hasMeaningfulDashboardData(localState) ? extractDashboardPayload(localState) : null;
            if (idbState) {
              syncWithServer(idbState as Parameters<typeof syncWithServer>[0]);
              const shared = await api.training.listSharedDashboards({ timeout: 10_000 }).catch(() => null);
              if (!cancelled && Array.isArray(shared) && setSharedDashboards) setSharedDashboards(shared);
              return;
            }
          } catch (_) {}
        }
        const freshRes = await api.training.getDashboardStateAt(new Date().toISOString(), { timeout: 15_000 }).catch(() => null);
        let payload = extractDashboardPayload(freshRes) ?? extractDashboardPayload((freshRes as { data?: unknown } | null | undefined)?.data);
        if (!hasMeaningfulDashboardData(payload)) {
          const currentRes = await api.training.getDashboardState({ timeout: 15_000 }).catch(() => null);
          payload = extractDashboardPayload(currentRes) ?? extractDashboardPayload((currentRes as { data?: unknown } | null | undefined)?.data);
        }
        if (payload && syncWithServer && !hasLocalData) syncWithServer(payload as Parameters<typeof syncWithServer>[0]);
        const shared = await api.training.listSharedDashboards({ timeout: 10_000 }).catch(() => null);
        if (!cancelled && Array.isArray(shared) && setSharedDashboards) setSharedDashboards(shared);
      } catch (err) {
        if (typeof window !== 'undefined' && (window as any).process?.env?.NODE_ENV !== 'production') {
          console.warn('Dashboard load from server failed (using local state):', (err as Error)?.message || err);
        }
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    }
    hydrateAndFetch();

    return () => {
      cancelled = true;
    };
  }, []);

  const isLoaded = useDashboardStore((s: any) => s.isLoaded);

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
            updateSharedDashboardData(shareId, (prev: { chat?: unknown[] }) => {
              const chat = Array.isArray(prev.chat) ? prev.chat : [];
              if ((chat as Array<{ id?: string }>).some((m) => m.id === msg.data.id)) return prev;
              return { ...prev, chat: [...chat.slice(-99), msg.data] };
            });
          } else if (msg.type === 'sync' && msg.data) {
            updateSharedDashboardData(shareId, () => msg.data);
          }
          setTimeout(() => {
            applyingFromSharedBC.current = false;
          }, 0);
        };
        bcChannels.current[shareId] = bc;
      }

      if (wsConnections.current[shareId]) return;
      const wsUrl = getSharedDashboardWsUrl(shareId);
      const socket = new WebSocket(wsUrl);
      wsConnections.current[shareId] = socket;

      const hb = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'ping' }));
      }, 25000);

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'pong' || message.type === 'server_restart' || message.type === 'error') return;
          if (message.type === 'chat' && message.data) {
            updateSharedDashboardData(shareId, (prev: { chat?: unknown[] }) => {
              const chat = Array.isArray(prev.chat) ? prev.chat : [];
              if ((chat as Array<{ id?: string }>).some((m) => m.id === message.data.id)) return prev;
              return { ...prev, chat: [...chat.slice(-99), message.data] };
            });
          } else if (message.type === 'sync') {
            updateSharedDashboardData(shareId, () => message.data || message);
          }
        } catch (err) {
          console.error(`WS message error for ${shareId}:`, err);
        }
      };

      socket.onclose = () => {
        console.log(`WS Disconnected for ${shareId}`);
        clearInterval(hb);
        delete wsConnections.current[shareId];
      };
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
    };
  }, [isLoaded, sharedDashboards, updateSharedDashboardData]);
}
