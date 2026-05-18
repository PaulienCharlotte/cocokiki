-- ============================================================================
-- Cocokiki Topo — Row Level Security (RLS) policies
--
-- HOE TE GEBRUIKEN:
--   1. Open https://supabase.com/dashboard/project/tubmxjjoirkrfnjongph
--   2. Ga naar "SQL Editor" → "New query"
--   3. Plak DIT HELE BESTAND in de editor
--   4. Klik "Run"
--   5. Lees DEEL 8 onderaan: voeg jezelf toe als admin
--
-- WAT DIT DOET:
--   • Sluit het kritieke lek op location_photos en site_assets
--     (anon kan nu géén rijen meer toevoegen/verwijderen)
--   • Garandeert dat users alleen hun eigen scores zien/aanpassen
--   • Beperkt foto/asset writes tot leden van de "admins" tabel
--   • Maakt de Storage buckets publiek leesbaar maar admin-only schrijfbaar
--
-- LET OP:
--   Na deze SQL werkt het admin upload-dashboard NIET meer met enkel de PIN.
--   Je moet een Supabase-account aanmaken via de site, dat user-id toevoegen
--   aan de "admins" tabel, en daarna ingelogd zijn om uploads te doen.
--   Tot we de AdminDashboard ook updaten, kun je foto's tijdelijk uploaden
--   via Supabase Dashboard → Storage → location-photos.
-- ============================================================================


-- ──────────────────────────────────────────────────────────────────────────────
-- 1) admins-tabel + helper
-- ──────────────────────────────────────────────────────────────────────────────

create table if not exists public.admins (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);

alter table public.admins enable row level security;
-- Geen policies op admins-tabel = niemand kan via de REST API
-- de inhoud lezen of wijzigen. Alleen de service_role (Supabase
-- Dashboard / SQL editor) kan rijen toevoegen.

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;


-- ──────────────────────────────────────────────────────────────────────────────
-- 2) profiles — user mag eigen profiel lezen en updaten
-- ──────────────────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);


-- ──────────────────────────────────────────────────────────────────────────────
-- 3) score_sessions — user mag alleen eigen sessies inserten en lezen
-- ──────────────────────────────────────────────────────────────────────────────

alter table public.score_sessions enable row level security;

drop policy if exists "scores_select_own" on public.score_sessions;
drop policy if exists "scores_insert_own" on public.score_sessions;

create policy "scores_select_own" on public.score_sessions
  for select using (auth.uid() = user_id);

create policy "scores_insert_own" on public.score_sessions
  for insert with check (auth.uid() = user_id);


-- ──────────────────────────────────────────────────────────────────────────────
-- 4) location_progress — user mag alleen eigen voortgang beheren
-- ──────────────────────────────────────────────────────────────────────────────

alter table public.location_progress enable row level security;

drop policy if exists "progress_select_own" on public.location_progress;
drop policy if exists "progress_insert_own" on public.location_progress;
drop policy if exists "progress_update_own" on public.location_progress;

create policy "progress_select_own" on public.location_progress
  for select using (auth.uid() = user_id);

create policy "progress_insert_own" on public.location_progress
  for insert with check (auth.uid() = user_id);

create policy "progress_update_own" on public.location_progress
  for update using (auth.uid() = user_id);


-- ──────────────────────────────────────────────────────────────────────────────
-- 5) location_photos — iedereen mag LEZEN, alleen admins mogen schrijven
--    (KRITIEKE FIX: voorheen kon anon inserten/verwijderen)
-- ──────────────────────────────────────────────────────────────────────────────

alter table public.location_photos enable row level security;

drop policy if exists "photos_select_all"   on public.location_photos;
drop policy if exists "photos_insert_admin" on public.location_photos;
drop policy if exists "photos_update_admin" on public.location_photos;
drop policy if exists "photos_delete_admin" on public.location_photos;

create policy "photos_select_all" on public.location_photos
  for select using (true);

create policy "photos_insert_admin" on public.location_photos
  for insert with check (public.is_admin());

create policy "photos_update_admin" on public.location_photos
  for update using (public.is_admin());

create policy "photos_delete_admin" on public.location_photos
  for delete using (public.is_admin());


-- ──────────────────────────────────────────────────────────────────────────────
-- 6) site_assets — zelfde regels als location_photos
--    (KRITIEKE FIX: voorheen kon anon inserten/verwijderen)
-- ──────────────────────────────────────────────────────────────────────────────

alter table public.site_assets enable row level security;

drop policy if exists "assets_select_all"   on public.site_assets;
drop policy if exists "assets_insert_admin" on public.site_assets;
drop policy if exists "assets_update_admin" on public.site_assets;
drop policy if exists "assets_delete_admin" on public.site_assets;

create policy "assets_select_all" on public.site_assets
  for select using (true);

create policy "assets_insert_admin" on public.site_assets
  for insert with check (public.is_admin());

create policy "assets_update_admin" on public.site_assets
  for update using (public.is_admin());

create policy "assets_delete_admin" on public.site_assets
  for delete using (public.is_admin());


-- ──────────────────────────────────────────────────────────────────────────────
-- 7) Storage buckets — publiek lezen, alleen admins schrijven/verwijderen
-- ──────────────────────────────────────────────────────────────────────────────

-- location-photos
drop policy if exists "Public read location-photos"   on storage.objects;
drop policy if exists "Admin write location-photos"   on storage.objects;
drop policy if exists "Admin delete location-photos"  on storage.objects;

create policy "Public read location-photos" on storage.objects
  for select using (bucket_id = 'location-photos');

create policy "Admin write location-photos" on storage.objects
  for insert with check (bucket_id = 'location-photos' and public.is_admin());

create policy "Admin delete location-photos" on storage.objects
  for delete using (bucket_id = 'location-photos' and public.is_admin());

-- site-assets
drop policy if exists "Public read site-assets"   on storage.objects;
drop policy if exists "Admin write site-assets"   on storage.objects;
drop policy if exists "Admin delete site-assets"  on storage.objects;

create policy "Public read site-assets" on storage.objects
  for select using (bucket_id = 'site-assets');

create policy "Admin write site-assets" on storage.objects
  for insert with check (bucket_id = 'site-assets' and public.is_admin());

create policy "Admin delete site-assets" on storage.objects
  for delete using (bucket_id = 'site-assets' and public.is_admin());


-- ──────────────────────────────────────────────────────────────────────────────
-- 8) MAAK JEZELF ADMIN  ⬅  vergeet deze stap niet!
--
--    Volgorde:
--    a) Open je site (www.cocokiki.nl) en registreer eenmalig een account
--       via het login-formulier (charlotte.paulien@gmail.com).
--    b) Run de regel hieronder (haal het commentaar `--` ervoor weg)
--       en vervang het email-adres met dat van jouw account.
-- ──────────────────────────────────────────────────────────────────────────────

-- insert into public.admins (user_id)
-- select id from auth.users where email = 'charlotte.paulien@gmail.com';

-- Check welke users er nu zijn (om het juiste UUID te zien):
-- select id, email from auth.users order by created_at desc;

-- Check wie er al admin is:
-- select a.user_id, u.email from public.admins a join auth.users u on u.id = a.user_id;


-- ──────────────────────────────────────────────────────────────────────────────
-- 9) Verificatie — run deze SELECT na het uitvoeren van bovenstaande
--    om te bevestigen dat RLS overal aan staat
-- ──────────────────────────────────────────────────────────────────────────────

-- select
--   schemaname, tablename, rowsecurity
-- from pg_tables
-- where schemaname = 'public'
-- order by tablename;
