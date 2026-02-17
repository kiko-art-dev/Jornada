-- Task dependencies
create table if not exists task_dependencies (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  depends_on_task_id uuid not null references tasks(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(task_id, depends_on_task_id)
);

create index if not exists idx_task_dependencies_task_id on task_dependencies(task_id);
create index if not exists idx_task_dependencies_depends_on on task_dependencies(depends_on_task_id);
