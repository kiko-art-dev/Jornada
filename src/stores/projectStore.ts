import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Workspace, Project, Status, Tag, Release, WorkspaceType } from '../types'

const defaultStatusesByType: Record<string, { name: string; category: string; color: string; is_default: boolean }[]> = {
  art: [
    { name: 'Idea', category: 'backlog', color: '#6b7280', is_default: true },
    { name: 'Reference', category: 'backlog', color: '#3b82f6', is_default: false },
    { name: 'Sketch', category: 'active', color: '#eab308', is_default: false },
    { name: 'Rendering', category: 'active', color: '#f97316', is_default: false },
    { name: 'Polish', category: 'active', color: '#a855f7', is_default: false },
    { name: 'Done', category: 'done', color: '#22c55e', is_default: false },
  ],
  dev: [
    { name: 'Backlog', category: 'backlog', color: '#6b7280', is_default: true },
    { name: 'Todo', category: 'backlog', color: '#3b82f6', is_default: false },
    { name: 'In Progress', category: 'active', color: '#eab308', is_default: false },
    { name: 'In Review', category: 'active', color: '#f97316', is_default: false },
    { name: 'Done', category: 'done', color: '#22c55e', is_default: false },
    { name: "Won't Fix", category: 'done', color: '#ef4444', is_default: false },
  ],
  job: [
    { name: 'Found', category: 'backlog', color: '#6b7280', is_default: true },
    { name: 'Applied', category: 'active', color: '#3b82f6', is_default: false },
    { name: 'Phone Screen', category: 'active', color: '#eab308', is_default: false },
    { name: 'Interview', category: 'active', color: '#f97316', is_default: false },
    { name: 'Offer', category: 'active', color: '#22c55e', is_default: false },
    { name: 'Rejected', category: 'done', color: '#ef4444', is_default: false },
    { name: 'Accepted', category: 'done', color: '#22c55e', is_default: false },
  ],
  life: [
    { name: 'Inbox', category: 'backlog', color: '#6b7280', is_default: true },
    { name: 'Today', category: 'active', color: '#3b82f6', is_default: false },
    { name: 'In Progress', category: 'active', color: '#eab308', is_default: false },
    { name: 'Waiting', category: 'active', color: '#f97316', is_default: false },
    { name: 'Done', category: 'done', color: '#22c55e', is_default: false },
  ],
  general: [
    { name: 'Backlog', category: 'backlog', color: '#6b7280', is_default: true },
    { name: 'In Progress', category: 'active', color: '#eab308', is_default: false },
    { name: 'Done', category: 'done', color: '#22c55e', is_default: false },
  ],
}

interface ProjectState {
  workspaces: Workspace[]
  projects: Project[]
  statuses: Status[]
  tags: Tag[]
  releases: Release[]
  loading: boolean

  // Active selection
  activeProjectId: string | null
  setActiveProject: (id: string | null) => void

  // Data fetching
  fetchAll: () => Promise<void>

  // Workspaces
  createWorkspace: (name: string, icon?: string, color?: string) => Promise<Workspace | null>
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<void>
  deleteWorkspace: (id: string) => Promise<void>

  // Projects
  createProject: (project: Partial<Project> & { name: string; workspace_id: string }) => Promise<Project | null>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  createProjectWithStatuses: (name: string, workspaceId: string, type: WorkspaceType | 'general') => Promise<Project | null>

  // Statuses
  createStatus: (status: Partial<Status> & { name: string; project_id: string }) => Promise<void>
  updateStatus: (id: string, updates: Partial<Pick<Status, 'name' | 'color' | 'category'>>) => Promise<void>
  deleteStatus: (id: string) => Promise<void>
  reorderStatuses: (projectId: string, orderedIds: string[]) => Promise<void>

  // Tags
  createTag: (name: string, color?: string) => Promise<void>

  // Releases
  createRelease: (release: Partial<Release> & { project_id: string; version: string }) => Promise<void>
  updateRelease: (id: string, updates: Partial<Release>) => Promise<void>

  // Helpers
  getProjectStatuses: (projectId: string) => Status[]
  getProjectReleases: (projectId: string) => Release[]
  getWorkspaceProjects: (workspaceId: string) => Project[]
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  workspaces: [],
  projects: [],
  statuses: [],
  tags: [],
  releases: [],
  loading: false,
  activeProjectId: null,

  setActiveProject: (id) => set({ activeProjectId: id }),

  createWorkspace: async (name, icon, color) => {
    const sortOrder = get().workspaces.length
    const { data } = await supabase
      .from('workspaces')
      .insert({ name, icon: icon ?? null, color: color ?? null, sort_order: sortOrder })
      .select()
      .single()
    if (data) {
      set((s) => ({ workspaces: [...s.workspaces, data] }))
      return data
    }
    return null
  },

  updateWorkspace: async (id, updates) => {
    await supabase.from('workspaces').update(updates).eq('id', id)
    set((s) => ({
      workspaces: s.workspaces.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    }))
  },

  deleteWorkspace: async (id) => {
    // This cascades: deletes projects, statuses, tasks in those projects
    await supabase.from('workspaces').delete().eq('id', id)
    set((s) => {
      const projectIds = s.projects.filter((p) => p.workspace_id === id).map((p) => p.id)
      return {
        workspaces: s.workspaces.filter((w) => w.id !== id),
        projects: s.projects.filter((p) => p.workspace_id !== id),
        statuses: s.statuses.filter((st) => !projectIds.includes(st.project_id)),
        releases: s.releases.filter((r) => !projectIds.includes(r.project_id)),
      }
    })
  },

  fetchAll: async () => {
    set({ loading: true })
    const [workspaces, projects, statuses, tags, releases] = await Promise.all([
      supabase.from('workspaces').select('*').order('sort_order'),
      supabase.from('projects').select('*').eq('archived', false).order('sort_order'),
      supabase.from('statuses').select('*').order('sort_order'),
      supabase.from('tags').select('*').order('name'),
      supabase.from('releases').select('*').order('created_at', { ascending: false }),
    ])
    set({
      workspaces: workspaces.data ?? [],
      projects: projects.data ?? [],
      statuses: statuses.data ?? [],
      tags: tags.data ?? [],
      releases: releases.data ?? [],
      loading: false,
    })
  },

  createProject: async (project) => {
    const { data } = await supabase.from('projects').insert(project).select().single()
    if (data) {
      set((s) => ({ projects: [...s.projects, data] }))
      return data
    }
    return null
  },

  updateProject: async (id, updates) => {
    const { error } = await supabase.from('projects').update(updates).eq('id', id)
    if (error) {
      console.error('updateProject error:', error)
      return
    }
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }))
  },

  createProjectWithStatuses: async (name, workspaceId, type) => {
    const project = await get().createProject({
      name,
      workspace_id: workspaceId,
      type,
      sort_order: get().projects.filter((p) => p.workspace_id === workspaceId).length,
    })
    if (!project) return null

    const templates = defaultStatusesByType[type] ?? defaultStatusesByType.general
    const statusRows = templates.map((t, i) => ({
      project_id: project.id,
      name: t.name,
      category: t.category,
      color: t.color,
      sort_order: i,
      is_default: t.is_default,
    }))

    const { data: newStatuses } = await supabase.from('statuses').insert(statusRows).select()
    if (newStatuses) {
      set((s) => ({ statuses: [...s.statuses, ...newStatuses] }))
    }
    return project
  },

  createStatus: async (status) => {
    const { data } = await supabase.from('statuses').insert(status).select().single()
    if (data) set((s) => ({ statuses: [...s.statuses, data] }))
  },

  updateStatus: async (id, updates) => {
    await supabase.from('statuses').update(updates).eq('id', id)
    set((s) => ({
      statuses: s.statuses.map((st) => (st.id === id ? { ...st, ...updates } : st)),
    }))
  },

  deleteStatus: async (id) => {
    const status = get().statuses.find((s) => s.id === id)
    if (!status) return

    const projectStatuses = get().statuses.filter((s) => s.project_id === status.project_id)
    if (projectStatuses.length <= 1) return // don't delete the last status

    const defaultStatus = projectStatuses.find((s) => s.is_default && s.id !== id)
      ?? projectStatuses.find((s) => s.id !== id)!

    // Reassign tasks in this status to the default
    await supabase.from('tasks').update({ status_id: defaultStatus.id }).eq('status_id', id)
    await supabase.from('statuses').delete().eq('id', id)

    set((s) => ({
      statuses: s.statuses.filter((st) => st.id !== id),
    }))

    // Also update local tasks
    const { useTaskStore } = await import('./taskStore')
    useTaskStore.setState((s) => ({
      tasks: s.tasks.map((t) => (t.status_id === id ? { ...t, status_id: defaultStatus.id } : t)),
    }))
  },

  reorderStatuses: async (projectId, orderedIds) => {
    set((s) => ({
      statuses: s.statuses.map((st) => {
        if (st.project_id !== projectId) return st
        const idx = orderedIds.indexOf(st.id)
        return idx >= 0 ? { ...st, sort_order: idx } : st
      }),
    }))

    const updates = orderedIds.map((id, i) =>
      supabase.from('statuses').update({ sort_order: i }).eq('id', id)
    )
    await Promise.all(updates)
  },

  createTag: async (name, color) => {
    const { data } = await supabase.from('tags').insert({ name, color }).select().single()
    if (data) set((s) => ({ tags: [...s.tags, data] }))
  },

  createRelease: async (release) => {
    const { data } = await supabase.from('releases').insert(release).select().single()
    if (data) set((s) => ({ releases: [...s.releases, data] }))
  },

  updateRelease: async (id, updates) => {
    await supabase.from('releases').update(updates).eq('id', id)
    set((s) => ({
      releases: s.releases.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }))
  },

  getProjectStatuses: (projectId) => get().statuses.filter((s) => s.project_id === projectId),
  getProjectReleases: (projectId) => get().releases.filter((r) => r.project_id === projectId),
  getWorkspaceProjects: (workspaceId) => get().projects.filter((p) => p.workspace_id === workspaceId),
}))
