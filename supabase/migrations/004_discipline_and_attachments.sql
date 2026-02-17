-- ============================================================
-- Migration 004: Discipline field + Task attachments
-- ============================================================

-- 1. Add discipline column to tasks
ALTER TABLE tasks ADD COLUMN discipline text;

-- 2. Task attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_task_attachments_task_id ON task_attachments(task_id);

-- 3. Supabase Storage bucket (run via Dashboard or supabase CLI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('task-attachments', 'task-attachments', true);
-- CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'task-attachments');
-- CREATE POLICY "Allow authenticated reads" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'task-attachments');
-- CREATE POLICY "Allow authenticated deletes" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'task-attachments');
