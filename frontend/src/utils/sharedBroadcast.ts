const sharedChannels = new Map<string, BroadcastChannel>();

/** Cached BroadcastChannel per shared dashboard id (avoid create/close per sync). */
export function getSharedBroadcastChannel(shareId: string): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined' || !shareId) return null;
  let channel = sharedChannels.get(shareId);
  if (!channel) {
    channel = new BroadcastChannel(`km-shared-${shareId}`);
    sharedChannels.set(shareId, channel);
  }
  return channel;
}

export function closeSharedBroadcastChannel(shareId: string): void {
  const channel = sharedChannels.get(shareId);
  if (channel) {
    channel.close();
    sharedChannels.delete(shareId);
  }
}
