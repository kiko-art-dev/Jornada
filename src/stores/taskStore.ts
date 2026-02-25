import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { getNextDueDate } from '../lib/recurrence'
import { useToastStore } from './toastStore'
import type { Task, ChecklistItem, TaskNote, TaskTag, TaskActivity, TaskDependency, TaskAttachment, RecurrenceRule } from '../types'

interface TaskState {
  tasks: Task[]
  taskTags: TaskTag[]
  checklistItems: ChecklistItem[]
  taskNotes: TaskNote[]
  taskActivity: TaskActivity[]
  taskDependencies: TaskDependency[]
  taskAttachments: TaskAttachment[]
  loading: boolean

  // Data fetching
  fetchTasks: () => Promise<void>
  fetchTaskDetails: (taskId: string) => Promise<void>
  fetchTaskActivity: (taskId: string) => Promise<void>

  // Task CRUD
  createTask: (task: Partial<Task> & { title: string }) => Promise<Task | null>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  archiveTask: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>

  // Activity
  logActivity: (taskId: string, action: string, field?: string, oldValue?: string, newValue?: string) => Promise<void>

  // Checklist
  addChecklistItem: (taskId: string, title: string) => Promise<void>
  toggleChecklistItem: (id: string) => Promise<void>
  deleteChecklistItem: (id: string) => Promise<void>

  // Notes
  addNote: (taskId: string, content: string) => Promise<void>

  // Tags
  addTagToTask: (taskId: string, tagId: string) => Promise<void>
  removeTagFromTask: (taskId: string, tagId: string) => Promise<void>

  // Dependencies
  addDependency: (taskId: string, dependsOnTaskId: string) => Promise<void>
  removeDependency: (id: string) => Promise<void>
  getTaskDependencies: (taskId: string) => TaskDependency[]
  getTaskBlocking: (taskId: string) => TaskDependency[]

  // Attachments
  uploadAttachment: (taskId: string, file: File) => Promise<void>
  deleteAttachment: (id: string, storageRef: string) => Promise<void>
  getTaskAttachments: (taskId: string) => TaskAttachment[]

  // Helpers
  getProjectTasks: (projectId: string) => Task[]
  getTasksByStatus: (statusId: string) => Task[]
  getInboxTasks: () => Task[]
  getTaskChecklist: (taskId: string) => ChecklistItem[]
  getTaskNotes: (taskId: string) => TaskNote[]
  getTaskTagIds: (taskId: string) => string[]
}

function decodePath(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function normalizeAttachmentPath(value: string | null | undefined): string | null {
  if (!value) return null
  if (!value.includes('://')) return value.replace(/^\/+/, '')

  try {
    const url = new URL(value)
    const marker = '/task-attachments/'
    const markerIndex = url.pathname.indexOf(marker)
    if (markerIndex >= 0) {
      return decodePath(url.pathname.slice(markerIndex + marker.length))
    }
  } catch {
    // Fall through to regex fallback
  }

  const match = value.match(/task-attachments\/([^?]+)/)
  return match ? decodePath(match[1]) : null
}

async function withSignedAttachmentUrls(attachments: TaskAttachment[]): Promise<TaskAttachment[]> {
  if (attachments.length === 0) return attachments

  const uniquePaths = Array.from(
    new Set(
      attachments
        .map((attachment) => normalizeAttachmentPath(attachment.file_path ?? attachment.file_url))
        .filter((path): path is string => Boolean(path))
    )
  )

  if (uniquePaths.length === 0) return attachments

  const { data, error } = await supabase.storage
    .from('task-attachments')
    .createSignedUrls(uniquePaths, 60 * 60)

  if (error || !data) return attachments

  const signedUrlByPath = new Map<string, string>()
  data.forEach((item, idx) => {
    if (item.signedUrl) signedUrlByPath.set(uniquePaths[idx], item.signedUrl)
  })

  return attachments.map((attachment) => {
    const path = normalizeAttachmentPath(attachment.file_path ?? attachment.file_url)
    return {
      ...attachment,
      file_path: path ?? attachment.file_path ?? null,
      file_url: path && signedUrlByPath.has(path)
        ? signedUrlByPath.get(path)!
        : attachment.file_url,
    }
  })
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  taskTags: [],
  checklistItems: [],
  taskNotes: [],
  taskActivity: [],
  taskDependencies: [],
  taskAttachments: [],
  loading: false,

  fetchTasks: async () => {
    set({ loading: true })
    const [tasks, taskTags, checklist, deps] = await Promise.all([
      supabase.from('tasks').select('*').eq('archived', false).order('sort_order'),
      supabase.from('task_tags').select('*'),
      supabase.from('checklist_items').select('*').order('sort_order'),
      supabase.from('task_dependencies').select('*').then((r) => r, () => ({ data: [] as TaskDependency[] })),
    ])
    set({
      tasks: tasks.data ?? [],
      taskTags: taskTags.data ?? [],
      checklistItems: checklist.data ?? [],
      taskDependencies: (deps as { data: TaskDependency[] | null }).data ?? [],
      loading: false,
    })
  },

  fetchTaskDetails: async (taskId) => {
    const [checklist, notes, attachments] = await Promise.all([
      supabase.from('checklist_items').select('*').eq('task_id', taskId).order('sort_order'),
      supabase.from('task_notes').select('*').eq('task_id', taskId).order('created_at', { ascending: false }),
      supabase.from('task_attachments').select('*').eq('task_id', taskId).order('created_at', { ascending: false }),
    ])
    const signedAttachments = await withSignedAttachmentUrls(attachments.data ?? [])
    set((s) => ({
      checklistItems: [
        ...s.checklistItems.filter((c) => c.task_id !== taskId),
        ...(checklist.data ?? []),
      ],
      taskNotes: [
        ...s.taskNotes.filter((n) => n.task_id !== taskId),
        ...(notes.data ?? []),
      ],
      taskAttachments: [
        ...s.taskAttachments.filter((a) => a.task_id !== taskId),
        ...signedAttachments,
      ],
    }))
  },

  fetchTaskActivity: async (taskId) => {
    const { data } = await supabase
      .from('task_activity')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) {
      set((s) => ({
        taskActivity: [
          ...s.taskActivity.filter((a) => a.task_id !== taskId),
          ...data,
        ],
      }))
    }
  },

  logActivity: async (taskId, action, field, oldValue, newValue) => {
    const { data } = await supabase
      .from('task_activity')
      .insert({
        task_id: taskId,
        action,
        field: field ?? null,
        old_value: oldValue ?? null,
        new_value: newValue ?? null,
      })
      .select()
      .single()
    if (data) {
      set((s) => ({ taskActivity: [data, ...s.taskActivity] }))
    }
  },

  createTask: async (task) => {
    const newTask: Record<string, unknown> = {
      type: 'task',
      priority: 4,
      sort_order: get().tasks.length,
      ...task,
    }
    // Strip null optional columns that may not exist in the schema
    for (const key of Object.keys(newTask)) {
      if (newTask[key] === null || newTask[key] === undefined) delete newTask[key]
    }
    const { data, error } = await supabase.from('tasks').insert(newTask).select().single()
    if (error) {
      console.error('createTask error:', error)
      useToastStore.getState().addToast(`Failed to create task: ${error.message}`, { type: 'warning' })
      return null
    }
    if (data) {
      set((s) => ({ tasks: [...s.tasks, data] }))
      get().logActivity(data.id, 'created')
      return data
    }
    return null
  },

  updateTask: async (id, updates) => {
    const oldTask = get().tasks.find((t) => t.id === id)

    // Optimistic update
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
    await supabase.from('tasks').update(updates).eq('id', id)

    // Log activity for tracked fields
    if (oldTask) {
      const trackedFields = ['status_id', 'priority', 'title', 'due_date', 'type', 'recurrence_rule', 'discipline'] as const
      for (const field of trackedFields) {
        if (field in updates && updates[field as keyof typeof updates] !== oldTask[field]) {
          get().logActivity(
            id,
            'updated',
            field,
            String(oldTask[field] ?? ''),
            String(updates[field as keyof typeof updates] ?? '')
          )
        }
      }

      // Handle recurring task spawning when status changes to done
      if ('status_id' in updates && oldTask.recurrence_rule && oldTask.due_date) {
        // We need to check if the new status is 'done' category
        // Import would be circular, so we check via a delayed approach
        setTimeout(async () => {
          const { data: statusData } = await supabase
            .from('statuses')
            .select('category')
            .eq('id', updates.status_id as string)
            .single()

          if (statusData?.category === 'done') {
            const nextDue = getNextDueDate(oldTask.due_date!, oldTask.recurrence_rule as RecurrenceRule)
            // Find the default/first status for this project
            const { data: defaultStatus } = await supabase
              .from('statuses')
              .select('id')
              .eq('project_id', oldTask.project_id as string)
              .order('sort_order')
              .limit(1)
              .single()

            get().createTask({
              title: oldTask.title,
              description: oldTask.description,
              project_id: oldTask.project_id,
              status_id: defaultStatus?.id ?? oldTask.status_id,
              priority: oldTask.priority,
              type: oldTask.type,
              due_date: nextDue,
              recurrence_rule: oldTask.recurrence_rule,
              recurrence_source_id: oldTask.recurrence_source_id ?? oldTask.id,
            })
          }
        }, 100)
      }
    }
  },

  archiveTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return

    // Remove from local state immediately
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))

    // Show undo toast with 5s window
    const addToast = useToastStore.getState().addToast
    let undone = false

    addToast(`"${task.title}" archived`, {
      type: 'undo',
      duration: 5000,
      onUndo: () => {
        undone = true
        // Restore task to local state
        set((s) => ({ tasks: [...s.tasks, task] }))
      },
    })

    // After 5s, persist if not undone
    setTimeout(async () => {
      if (!undone) {
        await supabase.from('tasks').update({ archived: true }).eq('id', id)
        get().logActivity(id, 'archived')
      }
    }, 5200)
  },

  deleteTask: async (id) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
    await supabase.from('tasks').delete().eq('id', id)
  },

  addChecklistItem: async (taskId, title) => {
    const sortOrder = get().checklistItems.filter((c) => c.task_id === taskId).length
    const { data } = await supabase
      .from('checklist_items')
      .insert({ task_id: taskId, title, sort_order: sortOrder })
      .select()
      .single()
    if (data) set((s) => ({ checklistItems: [...s.checklistItems, data] }))
  },

  toggleChecklistItem: async (id) => {
    const item = get().checklistItems.find((c) => c.id === id)
    if (!item) return
    const checked = !item.checked
    set((s) => ({
      checklistItems: s.checklistItems.map((c) => (c.id === id ? { ...c, checked } : c)),
    }))
    await supabase.from('checklist_items').update({ checked }).eq('id', id)
  },

  deleteChecklistItem: async (id) => {
    set((s) => ({ checklistItems: s.checklistItems.filter((c) => c.id !== id) }))
    await supabase.from('checklist_items').delete().eq('id', id)
  },

  addNote: async (taskId, content) => {
    const { data } = await supabase
      .from('task_notes')
      .insert({ task_id: taskId, content })
      .select()
      .single()
    if (data) set((s) => ({ taskNotes: [data, ...s.taskNotes] }))
  },

  addTagToTask: async (taskId, tagId) => {
    await supabase.from('task_tags').insert({ task_id: taskId, tag_id: tagId })
    set((s) => ({ taskTags: [...s.taskTags, { task_id: taskId, tag_id: tagId }] }))
  },

  removeTagFromTask: async (taskId, tagId) => {
    await supabase.from('task_tags').delete().eq('task_id', taskId).eq('tag_id', tagId)
    set((s) => ({
      taskTags: s.taskTags.filter((tt) => !(tt.task_id === taskId && tt.tag_id === tagId)),
    }))
  },

  // Dependencies
  addDependency: async (taskId, dependsOnTaskId) => {
    const { data } = await supabase
      .from('task_dependencies')
      .insert({ task_id: taskId, depends_on_task_id: dependsOnTaskId })
      .select()
      .single()
    if (data) {
      set((s) => ({ taskDependencies: [...s.taskDependencies, data] }))
    }
  },

  removeDependency: async (id) => {
    await supabase.from('task_dependencies').delete().eq('id', id)
    set((s) => ({ taskDependencies: s.taskDependencies.filter((d) => d.id !== id) }))
  },

  getTaskDependencies: (taskId) =>
    get().taskDependencies.filter((d) => d.task_id === taskId),

  getTaskBlocking: (taskId) =>
    get().taskDependencies.filter((d) => d.depends_on_task_id === taskId),

  // Attachments
  uploadAttachment: async (taskId, file) => {
    const ext = file.name.split('.').pop() ?? 'png'
    const path = `${taskId}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('task-attachments')
      .upload(path, file)

    if (uploadError) {
      const isMissingBucket = /bucket not found/i.test(uploadError.message)
      const message = isMissingBucket
        ? 'Upload failed: bucket "task-attachments" is missing. Apply migration 005 in Supabase SQL Editor.'
        : `Upload failed: ${uploadError.message}`
      useToastStore.getState().addToast(message)
      return
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from('task-attachments')
      .createSignedUrl(path, 60 * 60)

    if (signedError || !signedData?.signedUrl) {
      await supabase.storage.from('task-attachments').remove([path])
      useToastStore.getState().addToast('Upload failed: could not create signed URL.')
      return
    }

    const { data, error: insertError } = await supabase
      .from('task_attachments')
      .insert({
        task_id: taskId,
        file_name: file.name,
        file_url: signedData.signedUrl,
        file_type: file.type,
        file_size: file.size,
      })
      .select()
      .single()

    if (insertError) {
      await supabase.storage.from('task-attachments').remove([path])
      useToastStore.getState().addToast(`Upload failed: ${insertError.message}`)
      return
    }

    if (data) {
      const normalizedPath = normalizeAttachmentPath(data.file_path ?? data.file_url) ?? path
      set((s) => ({
        taskAttachments: [
          ...s.taskAttachments,
          { ...data, file_path: normalizedPath, file_url: signedData.signedUrl },
        ],
      }))
    }
  },

  deleteAttachment: async (id, storageRef) => {
    set((s) => ({ taskAttachments: s.taskAttachments.filter((a) => a.id !== id) }))
    await supabase.from('task_attachments').delete().eq('id', id)

    const path = normalizeAttachmentPath(storageRef)
    if (path) {
      await supabase.storage.from('task-attachments').remove([path])
    }
  },

  getTaskAttachments: (taskId) =>
    get().taskAttachments.filter((a) => a.task_id === taskId),

  getProjectTasks: (projectId) =>
    get().tasks.filter((t) => t.project_id === projectId),

  getTasksByStatus: (statusId) =>
    get().tasks.filter((t) => t.status_id === statusId).sort((a, b) => a.sort_order - b.sort_order),

  getInboxTasks: () =>
    get().tasks.filter((t) => t.project_id === null),

  getTaskChecklist: (taskId) =>
    get().checklistItems.filter((c) => c.task_id === taskId).sort((a, b) => a.sort_order - b.sort_order),

  getTaskNotes: (taskId) =>
    get().taskNotes.filter((n) => n.task_id === taskId),

  getTaskTagIds: (taskId) =>
    get().taskTags.filter((tt) => tt.task_id === taskId).map((tt) => tt.tag_id),
}))
