// ============================================================
// JORNADA — Core Type Definitions
// ============================================================

export type WorkspaceType = 'art' | 'dev' | 'job' | 'life'

export type StatusCategory = 'backlog' | 'active' | 'done'

export type TaskType = 'task' | 'bug' | 'feature'

export type Priority = 1 | 2 | 3 | 4

export type Severity = 'critical' | 'major' | 'minor' | 'trivial'

export type ReleaseStatus = 'draft' | 'in_progress' | 'released'

export type RecurrenceRule = 'daily' | 'weekdays' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'

export type Discipline = 'art' | 'code' | 'design' | 'audio' | 'qa' | 'writing' | 'production'

export interface Workspace {
  id: string
  name: string
  icon: string | null
  color: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  workspace_id: string
  name: string
  description: string | null
  type: WorkspaceType | 'general'
  sort_order: number
  archived: boolean
  created_at: string
  updated_at: string
}

export interface Status {
  id: string
  project_id: string
  name: string
  category: StatusCategory
  color: string | null
  sort_order: number
  is_default: boolean
}

export interface Tag {
  id: string
  name: string
  color: string | null
}

export interface Release {
  id: string
  project_id: string
  version: string
  title: string | null
  status: ReleaseStatus
  target_date: string | null
  released_date: string | null
  changelog_md: string | null
  created_at: string
  updated_at: string
}

export interface TaskEnvironment {
  ue_version?: string
  platform?: string
  plugin_version?: string
}

export interface Task {
  id: string
  project_id: string | null
  status_id: string | null
  release_id: string | null
  title: string
  description: string | null
  type: TaskType
  priority: Priority
  due_date: string | null
  sort_order: number
  archived: boolean
  severity: Severity | null
  repro_steps: string | null
  expected: string | null
  actual: string | null
  environment: TaskEnvironment | null
  discipline: Discipline | null
  recurrence_rule: RecurrenceRule | null
  recurrence_source_id: string | null
  created_at: string
  updated_at: string
}

export interface TaskTag {
  task_id: string
  tag_id: string
}

export interface ChecklistItem {
  id: string
  task_id: string
  title: string
  checked: boolean
  sort_order: number
}

export interface TaskNote {
  id: string
  task_id: string
  content: string
  created_at: string
}

export interface TaskActivity {
  id: string
  task_id: string
  action: string
  field: string | null
  old_value: string | null
  new_value: string | null
  created_at: string
}

export interface TaskDependency {
  id: string
  task_id: string
  depends_on_task_id: string
  created_at: string
}

export interface TaskAttachment {
  id: string
  task_id: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  created_at: string
}

// ============================================================
// UI Types
// ============================================================

export type ViewMode = 'board' | 'list' | 'bugs' | 'releases' | 'calendar'

export type ThemeMode = 'dark' | 'light'

// Task with joined relations for display
export interface TaskWithRelations extends Task {
  status?: Status
  project?: Project
  tags?: Tag[]
  release?: Release
  checklist_items?: ChecklistItem[]
  notes?: TaskNote[]
}

// Export/Import format
export interface JornadaExport {
  version: '1.0'
  exported_at: string
  data: {
    workspaces: Workspace[]
    projects: Project[]
    statuses: Status[]
    tags: Tag[]
    releases: Release[]
    tasks: Task[]
    task_tags: TaskTag[]
    checklist_items: ChecklistItem[]
    task_notes: TaskNote[]
  }
}
