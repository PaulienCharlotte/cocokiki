// Kinderaccounts via Supabase Auth (REST, geen extra pakket).
// Een gebruikersnaam wordt intern naam@cocokiki.local, zodat kinderen geen e-mail nodig hebben.
import { LOCAL_STATE_EVENT } from './localState';

const URL_BASIS = String(import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '');
const SLEUTEL = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '');
const SESSIE_KEY = 'ck-account:sessie';
const GAST_KEY = 'ck-account:gast';
const DOMEIN = '@cocokiki.local';

export interface Sessie { access_token: string; refresh_token: string; expires_at: number; user_id: string; naam: string }

export const accountsBeschikbaar = () => /^https:\/\//.test(URL_BASIS) && !URL_BASIS.includes('YOUR_PROJECT') && SLEUTEL.length > 10;

export function normaliseerNaam(naam: string) { return naam.trim().toLowerCase().replace(/\s+/g, '-'); }
export function naamGeldig(naam: string) { return /^[a-z0-9][a-z0-9_-]{2,23}$/.test(normaliseerNaam(naam)); }

export function leesSessie(): Sessie | null {
  try { return JSON.parse(localStorage.getItem(SESSIE_KEY) ?? 'null'); } catch { return null; }
}
function bewaarSessie(s: Sessie | null) {
  try { s ? localStorage.setItem(SESSIE_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSIE_KEY); } catch { /* geen opslag */ }
}
export const isGast = () => { try { return localStorage.getItem(GAST_KEY) === '1'; } catch { return false; } };
export const speelAlsGast = () => { try { localStorage.setItem(GAST_KEY, '1'); } catch { /* geen opslag */ } };

async function auth(pad: string, body: object) {
  const res = await fetch(`${URL_BASIS}/auth/v1/${pad}`, { method: 'POST', headers: { apikey: SLEUTEL, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(vertaalFout(data));
  return data;
}
function vertaalFout(data: { msg?: string; error_description?: string; message?: string; error_code?: string }) {
  const t = `${data.error_code ?? ''} ${data.msg ?? data.error_description ?? data.message ?? ''}`.toLowerCase();
  if (t.includes('invalid') && t.includes('credentials')) return 'Die naam en dat wachtwoord passen niet bij elkaar.';
  if (t.includes('already') || t.includes('exists')) return 'Die naam is al bezet. Kies een andere.';
  if (t.includes('password')) return 'Kies een wachtwoord van minstens 6 tekens.';
  if (t.includes('confirm')) return 'Het account moet nog bevestigd worden.';
  return 'Het lukt even niet. Probeer het zo nog eens.';
}
function naarSessie(data: { access_token: string; refresh_token: string; expires_in: number; user: { id: string; email?: string } }): Sessie {
  return { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: Date.now() + data.expires_in * 1000, user_id: data.user.id, naam: (data.user.email ?? '').replace(DOMEIN, '') };
}

export async function maakAccount(naam: string, wachtwoord: string) {
  const data = await auth('signup', { email: normaliseerNaam(naam) + DOMEIN, password: wachtwoord });
  if (!data.access_token) throw new Error('Zet in Supabase "Confirm email" uit, dan kun je meteen spelen.');
  return start(naarSessie(data), false);
}
export async function logIn(naam: string, wachtwoord: string) {
  return start(naarSessie(await auth('token?grant_type=password', { email: normaliseerNaam(naam) + DOMEIN, password: wachtwoord })), true);
}

async function geldigeSessie(): Promise<Sessie | null> {
  const s = leesSessie();
  if (!s) return null;
  if (s.expires_at - Date.now() > 60_000) return s;
  try { const nieuw = naarSessie(await auth('token?grant_type=refresh_token', { refresh_token: s.refresh_token })); bewaarSessie(nieuw); return nieuw; }
  catch { return s; }
}

// ---- Voortgang ----
const hoortBijVoortgang = (k: string) => k.startsWith('cocokiki') || k.startsWith('topo-coco');
function momentopname() {
  const uit: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i)!; if (hoortBijVoortgang(k)) uit[k] = localStorage.getItem(k)!; }
  return uit;
}
function wisLokaal() {
  const weg: string[] = [];
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i)!; if (hoortBijVoortgang(k)) weg.push(k); }
  weg.forEach(k => localStorage.removeItem(k));
}
const rest = (s: Sessie, extra: Record<string, string> = {}) => ({ apikey: SLEUTEL, Authorization: `Bearer ${s.access_token}`, 'Content-Type': 'application/json', ...extra });

export async function bewaarVoortgang(): Promise<boolean> {
  const s = await geldigeSessie();
  if (!s) return false;
  const res = await fetch(`${URL_BASIS}/rest/v1/kind_voortgang?on_conflict=user_id`, {
    method: 'POST', keepalive: true, headers: rest(s, { Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify({ user_id: s.user_id, gegevens: momentopname(), bijgewerkt: new Date().toISOString() }),
  }).catch(() => null);
  return !!res?.ok;
}

async function start(s: Sessie, bestaand: boolean) {
  bewaarSessie(s);
  if (bestaand) {
    const res = await fetch(`${URL_BASIS}/rest/v1/kind_voortgang?select=gegevens&user_id=eq.${s.user_id}`, { headers: rest(s) });
    const rijen = res.ok ? await res.json() : [];
    if (rijen[0]?.gegevens) {
      wisLokaal();
      for (const [k, v] of Object.entries(rijen[0].gegevens as Record<string, string>)) localStorage.setItem(k, v);
      return s;
    }
  }
  await bewaarVoortgang(); // nieuw account neemt het spel van dit apparaat mee
  return s;
}

// Pas wissen als het bewaren echt gelukt is: een kind mag nooit werk kwijtraken.
export async function logUit() {
  if (!(await bewaarVoortgang())) throw new Error('Je spel kon nog niet bewaard worden. Check of je internet hebt en probeer het nog eens.');
  bewaarSessie(null);
  wisLokaal();
  try { localStorage.removeItem(GAST_KEY); } catch { /* geen opslag */ }
  window.location.reload();
}

export function naarInloggen() {
  try { localStorage.removeItem(GAST_KEY); } catch { /* geen opslag */ }
  window.location.reload();
}

let gestart = false;
export function startAutoBewaren() {
  if (gestart || !leesSessie()) return;
  gestart = true;
  let timer: number | undefined;
  const plan = () => { clearTimeout(timer); timer = window.setTimeout(bewaarVoortgang, 4000); };
  window.addEventListener(LOCAL_STATE_EVENT, plan);
  window.addEventListener('cocokiki:currency-change', plan);
  window.setInterval(bewaarVoortgang, 60_000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') bewaarVoortgang(); });
}
