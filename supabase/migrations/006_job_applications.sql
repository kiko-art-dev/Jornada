-- Migration 006: Job Hunt Tracker
-- Adds job_applications and job_application_timeline tables

create table if not exists job_applications (
  id               uuid primary key default gen_random_uuid(),
  studio_name      text not null,
  locations        text,
  notable_games    text,
  interest         text not null default 'medium',
  stage            text not null default 'studios',
  contact_method   text,
  contact_person   text,
  next_action_date date,
  job_url          text,
  position         text,
  notes            text,
  sort_order       integer not null default 0,
  archived         boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_job_apps_stage on job_applications(stage);
create index if not exists idx_job_apps_archived on job_applications(archived) where archived = false;
create index if not exists idx_job_apps_next_action on job_applications(next_action_date) where next_action_date is not null;

create trigger trg_job_apps_updated before update on job_applications
  for each row execute function update_updated_at();

create table if not exists job_application_timeline (
  id               uuid primary key default gen_random_uuid(),
  application_id   uuid not null references job_applications(id) on delete cascade,
  from_stage       text,
  to_stage         text not null,
  note             text,
  created_at       timestamptz not null default now()
);

create index if not exists idx_job_timeline_app on job_application_timeline(application_id);

-- RLS
alter table job_applications enable row level security;
alter table job_application_timeline enable row level security;

create policy "Authenticated users have full access" on job_applications
  for all using (auth.role() = 'authenticated');
create policy "Authenticated users have full access" on job_application_timeline
  for all using (auth.role() = 'authenticated');
