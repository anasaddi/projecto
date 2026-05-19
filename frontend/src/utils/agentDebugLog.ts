/** Debug session 8facec — remove after verified fix */
export function agentDebugLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
  runId = 'pre-fix'
): void {
  // #region agent log
  fetch('http://127.0.0.1:7420/ingest/71e75ef7-a5d2-4c85-97a5-ec2ed680869f', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '8facec' },
    body: JSON.stringify({
      sessionId: '8facec',
      location,
      message,
      data,
      timestamp: Date.now(),
      hypothesisId,
      runId,
    }),
  }).catch(() => {});
  // #endregion
}

export function sampleMayDayLogs(logs: unknown): Record<string, unknown> {
  if (!logs || typeof logs !== 'object' || Array.isArray(logs)) return {};
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(logs as Record<string, unknown>)) {
    if (k.includes('-05-01') || k.includes('-05-02')) out[k] = (logs as Record<string, unknown>)[k];
  }
  return out;
}
