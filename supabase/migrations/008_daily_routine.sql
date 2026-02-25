-- Daily Routine Tracker
create table if not exists daily_routine_logs (
  id           uuid primary key default gen_random_uuid(),
  log_date     date not null,
  step_key     text not null,
  completed    boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),

  unique(log_date, step_key)
);

create index idx_routine_logs_date on daily_routine_logs(log_date);

alter table daily_routine_logs enable row level security;
create policy "Allow all access to daily_routine_logs"
  on daily_routine_logs for all using (true) with check (true);
