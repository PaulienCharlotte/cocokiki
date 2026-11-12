import test from 'node:test';
import assert from 'node:assert/strict';
import { createStaticJsonLoader } from '../services/staticJson';
import { netlifyCacheHeaders } from '../scripts/netlifyCacheHeaders';

test('statische JSON-aanvragen delen lopende en afgeronde antwoorden zonder voortgang op te slaan', async () => {
  let calls = 0;
  let finish!: (response: Response) => void;
  const request = (() => { calls++; return new Promise<Response>(resolve => { finish = resolve; }); }) as typeof fetch;
  const load = createStaticJsonLoader(request);
  const first = load('/data/example.json'); const second = load('/data/example.json');
  assert.equal(first, second);
  await Promise.resolve(); assert.equal(calls, 1);
  finish(new Response('{"features":[1,2]}', { status: 200 }));
  const data = await first;
  assert.equal(await second, data);
  assert.equal(await load('/data/example.json'), data);
  assert.equal(calls, 1);
});

test('mislukte netwerk- of JSON-antwoorden kunnen opnieuw worden geladen', async () => {
  let calls = 0;
  const load = createStaticJsonLoader((async () => {
    calls++;
    return calls === 1 ? new Response('', { status: 503 }) : calls === 2 ? new Response('{') : new Response('{"ok":true}');
  }) as typeof fetch);
  await assert.rejects(load('/map.json'), /503/);
  await assert.rejects(load('/map.json'));
  assert.deepEqual(await load('/map.json'), { ok: true });
  assert.equal(calls, 3);
});

test('alleen inhoudsgehashte buildbestanden krijgen immutable, HTML en library-assets niet', () => {
  const headers = netlifyCacheHeaders(['assets/index-AbCd1234.js', 'assets/styles-aBcD1234.css', 'assets/world-map-v2-CSHY8QvW.webp', 'assets/library/cooking/pan.webp', 'assets/plain.js', 'index.html']);
  assert.match(headers, /\/assets\/index-AbCd1234\.js\n  Cache-Control: public, max-age=31536000, immutable/);
  assert.match(headers, /\/assets\/world-map-v2-CSHY8QvW\.webp\n  Cache-Control: public, max-age=31536000, immutable/);
  assert.doesNotMatch(headers, /library|plain\.js|\/index\.html\n/);
  assert.match(headers, /\/\*\n  Cache-Control: public, max-age=0, must-revalidate/);
  assert.ok(headers.indexOf('immutable') < headers.indexOf('/*'));
});
