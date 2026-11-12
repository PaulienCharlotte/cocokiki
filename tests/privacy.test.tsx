import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PrivacyScreen from '../pages/PrivacyScreen';
import SiteFooter from '../components/platform/SiteFooter';
import AppShell from '../components/platform/AppShell';
import WorldHub from '../pages/WorldHub';
import { resolveRoute } from '../platform/routes';

test('privacy route works directly and normalizes a trailing slash', () => {
  assert.deepEqual(resolveRoute('/privacy'), { route: { page: 'privacy', path: '/privacy' }, redirect: false });
  assert.equal(resolveRoute('/privacy/').route.page, 'privacy');
});

test('privacy page explains actual storage and labels unresolved legal details', () => {
  const html = renderToStaticMarkup(<PrivacyScreen />);
  assert.match(html, /<main[^>]+aria-labelledby="privacy-title"/);
  for (const text of ['Voor kinderen', 'TODO:', 'privacycontact', 'localStorage', 'sessionStorage', '30 minuten', '30 dagen', '31 dagen', 'Netlify', 'Supabase', 'unpkg', 'Esri', 'AVG-grondslag', 'toestemming', 'Rechten van ouders', 'uitgeschakeld']) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /<form|type="email"|sb_secret_|service_role|sb_publishable_/);
});

test('a real, discrete privacy link exists in the home and shared footer', () => {
  const footer = renderToStaticMarkup(<SiteFooter />);
  assert.match(footer, /<footer[^>]*><a href="\/privacy">Privacy<\/a><\/footer>/);
  assert.match(renderToStaticMarkup(<WorldHub coins={0} onNavigate={() => undefined} />), /href="\/privacy"/);
  assert.match(renderToStaticMarkup(<AppShell coins={0} onHome={() => undefined}>Inhoud</AppShell>), /href="\/privacy"/);
});

test('retention migration is private, scheduled and leaves game tables and RLS alone', () => {
  const sql = readFileSync('supabase/migrations/202610310002_activity_events_retention.sql', 'utf8');
  assert.match(sql, /current_user <> 'postgres'/);
  assert.match(sql, /create extension if not exists pg_cron/);
  assert.match(sql, /security invoker set search_path = ''/);
  assert.match(sql, /where created_at < pg_catalog.now\(\) - interval '30 days'/);
  assert.match(sql, /get diagnostics removed = row_count/);
  assert.match(sql, /revoke all on function.*from public, anon, authenticated, service_role/);
  assert.match(sql, /cron.schedule\([\s\S]*'cocokiki-activity-events-retention',[\s\S]*'10 3 \* \* \*'/);
  assert.match(sql, /end_time < pg_catalog.now\(\) - interval '30 days'/);
  assert.doesNotMatch(sql, /disable row level security|grant.*to (?:public|anon|authenticated|service_role)|security definer|truncate|delete from public\.(?!activity_events)/i);
});

test('retention checks are read-only; integration fixtures roll back', () => {
  const checks = readFileSync('supabase/queries/check_activity_events_retention.sql', 'utf8');
  assert.match(checks, /cron.job_run_details/);
  assert.match(checks, /interval '31 days'/);
  assert.match(checks, /relrowsecurity/);
  assert.doesNotMatch(checks, /\b(?:delete|insert|update|alter|drop|truncate)\b/i);
  const integration = readFileSync('supabase/tests/activity_events_retention.sql', 'utf8');
  assert.match(integration, /exact-boundary fixture/);
  assert.match(integration, /rollback;\s*$/);
});
