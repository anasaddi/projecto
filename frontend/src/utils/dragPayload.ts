const DRAG_MIME_TYPES = [
  'application/x-projecto-drag',
  'application/x-quick',
  'application/json',
  'text/plain',
] as const;

export type DragPayload = Record<string, unknown> & { type?: string };

export function setDragPayload(
  dataTransfer: DataTransfer,
  payload: DragPayload,
  extraTypes: string[] = []
): void {
  const raw = JSON.stringify(payload);
  dataTransfer.setData('application/x-projecto-drag', raw);
  dataTransfer.setData('application/json', raw);
  dataTransfer.setData('text/plain', raw);
  for (const type of extraTypes) {
    dataTransfer.setData(type, raw);
  }
  dataTransfer.effectAllowed = 'move';
}

export function parseDragPayload(dataTransfer: DataTransfer): DragPayload | null {
  for (const type of DRAG_MIME_TYPES) {
    try {
      const raw = dataTransfer.getData(type);
      if (!raw) continue;
      const payload = JSON.parse(raw) as DragPayload;
      if (payload && typeof payload === 'object') return payload;
    } catch {
      /* try next MIME */
    }
  }
  return null;
}

export function isDragType(payload: DragPayload | null, ...types: string[]): boolean {
  return !!payload?.type && types.includes(String(payload.type));
}
