import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createAnalytics } from '../services/analytics';
import { supabaseAnalyticsConfig } from '../services/supabase';
import { ACTIVITY_IDS, validAnalyticsEvent } from '../shared/analyticsEvents';
import { createHandler } from '../supabase/functions/analytics/handler';

const id = '12345678-1234-4123-8123-123456789012';
const config = { endpoint: 'https://example.supabase.co/functions/v1/analytics', key: 'sb_publishable_test' };
const tick = () => new Promise<void>(resolve => setTimeout(resolve, 10));
function fixture() {
  const memory = new Map<string, string>();
  const storage = { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => { memory.set(key, value); } };
  let count = 0;
  const uuid = () => `12345678-1234-4123-8123-${String(++count).padStart(12, '0')}`;
  return { storage, uuid };
}
test('analytics is opt-in, with only HTTPS and publishable keys', () => {
  const env = { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: config.key, VITE_ANALYTICS_ENABLED: 'true', VITE_ANALYTICS_PRIVACY_APPROVED: 'true' };
  assert.deepEqual(supabaseAnalyticsConfig(env), config);
  for (const patch of [{ VITE_ANALYTICS_ENABLED: 'false' }, { VITE_ANALYTICS_PRIVACY_APPROVED: 'false' }, { VITE_SUPABASE_URL: 'http://example.com' }, { VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_no' }]) assert.equal(supabaseAnalyticsConfig({ ...env, ...patch }), null);
});
test('event validation rejects unknown activities, PII, invalid IDs and types', () => {
  assert.ok(validAnalyticsEvent({ id, event_type: 'session_started', activity_id: null }));
  for (const activity_id of ACTIVITY_IDS) assert.ok(validAnalyticsEvent({ id, event_type: 'activity_started', activity_id }));
  for (const patch of [{ activity_id: 'unknown' }, { email: 'no@example.com' }, { id: 'bad' }, { event_type: 'answer' }, { activity_id: null }]) assert.equal(validAnalyticsEvent({ id, event_type: 'activity_completed', activity_id: 'math:race', ...patch }), false);
});
test('disabled analytics does not access storage or network', () => {
  const fail = () => { throw Error('must not be called'); };
  const client = createAnalytics(null, { getItem: fail, setItem: fail }, fail);
  client.session(); client.start('math:race'); client.complete('math:race');
});
test('session, start and completion deduplicate across clients/reloads; replay counts', async () => {
  const { storage, uuid } = fixture();
  const events: any[] = [];
  const send = async (_url: unknown, options: RequestInit) => { events.push(JSON.parse(String(options.body))); return new Response(null, { status: 204 }); };
  const first = createAnalytics(config, storage, send as typeof fetch, Date.now, uuid);
  first.session(); first.session(); first.start('math:race'); first.start('math:race'); first.complete('math:race'); first.complete('math:race');
  await tick();
  const second = createAnalytics(config, storage, send as typeof fetch, Date.now, uuid);
  second.session(); second.complete('math:race'); await tick();
  assert.deepEqual(events.map(event => event.event_type), ['session_started', 'activity_started', 'activity_completed']);
  second.start('math:race', true); second.complete('math:race'); await tick();
  assert.equal(events.length, 5);
  assert.equal(new Set(events.map(event => event.id)).size, 5);
});
test('unreachable server cannot throw into game; retry uses the same event ID', async () => {
  const { storage, uuid } = fixture();
  const ids: string[] = []; let fail = true;
  const send = async (_url: unknown, options: RequestInit) => { ids.push(JSON.parse(String(options.body)).id); if (fail) throw Error('offline'); return new Response(null, { status: 204 }); };
  const client = createAnalytics(config, storage, send as typeof fetch, Date.now, uuid);
  client.session(); await tick(); fail = false; client.session(); await tick();
  assert.equal(ids.length, 2); assert.equal(ids[0], ids[1]);
});
test('storage unavailable disables analytics without throwing', () => {
  const fail = () => { throw Error('blocked'); };
  assert.doesNotThrow(() => createAnalytics(config, { getItem: fail, setItem: fail }).start('math:race'));
});
test('active run resumes after reload without a second start', async () => {
  const { storage, uuid } = fixture(); const events: any[] = [];
  const send = (async (_url, options) => { events.push(JSON.parse(String(options?.body))); return new Response(null, { status: 204 }); }) as typeof fetch;
  createAnalytics(config, storage, send, Date.now, uuid).start('math:divide'); await tick();
  const reloaded = createAnalytics(config, storage, send, Date.now, uuid);
  reloaded.start('math:divide'); reloaded.complete('math:divide'); await tick();
  assert.deepEqual(events.map(event => event.event_type), ['session_started', 'activity_started', 'activity_completed']);
});
test('session receipt expires after inactivity', async () => {
  const { storage, uuid } = fixture(); let time = 1000; let calls = 0;
  const client = createAnalytics(config, storage, (async () => { calls++; return new Response(null, { status: 204 }); }) as typeof fetch, () => time, uuid);
  client.session(); await tick(); time += 31 * 60000; client.session(); await tick(); assert.equal(calls, 2);
});
const serverConfig = { enabled: true, origins: ['https://cocokiki.nl'], publishableKey: config.key, url: 'https://example.supabase.co', secret: 'server-only' };
function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://example.supabase.co/functions/v1/analytics', { method: 'POST', headers: { origin: 'https://cocokiki.nl', apikey: config.key, 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
}
test('ingestion forwards only the validated event, never network identifiers', async () => {
  const handler = createHandler(serverConfig, (async (_url, options) => {
    assert.deepEqual(JSON.parse(String(options?.body)), { p_id: id, p_event_type: 'activity_started', p_activity_id: 'math:race' });
    return Response.json(true);
  }) as typeof fetch);
  assert.equal((await handler(request({ id, event_type: 'activity_started', activity_id: 'math:race' }, { 'x-forwarded-for': '192.0.2.1' }))).status, 204);
});
test('ingestion rejects bad origin, keys, fields and oversized streaming bodies', async () => {
  const handler = createHandler(serverConfig, (() => { throw Error('must not forward'); }) as typeof fetch);
  const event = { id, event_type: 'activity_started', activity_id: 'math:race' };
  assert.equal((await handler(request(event, { origin: 'https://evil.test' }))).status, 403);
  assert.equal((await handler(request(event, { apikey: 'wrong' }))).status, 401);
  assert.equal((await handler(request({ ...event, answer: 'private' }))).status, 400);
  assert.equal((await handler(request({ ...event, activity_id: 'unknown' }))).status, 400);
  assert.equal((await handler(request('x'.repeat(600)))).status, 413);
  assert.equal((await handler(request(event, { 'Content-Type': 'text/plain' }))).status, 415);
});
test('server gate, database outage and rate limit fail closed', async () => {
  const event = { id, event_type: 'session_started', activity_id: null };
  assert.equal((await createHandler({ ...serverConfig, enabled: false })(request(event))).status, 503);
  assert.equal((await createHandler(serverConfig, (async () => Response.json(false)) as typeof fetch)(request(event))).status, 429);
  assert.equal((await createHandler(serverConfig, (async () => { throw Error('offline'); }) as typeof fetch)(request(event))).status, 503);
});
test('SQL allowlist matches application and anonymous access is revoked', () => {
  const sql = readFileSync('supabase/migrations/202610310001_activity_events.sql', 'utf8');
  const constraint = sql.slice(sql.indexOf('activity_id in ('), sql.indexOf('create index'));
  const ids = [...constraint.matchAll(/'([^']+)'/g)].map(match => match[1]);
  assert.deepEqual(ids.sort(), [...ACTIVITY_IDS].sort());
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all on public.activity_events from public, anon, authenticated/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, />= 120/);
  assert.match(sql, /revoke all on function.*from public, anon, authenticated/);
});
