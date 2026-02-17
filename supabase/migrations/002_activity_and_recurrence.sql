-- Activity log for tasks
create table if not exists task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  action text not null,
  field text,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);

create index if not exists idx_task_activity_task_id on task_activity(task_id);

-- Recurrence support
alter table tasks add column if not exists recurrence_rule text;
alter table tasks add column if not exists recurrence_source_id uuid references tasks(id);
