-- ============================================================
-- JORNADA — Initial Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- WORKSPACES (Art, UE5 Plugins, Job Hunt, Life)
-- ============================================================
create table workspaces (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  icon        text,
  color       text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- PROJECTS (belong to a workspace)
-- ============================================================
create table projects (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  name          text not null,
  description   text,
  type          text not null default 'general',
  sort_order    integer not null default 0,
  archived      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_projects_workspace on projects(workspace_id);

-- ============================================================
-- STATUSES (custom per project, ordered)
-- ============================================================
create table statuses (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references projects(id) on delete cascade,
  name        text not null,
  category    text not null default 'active',
  color       text,
  sort_order  integer not null default 0,
  is_default  boolean not null default false
);

create index idx_statuses_project on statuses(project_id);

-- ============================================================
-- TAGS (global, cross-project)
-- ============================================================
create table tags (
  id     uuid primary key default uuid_generate_v4(),
  name   text not null unique,
  color  text
);

-- ============================================================
-- RELEASES (for dev projects — semantic versioning)
-- ============================================================
create table releases (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid not null references projects(id) on delete cascade,
  version       text not null,
  title         text,
  status        text not null default 'draft',
  target_date   date,
  released_date date,
  changelog_md  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(project_id, version)
);

create index idx_releases_project on releases(project_id);

-- ============================================================
-- TASKS (the atomic unit)
-- ============================================================
create table tasks (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid references projects(id) on delete set null,
  status_id     uuid references statuses(id) on delete set null,
  release_id    uuid references releases(id) on delete set null,
  title         text not null,
  description   text,
  type          text not null default 'task',
  priority      integer not null default 4,
  due_date      date,
  sort_order    integer not null default 0,
  archived      boolean not null default false,
  severity      text,
  repro_steps   text,
  expected      text,
  actual        text,
  environment   jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_tasks_project on tasks(project_id);
create index idx_tasks_status on tasks(status_id);
create index idx_tasks_release on tasks(release_id);
create index idx_tasks_priority on tasks(priority);
create index idx_tasks_due_date on tasks(due_date) where due_date is not null;
create index idx_tasks_archived on tasks(archived) where archived = false;

-- ============================================================
-- TASK <-> TAG (many-to-many)
-- ============================================================
create table task_tags (
  task_id  uuid not null references tasks(id) on delete cascade,
  tag_id   uuid not null references tags(id) on delete cascade,
  primary key (task_id, tag_id)
);

create index idx_task_tags_tag on task_tags(tag_id);

-- ============================================================
-- CHECKLIST ITEMS (belong to a task)
-- ============================================================
create table checklist_items (
  id          uuid primary key default uuid_generate_v4(),
  task_id     uuid not null references tasks(id) on delete cascade,
  title       text not null,
  checked     boolean not null default false,
  sort_order  integer not null default 0
);

create index idx_checklist_task on checklist_items(task_id);

-- ============================================================
-- TASK NOTES (append-only log)
-- ============================================================
create table task_notes (
  id          uuid primary key default uuid_generate_v4(),
  task_id     uuid not null references tasks(id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now()
);

create index idx_notes_task on task_notes(task_id);

-- ============================================================
-- UPDATED_AT TRIGGER (auto-update timestamp)
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_workspaces_updated before update on workspaces
  for each row execute function update_updated_at();
create trigger trg_projects_updated before update on projects
  for each row execute function update_updated_at();
create trigger trg_releases_updated before update on releases
  for each row execute function update_updated_at();
create trigger trg_tasks_updated before update on tasks
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (single user — authenticated access)
-- ============================================================
alter table workspaces enable row level security;
alter table projects enable row level security;
alter table statuses enable row level security;
alter table tags enable row level security;
alter table releases enable row level security;
alter table tasks enable row level security;
alter table task_tags enable row level security;
alter table checklist_items enable row level security;
alter table task_notes enable row level security;

create policy "Authenticated users have full access" on workspaces
  for all using (auth.role() = 'authenticated');
create policy "Authenticated users have full access" on projects
  for all using (auth.role() = 'authenticated');
create policy "Authenticated users have full access" on statuses
  for all using (auth.role() = 'authenticated');
create policy "Authenticated users have full access" on tags
  for all using (auth.role() = 'authenticated');
create policy "Authenticated users have full access" on releases
  for all using (auth.role() = 'authenticated');
create policy "Authenticated users have full access" on tasks
  for all using (auth.role() = 'authenticated');
create policy "Authenticated users have full access" on task_tags
  for all using (auth.role() = 'authenticated');
create policy "Authenticated users have full access" on checklist_items
  for all using (auth.role() = 'authenticated');
create policy "Authenticated users have full access" on task_notes
  for all using (auth.role() = 'authenticated');

-- ============================================================
-- SEED DATA — Default workspaces, projects, and statuses
-- ============================================================

-- Workspaces
insert into workspaces (name, icon, color, sort_order) values
  ('Art', '🎨', '#a855f7', 0),
  ('UE5 Plugins', '🔧', '#3b82f6', 1),
  ('Job Hunt', '💼', '#f97316', 2),
  ('Life', '🌱', '#22c55e', 3);

-- Projects (one per workspace to start)
insert into projects (workspace_id, name, type, sort_order)
select id, 'Environment Concepts', 'art', 0 from workspaces where name = 'Art';

insert into projects (workspace_id, name, type, sort_order)
select id, 'MyPlugin v2', 'dev', 0 from workspaces where name = 'UE5 Plugins';

insert into projects (workspace_id, name, type, sort_order)
select id, 'Applications 2026', 'job', 0 from workspaces where name = 'Job Hunt';

insert into projects (workspace_id, name, type, sort_order)
select id, 'Admin & Finance', 'life', 0 from workspaces where name = 'Life';

-- Art statuses
insert into statuses (project_id, name, category, color, sort_order, is_default)
select p.id, s.name, s.category, s.color, s.sort_order, s.is_default
from projects p
cross join (values
  ('Idea',      'backlog', '#6b7280', 0, true),
  ('Reference', 'backlog', '#3b82f6', 1, false),
  ('Sketch',    'active',  '#eab308', 2, false),
  ('Rendering', 'active',  '#f97316', 3, false),
  ('Polish',    'active',  '#a855f7', 4, false),
  ('Done',      'done',    '#22c55e', 5, false)
) as s(name, category, color, sort_order, is_default)
where p.name = 'Environment Concepts';

-- Dev statuses
insert into statuses (project_id, name, category, color, sort_order, is_default)
select p.id, s.name, s.category, s.color, s.sort_order, s.is_default
from projects p
cross join (values
  ('Backlog',     'backlog', '#6b7280', 0, true),
  ('Todo',        'backlog', '#3b82f6', 1, false),
  ('In Progress', 'active',  '#eab308', 2, false),
  ('In Review',   'active',  '#f97316', 3, false),
  ('Done',        'done',    '#22c55e', 4, false),
  ('Won''t Fix',  'done',    '#ef4444', 5, false)
) as s(name, category, color, sort_order, is_default)
where p.name = 'MyPlugin v2';

-- Job Hunt statuses
insert into statuses (project_id, name, category, color, sort_order, is_default)
select p.id, s.name, s.category, s.color, s.sort_order, s.is_default
from projects p
cross join (values
  ('Found',        'backlog', '#6b7280', 0, true),
  ('Applied',      'active',  '#3b82f6', 1, false),
  ('Phone Screen', 'active',  '#eab308', 2, false),
  ('Interview',    'active',  '#f97316', 3, false),
  ('Offer',        'active',  '#22c55e', 4, false),
  ('Rejected',     'done',    '#ef4444', 5, false),
  ('Accepted',     'done',    '#22c55e', 6, false)
) as s(name, category, color, sort_order, is_default)
where p.name = 'Applications 2026';

-- Life statuses
insert into statuses (project_id, name, category, color, sort_order, is_default)
select p.id, s.name, s.category, s.color, s.sort_order, s.is_default
from projects p
cross join (values
  ('Inbox',       'backlog', '#6b7280', 0, true),
  ('Today',       'active',  '#3b82f6', 1, false),
  ('In Progress', 'active',  '#eab308', 2, false),
  ('Waiting',     'active',  '#f97316', 3, false),
  ('Done',        'done',    '#22c55e', 4, false)
) as s(name, category, color, sort_order, is_default)
where p.name = 'Admin & Finance';

-- Default tags
insert into tags (name, color) values
  ('urgent',    '#ef4444'),
  ('blocked',   '#f97316'),
  ('quick-win', '#22c55e'),
  ('creative',  '#a855f7'),
  ('technical', '#3b82f6'),
  ('research',  '#14b8a6'),
  ('admin',     '#6b7280'),
  ('ue5',       '#1e40af'),
  ('portfolio', '#ec4899');
