import { useMemo, useState } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import { useUIStore } from '../../stores/uiStore'
import { useTaskStore } from '../../stores/taskStore'
import { useNavigate, useLocation } from 'react-router-dom'
import type { WorkspaceType } from '../../types'
import { WORKSPACE_COLORS } from '../../lib/theme'

const workspaceTypeMap: Record<string, WorkspaceType> = {
  Art: 'art',
  'UE5 Plugins': 'dev',
  'Job Hunt': 'job',
  Life: 'life',
}

const WS_COLOR_SWATCHES = [
  '#6b7280', '#3b82f6', '#60a5fa', '#8b5cf6', '#c084fc',
  '#ec4899', '#ef4444', '#f59e0b', '#34d399', '#14b8a6',
]

function getWsColor(workspace: { name: string; color: string | null }): string {
  if (workspace.color) return workspace.color
  const type = workspaceTypeMap[workspace.name]
  return type ? WORKSPACE_COLORS[type] : WORKSPACE_COLORS.general
}

type ContextTarget =
  | { kind: 'workspace'; id: string; x: number; y: number }
  | { kind: 'project'; id: string; x: number; y: number }

// --- SVG Icons ---
function IconToday({ active }: { active?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={active ? '#818cf8' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 4.5V8l2.5 1.5" />
    </svg>
  )
}

function IconInbox({ active }: { active?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={active ? '#818cf8' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 9h3.25L7 10.5h2L10.25 9h3.25" />
      <path d="M3.6 3.5h8.8L14 9v3.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V9l1.6-5.5z" />
    </svg>
  )
}

function IconDashboard({ active }: { active?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={active ? '#818cf8' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="3" rx="1" />
      <rect x="2" y="9" width="5" height="3" rx="1" />
      <rect x="9" y="7" width="5" height="5" rx="1" />
    </svg>
  )
}

function IconSearch({ active }: { active?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={active ? '#818cf8' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="4.25" />
      <path d="m10 10 3.5 3.5" />
    </svg>
  )
}

function IconSettings({ active }: { active?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={active ? '#818cf8' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1.5v1.25M8 13.25v1.25M1.5 8h1.25M13.25 8h1.25M3.4 3.4l.9.9M11.7 11.7l.9.9M3.4 12.6l.9-.9M11.7 4.3l.9-.9" />
    </svg>
  )
}

function IconTheme({ dark }: { dark: boolean }) {
  return dark ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 8.9A5.5 5.5 0 0 1 7.1 2.5 5.5 5.5 0 1 0 13.5 8.9z" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.4 3.4l.7.7M11.9 11.9l.7.7M3.4 12.6l.7-.7M11.9 4.1l.7-.7" />
    </svg>
  )
}

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, theme, toggleTheme } = useUIStore()
  const workspaces = useProjectStore((s) => s.workspaces)
  const projects = useProjectStore((s) => s.projects)
  const statuses = useProjectStore((s) => s.statuses)
  const setActiveProject = useProjectStore((s) => s.setActiveProject)
  const createProjectWithStatuses = useProjectStore((s) => s.createProjectWithStatuses)
  const createWorkspace = useProjectStore((s) => s.createWorkspace)
  const updateWorkspace = useProjectStore((s) => s.updateWorkspace)
  const deleteWorkspace = useProjectStore((s) => s.deleteWorkspace)
  const updateProject = useProjectStore((s) => s.updateProject)
  const tasks = useTaskStore((s) => s.tasks)
  // inboxCount removed — no inbox page
  const navigate = useNavigate()
  const location = useLocation()

  // Count active tasks per project
  const projectTaskCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of tasks) {
      if (!t.project_id || t.archived) continue
      const status = statuses.find((s) => s.id === t.status_id)
      if (status?.category !== 'done') {
        counts[t.project_id] = (counts[t.project_id] ?? 0) + 1
      }
    }
    return counts
  }, [tasks, statuses])

  // Project add/rename
  const [addingToWorkspace, setAddingToWorkspace] = useState<string | null>(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [renamingProject, setRenamingProject] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // Workspace add/rename
  const [addingWorkspace, setAddingWorkspace] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [renamingWorkspace, setRenamingWorkspace] = useState<string | null>(null)
  const [wsRenameValue, setWsRenameValue] = useState('')

  // Unified context menu
  const [contextMenu, setContextMenu] = useState<ContextTarget | null>(null)

  const isActive = (path: string) => location.pathname === path

  // --- Project handlers ---
  const handleCreateProject = async (workspaceId: string, workspaceName: string) => {
    if (!newProjectName.trim()) {
      setAddingToWorkspace(null)
      return
    }
    const type = workspaceTypeMap[workspaceName] ?? 'general'
    const project = await createProjectWithStatuses(newProjectName.trim(), workspaceId, type)
    setNewProjectName('')
    setAddingToWorkspace(null)
    if (project) {
      setActiveProject(project.id)
      navigate(`/project/${project.id}`)
    }
  }

  const handleRenameProject = async (projectId: string) => {
    if (renameValue.trim()) {
      await updateProject(projectId, { name: renameValue.trim() })
    }
    setRenamingProject(null)
  }

  const handleArchiveProject = async (projectId: string) => {
    await updateProject(projectId, { archived: true })
    setContextMenu(null)
    if (location.pathname === `/project/${projectId}`) navigate('/')
  }

  // --- Workspace handlers ---
  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      setAddingWorkspace(false)
      return
    }
    await createWorkspace(newWorkspaceName.trim())
    setNewWorkspaceName('')
    setAddingWorkspace(false)
  }

  const handleRenameWorkspace = async (wsId: string) => {
    if (wsRenameValue.trim()) {
      await updateWorkspace(wsId, { name: wsRenameValue.trim() })
    }
    setRenamingWorkspace(null)
  }

  const handleDeleteWorkspace = async (wsId: string) => {
    await deleteWorkspace(wsId)
    setContextMenu(null)
    const wsProjectIds = projects.filter((p) => p.workspace_id === wsId).map((p) => p.id)
    const match = location.pathname.match(/\/project\/(.+)/)
    if (match && wsProjectIds.includes(match[1])) navigate('/')
  }

  // --- Reorder handlers ---
  const handleMoveWorkspace = async (wsId: string, direction: 'up' | 'down') => {
    const sorted = [...workspaces].sort((a, b) => a.sort_order - b.sort_order)
    const idx = sorted.findIndex((w) => w.id === wsId)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const a = sorted[idx], b = sorted[swapIdx]
    await updateWorkspace(a.id, { sort_order: b.sort_order })
    await updateWorkspace(b.id, { sort_order: a.sort_order })
    setContextMenu(null)
  }

  const handleMoveProject = async (projectId: string, direction: 'up' | 'down') => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return
    const siblings = projects
      .filter((p) => p.workspace_id === project.workspace_id && !p.archived)
      .sort((a, b) => a.sort_order - b.sort_order)
    const idx = siblings.findIndex((p) => p.id === projectId)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= siblings.length) return
    const a = siblings[idx], b = siblings[swapIdx]
    await updateProject(a.id, { sort_order: b.sort_order })
    await updateProject(b.id, { sort_order: a.sort_order })
    setContextMenu(null)
  }

  // Workspace color picker state
  const [colorPickerWsId, setColorPickerWsId] = useState<string | null>(null)

  // --- Context menu ---
  const handleContextMenu = (e: React.MouseEvent, target: ContextTarget) => {
    e.preventDefault()
    setContextMenu(target)
  }

  // --- Nav item helper ---
  const navItem = (
    path: string,
    label: string,
    icon: React.ReactNode,
    badge?: number | null,
  ) => {
    const active = isActive(path)
    return (
      <button
        onClick={() => navigate(path)}
        className={`group/nav mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
          active
            ? 'bg-brand-500/10 text-brand-400'
            : 'text-[var(--text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)]'
        }`}
      >
        <span className={`flex-shrink-0 ${active ? 'text-brand-400' : 'text-[var(--text-muted)] group-hover/nav:text-[var(--text-tertiary)]'}`}>
          {icon}
        </span>
        <span className="flex-1 text-left">{label}</span>
        {badge != null && badge > 0 && (
          <span className="badge-pulse min-w-[18px] rounded-full bg-brand-500/90 px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-white">
            {badge}
          </span>
        )}
      </button>
    )
  }

  if (!sidebarOpen) {
    return (
      <aside className="flex h-screen w-14 flex-col items-center border-r border-[var(--border-default)] bg-[var(--color-surface-sidebar)] py-3">
        <button
          onClick={toggleSidebar}
          className="mb-4 rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)]"
          title="Expand sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </aside>
    )
  }

  return (
    <aside className="flex h-screen w-[260px] flex-col border-r border-[var(--border-default)] bg-[var(--color-surface-sidebar)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-sm">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 8l4 4L14 4" />
            </svg>
          </div>
          <h1 className="text-lg font-extrabold tracking-tight text-[var(--text-primary)]">
            <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">JORNADA</span>
          </h1>
        </div>
        <button
          onClick={toggleSidebar}
          className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)]"
          title="Collapse sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 pb-2">
        {/* Core nav */}
        <div className="mb-1">
          {navItem('/', 'Today', <IconToday active={isActive('/')} />)}
          {navItem('/dashboard', 'Dashboard', <IconDashboard active={isActive('/dashboard')} />)}
          {navItem('/search', 'Search', <IconSearch active={isActive('/search')} />)}
        </div>

        {/* Divider */}
        <div className="mx-3 my-3 border-t border-[var(--border-subtle)]" />

        {/* Workspace groups */}
        {[...workspaces].sort((a, b) => a.sort_order - b.sort_order).map((workspace) => {
          const wsProjects = projects.filter((p) => p.workspace_id === workspace.id && !p.archived).sort((a, b) => a.sort_order - b.sort_order)
          const color = getWsColor(workspace)

          return (
            <div key={workspace.id} className="mb-4">
              {/* Workspace header */}
              {renamingWorkspace === workspace.id ? (
                <div className="px-3 py-1">
                  <input
                    value={wsRenameValue}
                    onChange={(e) => setWsRenameValue(e.target.value)}
                    onBlur={() => handleRenameWorkspace(workspace.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameWorkspace(workspace.id)
                      if (e.key === 'Escape') setRenamingWorkspace(null)
                    }}
                    className="w-full rounded-md bg-[var(--color-surface-input)] px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-brand-500"
                    autoFocus
                  />
                </div>
              ) : (
                <div
                  className="group mb-1 flex items-center justify-between px-3 py-1.5"
                  onContextMenu={(e) => handleContextMenu(e, { kind: 'workspace', id: workspace.id, x: e.clientX, y: e.clientY })}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-3 w-3 rounded" style={{ backgroundColor: color }} />
                    <span className="text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                      {workspace.name}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setAddingToWorkspace(addingToWorkspace === workspace.id ? null : workspace.id)
                      setNewProjectName('')
                    }}
                    className="rounded p-0.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-tertiary)] transition-opacity"
                    title="Add project"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                  </button>
                </div>
              )}

              {/* Projects — nested with colored rail */}
              <div className="relative ml-[18px] border-l-2 pl-0" style={{ borderColor: `${color}30` }}>
                {wsProjects.map((project) => {
                  const active = isActive(`/project/${project.id}`)
                  const count = projectTaskCounts[project.id] ?? 0
                  return (
                    <div key={project.id}>
                      {renamingProject === project.id ? (
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => handleRenameProject(project.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameProject(project.id)
                            if (e.key === 'Escape') setRenamingProject(null)
                          }}
                          className="ml-3 w-[calc(100%-12px)] rounded-md bg-[var(--color-surface-input)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-brand-500"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setActiveProject(project.id)
                            navigate(`/project/${project.id}`)
                          }}
                          onContextMenu={(e) => handleContextMenu(e, { kind: 'project', id: project.id, x: e.clientX, y: e.clientY })}
                          className={`group/proj flex w-full items-center gap-2 rounded-r-lg py-2 pl-4 pr-3 text-sm font-medium transition-all ${
                            active
                              ? 'text-[var(--text-primary)]'
                              : 'text-[var(--text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-primary)]'
                          }`}
                          style={active ? { backgroundColor: `${color}15`, color: color } : undefined}
                        >
                          <span className="flex-1 truncate text-left">{project.name}</span>
                          {count > 0 && (
                            <span className={`text-[10px] tabular-nums ${
                              active ? 'opacity-70' : 'text-[var(--text-muted)] group-hover/proj:text-[var(--text-tertiary)]'
                            }`}>
                              {count}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  )
                })}

                {/* Add project form */}
                {addingToWorkspace === workspace.id && (
                  <div className="py-1 pl-4 pr-3">
                    <input
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateProject(workspace.id, workspace.name)
                        if (e.key === 'Escape') setAddingToWorkspace(null)
                      }}
                      onBlur={() => handleCreateProject(workspace.id, workspace.name)}
                      placeholder="Project name..."
                      className="w-full rounded-md border border-[var(--border-default)] bg-[var(--color-surface-input)] px-2 py-1 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-brand-500 focus:outline-none"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Add workspace */}
        {addingWorkspace ? (
          <div className="mb-2 px-3 py-1">
            <input
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateWorkspace()
                if (e.key === 'Escape') setAddingWorkspace(false)
              }}
              onBlur={handleCreateWorkspace}
              placeholder="Workspace name..."
              className="w-full rounded-md border border-[var(--border-default)] bg-[var(--color-surface-input)] px-2 py-1 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-brand-500 focus:outline-none"
              autoFocus
            />
          </div>
        ) : (
          <button
            onClick={() => { setAddingWorkspace(true); setNewWorkspaceName('') }}
            className="mb-2 flex w-full items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-tertiary)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            <span>Add Workspace</span>
          </button>
        )}
      </nav>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)} />
          <div
            className="popover fixed z-50 w-40 rounded-lg py-1"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.kind === 'project' && (() => {
              const project = projects.find((p) => p.id === contextMenu.id)
              const siblings = project
                ? projects.filter((p) => p.workspace_id === project.workspace_id && !p.archived).sort((a, b) => a.sort_order - b.sort_order)
                : []
              const idx = siblings.findIndex((p) => p.id === contextMenu.id)
              return (
                <>
                  <button
                    onClick={() => handleMoveProject(contextMenu.id, 'up')}
                    disabled={idx <= 0}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--color-surface-hover)] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                    Move Up
                  </button>
                  <button
                    onClick={() => handleMoveProject(contextMenu.id, 'down')}
                    disabled={idx >= siblings.length - 1}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--color-surface-hover)] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    Move Down
                  </button>
                  <div className="my-1 border-t border-[var(--border-subtle)]" />
                  <button
                    onClick={() => {
                      if (project) {
                        setRenameValue(project.name)
                        setRenamingProject(project.id)
                      }
                      setContextMenu(null)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--color-surface-hover)]"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleArchiveProject(contextMenu.id)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-[var(--color-surface-hover)]"
                  >
                    Archive
                  </button>
                </>
              )
            })()}
            {contextMenu.kind === 'workspace' && (() => {
              const sorted = [...workspaces].sort((a, b) => a.sort_order - b.sort_order)
              const idx = sorted.findIndex((w) => w.id === contextMenu.id)
              return (
                <>
                  <button
                    onClick={() => handleMoveWorkspace(contextMenu.id, 'up')}
                    disabled={idx <= 0}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--color-surface-hover)] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                    Move Up
                  </button>
                  <button
                    onClick={() => handleMoveWorkspace(contextMenu.id, 'down')}
                    disabled={idx >= sorted.length - 1}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--color-surface-hover)] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    Move Down
                  </button>
                  <div className="my-1 border-t border-[var(--border-subtle)]" />
                  <button
                    onClick={() => { setColorPickerWsId(contextMenu.id); setContextMenu(null) }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--color-surface-hover)]"
                  >
                    <div className="h-3.5 w-3.5 rounded-full border border-[var(--border-default)]" style={{ backgroundColor: getWsColor(sorted[idx]) }} />
                    Color
                  </button>
                  <button
                    onClick={() => {
                      const ws = workspaces.find((w) => w.id === contextMenu.id)
                      if (ws) {
                        setWsRenameValue(ws.name)
                        setRenamingWorkspace(ws.id)
                      }
                      setContextMenu(null)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--color-surface-hover)]"
                  >
                    Rename
                  </button>
                  <div className="my-1 border-t border-[var(--border-subtle)]" />
                  <button
                    onClick={() => handleDeleteWorkspace(contextMenu.id)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-[var(--color-surface-hover)]"
                  >
                    Delete
                  </button>
                </>
              )
            })()}
          </div>
        </>
      )}

      {/* Workspace color picker */}
      {colorPickerWsId && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setColorPickerWsId(null)} />
          <div className="popover fixed left-[70px] top-1/3 z-50 w-48 rounded-xl p-3">
            <p className="mb-2.5 text-xs font-semibold text-[var(--text-tertiary)]">Workspace color</p>
            <div className="flex flex-wrap gap-2">
              {WS_COLOR_SWATCHES.map((c) => {
                const ws = workspaces.find((w) => w.id === colorPickerWsId)
                const current = ws ? getWsColor(ws) : ''
                return (
                  <button
                    key={c}
                    onClick={() => { updateWorkspace(colorPickerWsId, { color: c }); setColorPickerWsId(null) }}
                    className={`h-6 w-6 rounded-full ring-offset-2 ring-offset-[var(--color-surface-overlay)] transition-all ${
                      current === c ? 'ring-2 ring-brand-400 scale-110' : 'hover:ring-2 hover:ring-[var(--text-muted)] hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="border-t border-[var(--border-subtle)] px-2 py-3">
        <button
          onClick={toggleTheme}
          className="group/nav flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)]"
        >
          <span className="text-[var(--text-muted)] group-hover/nav:text-[var(--text-tertiary)]"><IconTheme dark={theme === 'dark'} /></span>
          <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
        <button
          onClick={() => navigate('/settings')}
          className={`group/nav flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
            isActive('/settings')
              ? 'bg-brand-500/10 text-brand-400'
              : 'text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <span className={isActive('/settings') ? 'text-brand-400' : 'text-[var(--text-muted)] group-hover/nav:text-[var(--text-tertiary)]'}>
            <IconSettings active={isActive('/settings')} />
          </span>
          <span>Settings</span>
        </button>
      </div>
    </aside>
  )
}
