-- Migration 007: Add pinned column to job_applications
alter table job_applications add column if not exists pinned boolean not null default false;
create index if not exists idx_job_apps_pinned on job_applications(pinned) where pinned = true;
