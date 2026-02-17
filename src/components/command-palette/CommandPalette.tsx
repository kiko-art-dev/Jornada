import { useEffect, useMemo } from 'react'
import { Command } from 'cmdk'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../stores/uiStore'
import { useProjectStore } from '../../stores/projectStore'
import { useTaskStore } from '../../stores/taskStore'

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, setQuickCaptureOpen, openDrawer, setViewMode } = useUIStore()
  const workspaces = useProjectStore((s) => s.workspaces)
  const projects = useProjectStore((s) => s.projects)
  const allTasks = useTaskStore((s) => s.tasks)
  const navigate = useNavigate()

  const tasks = useMemo(
    () => allTasks.filter((t) => !t.archived).slice(0, 50),
    [allTasks]
  )

  // Ctrl+K / Cmd+K toggle
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  const close = () => setCommandPaletteOpen(false)

  const runAction = (fn: () => void) => {
    fn()
    close()
  }

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-50 bg-black/20"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2"
          >
            <Command
              className="popover overflow-hidden rounded-xl"
              loop
            >
              <Command.Input
                placeholder="Search tasks, projects, or actions..."
                className="w-full border-b border-[var(--border-subtle)] bg-transparent px-4 py-3.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
                autoFocus
              />
              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="px-4 py-6 text-center text-sm text-[var(--text-tertiary)]">
                  No results found.
                </Command.Empty>

                {/* Actions */}
                <Command.Group heading="Actions" className="mb-2">
                  <Command.Item
                    onSelect={() => runAction(() => setQuickCaptureOpen(true))}
                    className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] data-[selected=true]:bg-brand-500/10 data-[selected=true]:text-[var(--text-primary)]"
                  >
                    <span>New Task</span>
                    <kbd className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5 text-xs text-[var(--text-tertiary)]">Q</kbd>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runAction(() => navigate('/'))}
                    className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] data-[selected=true]:bg-brand-500/10 data-[selected=true]:text-[var(--text-primary)]"
                  >
                    <span>Go to Today</span>
                    <kbd className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5 text-xs text-[var(--text-tertiary)]">G T</kbd>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runAction(() => navigate('/dashboard'))}
                    className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] data-[selected=true]:bg-brand-500/10 data-[selected=true]:text-[var(--text-primary)]"
                  >
                    <span>Go to Dashboard</span>
                    <span />
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runAction(() => navigate('/search'))}
                    className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] data-[selected=true]:bg-brand-500/10 data-[selected=true]:text-[var(--text-primary)]"
                  >
                    <span>Go to Search</span>
                    <span />
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runAction(() => setViewMode('board'))}
                    className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] data-[selected=true]:bg-brand-500/10 data-[selected=true]:text-[var(--text-primary)]"
                  >
                    <span>Switch to Board View</span>
                    <kbd className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5 text-xs text-[var(--text-tertiary)]">V B</kbd>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runAction(() => setViewMode('list'))}
                    className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] data-[selected=true]:bg-brand-500/10 data-[selected=true]:text-[var(--text-primary)]"
                  >
                    <span>Switch to List View</span>
                    <kbd className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5 text-xs text-[var(--text-tertiary)]">V L</kbd>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runAction(() => setViewMode('calendar'))}
                    className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] data-[selected=true]:bg-brand-500/10 data-[selected=true]:text-[var(--text-primary)]"
                  >
                    <span>Switch to Calendar View</span>
                    <kbd className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5 text-xs text-[var(--text-tertiary)]">V C</kbd>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runAction(() => navigate('/settings'))}
                    className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] data-[selected=true]:bg-brand-500/10 data-[selected=true]:text-[var(--text-primary)]"
                  >
                    <span>Settings</span>
                    <span />
                  </Command.Item>
                </Command.Group>

                {/* Projects */}
                <Command.Group heading="Projects" className="mb-2">
                  {projects.map((project) => {
                    const ws = workspaces.find((w) => w.id === project.workspace_id)
                    return (
                      <Command.Item
                        key={project.id}
                        value={`project ${project.name} ${ws?.name ?? ''}`}
                        onSelect={() => runAction(() => navigate(`/project/${project.id}`))}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] data-[selected=true]:bg-brand-500/10 data-[selected=true]:text-[var(--text-primary)]"
                      >
                        <span className="text-[var(--text-tertiary)]">{ws?.name}</span>
                        <span>/</span>
                        <span>{project.name}</span>
                      </Command.Item>
                    )
                  })}
                </Command.Group>

                {/* Tasks */}
                <Command.Group heading="Tasks" className="mb-2">
                  {tasks.map((task) => (
                    <Command.Item
                      key={task.id}
                      value={`task ${task.title}`}
                      onSelect={() => runAction(() => openDrawer(task.id))}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] data-[selected=true]:bg-brand-500/10 data-[selected=true]:text-[var(--text-primary)]"
                    >
                      <span className={`text-xs ${task.priority <= 2 ? 'text-orange-400' : 'text-[var(--text-muted)]'}`}>
                        {'!'.repeat(Math.max(1, 4 - task.priority))}
                      </span>
                      <span className="truncate">{task.title}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>

              <div className="border-t border-[var(--border-subtle)] px-4 py-2 text-xs text-[var(--text-muted)]">
                <span className="mr-3">{'\u2191\u2193'} Navigate</span>
                <span className="mr-3">Enter Select</span>
                <span>Esc Close</span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
