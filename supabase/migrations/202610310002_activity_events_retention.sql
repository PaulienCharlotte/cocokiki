-- Run as postgres, after 202610310001_activity_events.sql. Does not enable analytics.
begin;
do $$
begin
  if current_user <> 'postgres' then
    raise exception 'Run this migration as postgres in the Supabase SQL Editor.';
  end if;
end;
$$;

create extension if not exists pg_cron with schema pg_catalog;
create schema if not exists analytics_private;
revoke all on schema analytics_private from public, anon, authenticated, service_role;

create or replace function analytics_private.delete_expired_activity_events()
returns bigint language plpgsql security invoker set search_path = '' as $$
declare removed bigint;
begin
  delete from public.activity_events
  where created_at < pg_catalog.now() - interval '30 days';
  get diagnostics removed = row_count;
  -- Keep only this task's execution history for 30 days, not other jobs' logs.
  delete from cron.job_run_details
  where jobid in (select jobid from cron.job where jobname = 'cocokiki-activity-events-retention')
    and end_time < pg_catalog.now() - interval '30 days';
  return removed;
end;
$$;
revoke all on function analytics_private.delete_expired_activity_events() from public, anon, authenticated, service_role;
grant usage on schema analytics_private to postgres;
grant execute on function analytics_private.delete_expired_activity_events() to postgres;

-- A stable name replaces this job if the migration is deliberately rerun.
-- Daily at 03:10 in cron.timezone (GMT/UTC by default on Supabase).
select cron.schedule(
  'cocokiki-activity-events-retention',
  '10 3 * * *',
  $$select analytics_private.delete_expired_activity_events();$$
);
commit;
