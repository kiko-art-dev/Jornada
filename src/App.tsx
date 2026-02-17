import { useEffect, Component, type ReactNode } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useProjectStore } from './stores/projectStore'
import { useTaskStore } from './stores/taskStore'
import { useUIStore } from './stores/uiStore'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { TodayPage } from './pages/TodayPage'
// InboxPage removed — tasks go directly to boards via Quick Capture
import { ProjectPage } from './pages/ProjectPage'
import { SettingsPage } from './pages/SettingsPage'
import { DashboardPage } from './pages/DashboardPage'
import { SearchPage } from './pages/SearchPage'

// Error boundary to catch rendering errors
class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null }

  static getDerivedStateFromError(error: Error) {
    return { error: error.message }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen items-center justify-center bg-[var(--color-surface-base)]">
          <div className="max-w-md rounded-lg border border-red-800 bg-red-950/50 p-6 text-center">
            <h2 className="text-lg font-semibold text-red-400">Something went wrong</h2>
            <p className="mt-2 text-sm text-red-300">{this.state.error}</p>
            <button
              onClick={() => {
                this.setState({ error: null })
                window.location.reload()
              }}
              className="mt-4 rounded-md bg-red-800 px-4 py-2 text-sm text-white hover:bg-red-700"
            >
              Reload App
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function AppContent() {
  const { user, loading: authLoading } = useAuth()
  const fetchAll = useProjectStore((s) => s.fetchAll)
  const fetchTasks = useTaskStore((s) => s.fetchTasks)
  const theme = useUIStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    if (user) {
      fetchAll()
      fetchTasks()
    }
  }, [user, fetchAll, fetchTasks])

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-surface-base)]">
        <div className="text-lg text-[var(--text-primary)]">Loading JORNADA...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<TodayPage />} />
        {/* Inbox removed — redirect to today */}
        <Route path="/project/:projectId" element={<ProjectPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/search" element={<SearchPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </ErrorBoundary>
  )
}
