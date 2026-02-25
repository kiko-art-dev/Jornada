-- ============================================================
-- Migration 005: Private attachments + RLS hardening
-- ============================================================

-- Enable RLS on tables introduced after the initial schema migration.
ALTER TABLE IF EXISTS task_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS task_attachments ENABLE ROW LEVEL SECURITY;

-- Single-user app model: authenticated sessions can access these tables.
DROP POLICY IF EXISTS "Authenticated users have full access" ON task_activity;
DROP POLICY IF EXISTS "Authenticated users have full access" ON task_dependencies;
DROP POLICY IF EXISTS "Authenticated users have full access" ON task_attachments;

CREATE POLICY "Authenticated users have full access" ON task_activity
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access" ON task_dependencies
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access" ON task_attachments
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Add optional persistent storage path for attachments and backfill existing rows.
ALTER TABLE IF EXISTS task_attachments
  ADD COLUMN IF NOT EXISTS file_path text;

UPDATE task_attachments
SET file_path = split_part(file_url, '/task-attachments/', 2)
WHERE (file_path IS NULL OR file_path = '')
  AND file_url LIKE '%/task-attachments/%';

UPDATE task_attachments
SET file_path = file_url
WHERE (file_path IS NULL OR file_path = '')
  AND file_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_task_attachments_file_path ON task_attachments(file_path);

-- Ensure the bucket is private.
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Replace broad policies with task-aware scoped policies.
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Task attachments authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Task attachments authenticated read" ON storage.objects;
DROP POLICY IF EXISTS "Task attachments authenticated delete" ON storage.objects;

CREATE POLICY "Task attachments authenticated upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND split_part(name, '/', 1) <> ''
    AND EXISTS (
      SELECT 1
      FROM public.tasks t
      WHERE t.id::text = split_part(name, '/', 1)
    )
  );

CREATE POLICY "Task attachments authenticated read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND split_part(name, '/', 1) <> ''
    AND EXISTS (
      SELECT 1
      FROM public.tasks t
      WHERE t.id::text = split_part(name, '/', 1)
    )
  );

CREATE POLICY "Task attachments authenticated delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND split_part(name, '/', 1) <> ''
    AND EXISTS (
      SELECT 1
      FROM public.tasks t
      WHERE t.id::text = split_part(name, '/', 1)
    )
  );
