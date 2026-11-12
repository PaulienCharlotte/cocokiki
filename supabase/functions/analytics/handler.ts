import { validAnalyticsEvent } from '../../../shared/analyticsEvents.ts';

export interface IngestConfig { enabled: boolean; origins: string[]; publishableKey: string; url: string; secret: string }
export function createHandler(config: IngestConfig, send: typeof fetch = fetch) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('origin') ?? '';
    const allowed = config.origins.includes(origin);
    const headers = { 'Access-Control-Allow-Origin': allowed ? origin : 'null', 'Access-Control-Allow-Headers': 'apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin', 'Cache-Control': 'no-store' };
    const reply = (status: number) => new Response(null, { status, headers });
    if (!allowed) return reply(403);
    if (request.method === 'OPTIONS') return reply(204);
    if (request.method !== 'POST') return reply(405);
    if (!config.enabled) return reply(503);
    if (!config.publishableKey || request.headers.get('apikey') !== config.publishableKey) return reply(401);
    if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') return reply(415);
    try {
      // Bound the stream itself: Content-Length can be missing or dishonest.
      const reader = request.body?.getReader(); if (!reader) return reply(400);
      let size = 0, body = '';
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        size += value.byteLength;
        if (size > 512) { await reader.cancel(); return reply(413); }
        body += decoder.decode(value, { stream: true });
      }
      body += decoder.decode();
      let event: unknown;
      try { event = JSON.parse(body); } catch { return reply(400); }
      if (!validAnalyticsEvent(event)) return reply(400);
      const response = await send(`${config.url}/rest/v1/rpc/ingest_activity_event`, {
        method: 'POST', headers: { apikey: config.secret, Authorization: `Bearer ${config.secret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_id: event.id, p_event_type: event.event_type, p_activity_id: event.activity_id }), signal: AbortSignal.timeout(3000),
      });
      if (!response.ok) return reply(503);
      return reply(await response.json() === true ? 204 : 429);
    } catch { return reply(503); }
  };
}
