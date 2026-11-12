-- Integration test for a disposable Supabase test project, AFTER both migrations.
-- All fixture changes and deletions are rolled back, including cleanup history.
begin;
insert into public.activity_events(id, event_type, activity_id, created_at) values
  ('00000000-0000-4000-8000-000000000030', 'session_started', null, now() - interval '30 days'),
  ('00000000-0000-4000-8000-000000000031', 'session_started', null, now() - interval '31 days'),
  ('00000000-0000-4000-8000-000000000001', 'session_started', null, now() - interval '1 day');
select analytics_private.delete_expired_activity_events();
do $$
begin
  if exists (select from public.activity_events where id = '00000000-0000-4000-8000-000000000031') then
    raise exception 'Expired fixture was not removed';
  end if;
  if (select count(*) from public.activity_events where id in ('00000000-0000-4000-8000-000000000030', '00000000-0000-4000-8000-000000000001')) <> 2 then
    raise exception 'Current or exact-boundary fixture was removed';
  end if;
  if has_function_privilege('anon', 'analytics_private.delete_expired_activity_events()', 'execute')
    or has_function_privilege('authenticated', 'analytics_private.delete_expired_activity_events()', 'execute')
    or has_function_privilege('service_role', 'analytics_private.delete_expired_activity_events()', 'execute') then
    raise exception 'Cleanup is executable by a non-admin role';
  end if;
  if not exists (select from cron.job where jobname = 'cocokiki-activity-events-retention' and active and username = 'postgres') then
    raise exception 'Active postgres cleanup schedule is missing';
  end if;
end;
$$;
rollback;
