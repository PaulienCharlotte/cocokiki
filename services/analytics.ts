import { validAnalyticsEvent, type ActivityId, type AnalyticsEvent } from '../shared/analyticsEvents';
import { supabaseAnalyticsConfig } from './supabase';

const KEY = 'cocokiki:analytics:tab:v1';
const TTL = 30 * 60 * 1000;
interface TabState { touched: number; session: string; sessionSent?: boolean; runs: Partial<Record<ActivityId, { start: string; complete?: string }>>; pending: AnalyticsEvent[] }
export function createAnalytics(config: ReturnType<typeof supabaseAnalyticsConfig>, storage: Pick<Storage, 'getItem' | 'setItem'>, send: typeof fetch = fetch, now = Date.now, uuid: () => string = () => crypto.randomUUID()) {
  let busy = false;
  function read(): TabState {
    const raw = JSON.parse(storage.getItem(KEY) ?? 'null');
    if (raw && now() - raw.touched < TTL && raw.touched <= now() && typeof raw.session === 'string' && raw.runs && Array.isArray(raw.pending) && raw.pending.every(validAnalyticsEvent)) return raw;
    return { touched: now(), session: uuid(), runs: {}, pending: [] };
  }
  function write(state: TabState) { state.touched = now(); storage.setItem(KEY, JSON.stringify(state)); }
  async function flush() {
    if (!config || busy) return;
    busy = true;
    try {
      for (let count = 0; count < 100; count++) {
        const event = read().pending[0];
        if (!event) break;
        const response = await send(config.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: config.key }, body: JSON.stringify(event), credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(3000) });
        if (!response.ok) break;
        const state = read(); state.pending = state.pending.filter(item => item.id !== event.id); write(state);
      }
    } catch { /* Analytics must never interrupt a game. Pending events retry on the next event/reload. */ }
    finally { busy = false; }
  }
  function update(change: (state: TabState) => void) {
    if (!config) return;
    try {
      const state = read();
      if (!state.sessionSent) {
        state.sessionSent = true;
        state.pending.push({ id: state.session, event_type: 'session_started', activity_id: null });
      }
      change(state); state.pending = state.pending.slice(-100); write(state); void flush();
    } catch { /* Unavailable tab storage disables tracking. */ }
  }
  return {
    session() { update(() => undefined); },
    start(activity: ActivityId, fresh = false) { update(state => {
      if (!validAnalyticsEvent({ id: state.session, event_type: 'activity_started', activity_id: activity })) return;
      if (!fresh && state.runs[activity] && !state.runs[activity].complete) return;
      const id = uuid(); state.runs[activity] = { start: id };
      state.pending.push({ id, event_type: 'activity_started', activity_id: activity });
    }); },
    complete(activity: ActivityId) { update(state => {
      const run = state.runs[activity]; if (!run || run.complete) return;
      run.complete = uuid(); state.pending.push({ id: run.complete, event_type: 'activity_completed', activity_id: activity });
    }); },
  };
}
let client: ReturnType<typeof createAnalytics> | undefined;
export function analytics() {
  if (client) return client;
  try { client = createAnalytics(supabaseAnalyticsConfig(), window.sessionStorage); } catch { client = createAnalytics(null, { getItem: () => null, setItem: () => undefined }); }
  return client;
}
