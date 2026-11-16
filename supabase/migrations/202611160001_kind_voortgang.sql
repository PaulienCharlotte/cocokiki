-- Voortgang per kind: één rij per account, alleen zichtbaar voor dat kind zelf.
create table if not exists public.kind_voortgang (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gegevens jsonb not null default '{}'::jsonb,
  bijgewerkt timestamptz not null default now()
);
alter table public.kind_voortgang enable row level security;
drop policy if exists "eigen voortgang lezen" on public.kind_voortgang;
drop policy if exists "eigen voortgang toevoegen" on public.kind_voortgang;
drop policy if exists "eigen voortgang wijzigen" on public.kind_voortgang;
create policy "eigen voortgang lezen" on public.kind_voortgang for select using (auth.uid() = user_id);
create policy "eigen voortgang toevoegen" on public.kind_voortgang for insert with check (auth.uid() = user_id);
create policy "eigen voortgang wijzigen" on public.kind_voortgang for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
