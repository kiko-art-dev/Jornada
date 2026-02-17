import { create } from 'zustand'
import type { ThemeMode, ViewMode } from '../types'

interface UIState {
  // Sidebar
  sidebarOpen: boolean
  toggleSidebar: () => void

  // Theme
  theme: ThemeMode
  toggleTheme: () => void

  // Active view
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void

  // Task drawer
  drawerTaskId: string | null
  openDrawer: (taskId: string) => void
  closeDrawer: () => void

  // Command palette
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void

  // Quick capture
  quickCaptureOpen: boolean
  setQuickCaptureOpen: (open: boolean) => void

  // Bulk selection
  selectedTaskIds: Set<string>
  toggleTaskSelected: (taskId: string) => void
  selectAllTasks: (taskIds: string[]) => void
  clearSelection: () => void
}

const getInitialTheme = (): ThemeMode => {
  const stored = localStorage.getItem('jornada-theme')
  if (stored === 'light' || stored === 'dark') return stored
  return 'light'
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  theme: getInitialTheme(),
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('jornada-theme', next)
      document.documentElement.classList.toggle('dark', next === 'dark')
      return { theme: next }
    }),

  viewMode: 'board',
  setViewMode: (mode) => set({ viewMode: mode }),

  drawerTaskId: null,
  openDrawer: (taskId) => set({ drawerTaskId: taskId }),
  closeDrawer: () => set({ drawerTaskId: null }),

  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  quickCaptureOpen: false,
  setQuickCaptureOpen: (open) => set({ quickCaptureOpen: open }),

  selectedTaskIds: new Set<string>(),
  toggleTaskSelected: (taskId) =>
    set((s) => {
      const next = new Set(s.selectedTaskIds)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return { selectedTaskIds: next }
    }),
  selectAllTasks: (taskIds) =>
    set({ selectedTaskIds: new Set(taskIds) }),
  clearSelection: () =>
    set({ selectedTaskIds: new Set<string>() }),
}))
