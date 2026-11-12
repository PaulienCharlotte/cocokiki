begin;
create table public.activity_events (
  id uuid primary key,
  event_type text not null check (event_type in ('session_started', 'activity_started', 'activity_completed')),
  activity_id text,
  created_at timestamptz not null default now(),
  constraint valid_activity check (
    (event_type = 'session_started' and activity_id is null) or
    (event_type in ('activity_started', 'activity_completed') and activity_id is not null and activity_id in (
      'math:multiply','math:divide','math:add-subtract','math:missing','math:balance','math:race',
      'clock:memory','clock:set-clock','clock:race','clock:world-times',
      'topo:find','topo:spell','topo:master','topo:memory','topo:quiz','topo:test',
      'flags-memory','red-baby-lua','cooking:banana-pancakes','cooking:blueberry-muffins','cooking:fruit-yogurt','plant-clinic'
    ))
  )
);
create index activity_events_created_at_idx on public.activity_events(created_at);
alter table public.activity_events enable row level security;
revoke all on public.activity_events from public, anon, authenticated;

-- One global, concurrency-safe sliding-window limit, without IPs or visitor IDs.
create function public.ingest_activity_event(p_id uuid, p_event_type text, p_activity_id text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare existing public.activity_events%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(3102026);
  select * into existing from public.activity_events where id = p_id;
  if found then
    return existing.event_type = p_event_type and existing.activity_id is not distinct from p_activity_id;
  end if;
  if (select count(*) from public.activity_events where created_at > pg_catalog.clock_timestamp() - interval '1 minute') >= 120 then return false; end if;
  insert into public.activity_events(id, event_type, activity_id) values (p_id, p_event_type, p_activity_id);
  return true;
end;
$$;
revoke all on function public.ingest_activity_event(uuid,text,text) from public, anon, authenticated;
grant execute on function public.ingest_activity_event(uuid,text,text) to service_role;
commit;
