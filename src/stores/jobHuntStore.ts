import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useToastStore } from './toastStore'
import { getAllRoutineKeys } from '../lib/jobHunt'
import type { JobApplication, JobTimelineEntry, JobStage } from '../types'

interface RoutineDay {
  date: string
  completed: number
  total: number
}

interface JobHuntState {
  applications: JobApplication[]
  timeline: JobTimelineEntry[]
  loading: boolean

  // Routine
  routineLogs: Record<string, boolean>
  routineHistory: RoutineDay[]
  routineLoading: boolean

  fetchApplications: () => Promise<void>
  fetchTimeline: (appId: string) => Promise<void>

  createApplication: (app: Partial<JobApplication> & { studio_name: string }) => Promise<JobApplication | null>
  updateApplication: (id: string, updates: Partial<JobApplication>) => Promise<void>
  moveToStage: (id: string, newStage: JobStage) => Promise<void>
  togglePin: (id: string) => Promise<void>
  archiveApplication: (id: string) => Promise<void>
  deleteApplication: (id: string) => Promise<void>

  getByStage: (stage: JobStage) => JobApplication[]
  getAppTimeline: (appId: string) => JobTimelineEntry[]

  // Routine actions
  fetchRoutine: () => Promise<void>
  toggleRoutineStep: (stepKey: string) => Promise<void>
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export const useJobHuntStore = create<JobHuntState>((set, get) => ({
  applications: [],
  timeline: [],
  loading: false,

  routineLogs: {},
  routineHistory: [],
  routineLoading: false,

  fetchApplications: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('job_applications')
      .select('*')
      .eq('archived', false)
      .order('sort_order')
    set({ applications: data ?? [], loading: false })
  },

  fetchTimeline: async (appId) => {
    const { data } = await supabase
      .from('job_application_timeline')
      .select('*')
      .eq('application_id', appId)
      .order('created_at', { ascending: false })
    if (data) {
      set((s) => ({
        timeline: [
          ...s.timeline.filter((t) => t.application_id !== appId),
          ...data,
        ],
      }))
    }
  },

  createApplication: async (app) => {
    const stageApps = get().applications.filter((a) => a.stage === (app.stage ?? 'studios'))
    const newApp: Record<string, unknown> = {
      interest: 'medium',
      stage: 'studios',
      market: 'poland',
      sort_order: stageApps.length,
      ...app,
    }
    for (const key of Object.keys(newApp)) {
      if (newApp[key] === null || newApp[key] === undefined) delete newApp[key]
    }

    const { data, error } = await supabase
      .from('job_applications')
      .insert(newApp)
      .select()
      .single()

    if (error) {
      useToastStore.getState().addToast(`Failed to add studio: ${error.message}`, { type: 'warning' })
      return null
    }
    if (data) {
      set((s) => ({ applications: [...s.applications, data] }))
      // Log initial timeline entry
      const { data: entry } = await supabase
        .from('job_application_timeline')
        .insert({ application_id: data.id, from_stage: null, to_stage: data.stage })
        .select()
        .single()
      if (entry) {
        set((s) => ({ timeline: [entry, ...s.timeline] }))
      }
      return data
    }
    return null
  },

  updateApplication: async (id, updates) => {
    set((s) => ({
      applications: s.applications.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }))
    await supabase.from('job_applications').update(updates).eq('id', id)
  },

  moveToStage: async (id, newStage) => {
    const app = get().applications.find((a) => a.id === id)
    if (!app || app.stage === newStage) return

    const oldStage = app.stage

    // Optimistic update
    set((s) => ({
      applications: s.applications.map((a) =>
        a.id === id ? { ...a, stage: newStage } : a
      ),
    }))

    // Celebration toasts for milestones
    if (newStage === 'offer') {
      useToastStore.getState().addToast(`"${app.studio_name}" moved to Offer! Nice work.`, { type: 'success' })
    } else if (newStage === 'interviewing') {
      useToastStore.getState().addToast(`"${app.studio_name}" is now Interviewing — good luck!`, { type: 'success' })
    }

    // Persist stage change
    await supabase.from('job_applications').update({ stage: newStage }).eq('id', id)

    // Log timeline entry
    const { data: entry } = await supabase
      .from('job_application_timeline')
      .insert({ application_id: id, from_stage: oldStage, to_stage: newStage })
      .select()
      .single()
    if (entry) {
      set((s) => ({ timeline: [entry, ...s.timeline] }))
    }
  },

  togglePin: async (id) => {
    const app = get().applications.find((a) => a.id === id)
    if (!app) return
    const pinned = !app.pinned
    set((s) => ({
      applications: s.applications.map((a) => (a.id === id ? { ...a, pinned } : a)),
    }))
    await supabase.from('job_applications').update({ pinned }).eq('id', id)
  },

  archiveApplication: async (id) => {
    const app = get().applications.find((a) => a.id === id)
    if (!app) return

    set((s) => ({ applications: s.applications.filter((a) => a.id !== id) }))

    const addToast = useToastStore.getState().addToast
    let undone = false

    addToast(`"${app.studio_name}" archived`, {
      type: 'undo',
      duration: 5000,
      onUndo: () => {
        undone = true
        set((s) => ({ applications: [...s.applications, app] }))
      },
    })

    setTimeout(async () => {
      if (!undone) {
        await supabase.from('job_applications').update({ archived: true }).eq('id', id)
      }
    }, 5200)
  },

  deleteApplication: async (id) => {
    set((s) => ({ applications: s.applications.filter((a) => a.id !== id) }))
    await supabase.from('job_applications').delete().eq('id', id)
  },

  getByStage: (stage) => {
    return get()
      .applications.filter((a) => a.stage === stage)
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return a.sort_order - b.sort_order
      })
  },

  getAppTimeline: (appId) => {
    return get()
      .timeline.filter((t) => t.application_id === appId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  // --- Daily Routine ---

  fetchRoutine: async () => {
    set({ routineLoading: true })
    const today = todayStr()

    // Fetch today's logs
    const { data: todayData } = await supabase
      .from('daily_routine_logs')
      .select('step_key, completed')
      .eq('log_date', today)

    const logs: Record<string, boolean> = {}
    if (todayData) {
      for (const row of todayData) {
        logs[row.step_key] = row.completed
      }
    }

    // Fetch last 7 days for history
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const fromDate = sevenDaysAgo.toISOString().slice(0, 10)

    const { data: histData } = await supabase
      .from('daily_routine_logs')
      .select('log_date, completed')
      .gte('log_date', fromDate)
      .eq('completed', true)

    const allKeys = getAllRoutineKeys()
    const total = allKeys.length
    const dayCounts: Record<string, number> = {}
    if (histData) {
      for (const row of histData) {
        dayCounts[row.log_date] = (dayCounts[row.log_date] || 0) + 1
      }
    }

    const history: RoutineDay[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().slice(0, 10)
      history.push({ date: ds, completed: dayCounts[ds] || 0, total })
    }

    set({ routineLogs: logs, routineHistory: history, routineLoading: false })
  },

  toggleRoutineStep: async (stepKey) => {
    const today = todayStr()
    const current = get().routineLogs[stepKey] || false
    const newVal = !current

    // Optimistic update
    set((s) => ({
      routineLogs: { ...s.routineLogs, [stepKey]: newVal },
      routineHistory: s.routineHistory.map((d) =>
        d.date === today
          ? { ...d, completed: d.completed + (newVal ? 1 : -1) }
          : d
      ),
    }))

    // Check if all done → toast
    const logs = get().routineLogs
    const allDone = getAllRoutineKeys().every((k) => logs[k])
    if (allDone) {
      useToastStore.getState().addToast('Daily routine complete! Nice work.', { type: 'success' })
    }

    // Upsert to Supabase
    await supabase
      .from('daily_routine_logs')
      .upsert(
        {
          log_date: today,
          step_key: stepKey,
          completed: newVal,
          completed_at: newVal ? new Date().toISOString() : null,
        },
        { onConflict: 'log_date,step_key' }
      )
  },
}))
