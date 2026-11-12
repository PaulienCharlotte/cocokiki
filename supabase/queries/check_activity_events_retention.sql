-- Read-only checks; run as postgres, never expose these queries through the frontend.
select jobid, jobname, schedule, active, username,
  coalesce(current_setting('cron.timezone', true), 'GMT (default)') as scheduler_timezone
from cron.job where jobname = 'cocokiki-activity-events-retention';

select r.start_time, r.end_time, r.status, r.return_message
from cron.job_run_details r
join cron.job j on j.jobid = r.jobid
where j.jobname = 'cocokiki-activity-events-retention'
order by r.start_time desc limit 10;

select
  count(*) filter (where created_at < now() - interval '30 days') as awaiting_next_daily_run,
  count(*) filter (where created_at < now() - interval '31 days') as overdue_check_job
from public.activity_events;

select relrowsecurity as rls_enabled
from pg_class where oid = 'public.activity_events'::regclass;

select role_name,
  has_function_privilege(role_name, 'analytics_private.delete_expired_activity_events()', 'execute') as may_execute_cleanup,
  has_schema_privilege(role_name, 'analytics_private', 'usage') as may_access_private_schema
from (values ('anon'), ('authenticated'), ('service_role')) as roles(role_name);
