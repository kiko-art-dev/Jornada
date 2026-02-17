import { useEffect, useState, useRef, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useUIStore } from '../../stores/uiStore'
import { useTaskStore } from '../../stores/taskStore'
import { useProjectStore } from '../../stores/projectStore'
import { PriorityBadge } from '../shared/PriorityBadge'
import { TagBadge } from '../shared/TagBadge'
import { RECURRENCE_OPTIONS } from '../../lib/recurrence'
import { format, formatDistanceToNow } from 'date-fns'
import { DISCIPLINE_LIST } from '../../lib/discipline'
import { DisciplineBadge } from '../shared/DisciplineBadge'
import { AttachmentUpload } from './AttachmentUpload'
import { AttachmentGallery } from './AttachmentGallery'
import type { Priority, TaskType, Severity, RecurrenceRule, Discipline } from '../../types'

const selectClass = 'rounded-lg bg-[var(--color-surface-input)] border border-[var(--border-subtle)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--color-surface-card)] hover:border-[var(--border-default)] hover:shadow-sm focus:bg-[var(--color-surface-card)] focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 focus:outline-none transition-all cursor-pointer'
const sectionHeading = 'text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]'

export function TaskDrawer() {
  const { drawerTaskId, closeDrawer } = useUIStore()
  const tasks = useTaskStore((s) => s.tasks)
  const updateTask = useTaskStore((s) => s.updateTask)
  const archiveTask = useTaskStore((s) => s.archiveTask)
  const fetchTaskDetails = useTaskStore((s) => s.fetchTaskDetails)
  const fetchTaskActivity = useTaskStore((s) => s.fetchTaskActivity)
  const taskActivity = useTaskStore((s) => s.taskActivity)
  const getTaskChecklist = useTaskStore((s) => s.getTaskChecklist)
  const getTaskNotes = useTaskStore((s) => s.getTaskNotes)
  const getTaskTagIds = useTaskStore((s) => s.getTaskTagIds)
  const addChecklistItem = useTaskStore((s) => s.addChecklistItem)
  const toggleChecklistItem = useTaskStore((s) => s.toggleChecklistItem)
  const deleteChecklistItem = useTaskStore((s) => s.deleteChecklistItem)
  const addNote = useTaskStore((s) => s.addNote)
  const addTagToTask = useTaskStore((s) => s.addTagToTask)
  const removeTagFromTask = useTaskStore((s) => s.removeTagFromTask)
  const getTaskDependencies = useTaskStore((s) => s.getTaskDependencies)
  const getTaskBlocking = useTaskStore((s) => s.getTaskBlocking)
  const addDependency = useTaskStore((s) => s.addDependency)
  const removeDependency = useTaskStore((s) => s.removeDependency)
  const getTaskAttachments = useTaskStore((s) => s.getTaskAttachments)
  const uploadAttachment = useTaskStore((s) => s.uploadAttachment)

  const statuses = useProjectStore((s) => s.statuses)
  const tags = useProjectStore((s) => s.tags)
  const releases = useProjectStore((s) => s.releases)

  const task = tasks.find((t) => t.id === drawerTaskId)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const [descValue, setDescValue] = useState('')
  const [editingDesc, setEditingDesc] = useState(false)
  const [previewDesc, setPreviewDesc] = useState(false)
  const [newCheckItem, setNewCheckItem] = useState('')
  const [newNote, setNewNote] = useState('')
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [animatingCheckId, setAnimatingCheckId] = useState<string | null>(null)
  const [depSearch, setDepSearch] = useState('')
  const [showDepSearch, setShowDepSearch] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (drawerTaskId) {
      fetchTaskDetails(drawerTaskId)
      fetchTaskActivity(drawerTaskId)
    }
  }, [drawerTaskId, fetchTaskDetails, fetchTaskActivity])

  useEffect(() => {
    if (task) {
      setTitleValue(task.title)
      setDescValue(task.description ?? '')
      setEditingDesc(false)
      setPreviewDesc(false)
    }
  }, [task])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawerTaskId) closeDrawer()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [drawerTaskId, closeDrawer])

  useEffect(() => {
    if (!drawerTaskId) return
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            e.preventDefault()
            uploadAttachment(drawerTaskId, file)
          }
          break
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [drawerTaskId, uploadAttachment])

  const projectStatuses = task ? statuses.filter((s) => s.project_id === task.project_id) : []
  const currentStatus = task ? statuses.find((s) => s.id === task.status_id) : undefined
  const projectReleases = task ? releases.filter((r) => r.project_id === task.project_id) : []
  const currentRelease = task ? releases.find((r) => r.id === task.release_id) : undefined
  const checklist = task ? getTaskChecklist(task.id) : []
  const notes = task ? getTaskNotes(task.id) : []
  const taskTagIds = task ? getTaskTagIds(task.id) : []
  const taskTags = taskTagIds.map((id) => tags.find((t) => t.id === id)).filter(Boolean)
  const checkedCount = checklist.filter((c) => c.checked).length
  const activity = task ? taskActivity.filter((a) => a.task_id === task.id) : []
  const dependencies = task ? getTaskDependencies(task.id) : []
  const blocking = task ? getTaskBlocking(task.id) : []
  const attachments = task ? getTaskAttachments(task.id) : []

  const depSearchResults = useMemo(() => {
    if (!depSearch.trim() || !task) return []
    const lower = depSearch.toLowerCase()
    const existingDepIds = new Set(dependencies.map((d) => d.depends_on_task_id))
    return tasks
      .filter((t) => t.id !== task.id && !existingDepIds.has(t.id) && t.title.toLowerCase().includes(lower))
      .slice(0, 5)
  }, [depSearch, tasks, task, dependencies])

  const handleTitleSave = () => {
    if (!task) return
    setEditingTitle(false)
    if (titleValue.trim() && titleValue !== task.title) {
      updateTask(task.id, { title: titleValue.trim() })
    }
  }

  const handleDescSave = () => {
    if (!task) return
    setEditingDesc(false)
    if (descValue !== (task.description ?? '')) {
      updateTask(task.id, { description: descValue || null })
    }
  }

  const handleAddCheckItem = () => {
    if (!task) return
    if (newCheckItem.trim()) {
      addChecklistItem(task.id, newCheckItem.trim())
      setNewCheckItem('')
    }
  }

  const handleAddNote = () => {
    if (!task) return
    if (newNote.trim()) {
      addNote(task.id, newNote.trim())
      setNewNote('')
    }
  }

  const handleToggleCheck = (id: string) => {
    setAnimatingCheckId(id)
    toggleChecklistItem(id)
    setTimeout(() => setAnimatingCheckId(null), 200)
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'created': return '\u2728'
      case 'updated': return '\u270F\uFE0F'
      case 'archived': return '\u{1F5C4}\uFE0F'
      default: return '\u2022'
    }
  }

  const getActivityLabel = (a: typeof activity[0]) => {
    if (a.action === 'created') return 'Created'
    if (a.action === 'archived') return 'Archived'
    if (a.field === 'status_id') return `Status changed`
    if (a.field === 'priority') return `Priority changed to ${a.new_value}`
    if (a.field === 'title') return `Title updated`
    if (a.field === 'due_date') return `Due date changed to ${a.new_value || 'none'}`
    if (a.field === 'type') return `Type changed to ${a.new_value}`
    if (a.field === 'recurrence_rule') return `Recurrence set to ${a.new_value || 'none'}`
    if (a.field === 'discipline') return `Discipline set to ${a.new_value || 'none'}`
    return `Updated ${a.field ?? ''}`
  }

  return (
    <AnimatePresence>
      {drawerTaskId && task && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/20"
            onClick={closeDrawer}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-xl flex-col border-l border-[var(--border-default)] bg-[var(--color-surface-card)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
              <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                <span className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5 font-mono">{task.type}</span>
                {task.recurrence_rule && (
                  <span className="rounded bg-brand-500/10 px-1.5 py-0.5 text-brand-400">{'\u{1F501}'} {task.recurrence_rule}</span>
                )}
              </div>
              <button onClick={closeDrawer} className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Title */}
              {editingTitle ? (
                <input
                  ref={titleRef}
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                  className="mb-4 w-full bg-transparent text-xl font-bold text-[var(--text-primary)] focus:outline-none"
                  autoFocus
                />
              ) : (
                <h2 onClick={() => setEditingTitle(true)} className="mb-4 cursor-text text-xl font-bold text-[var(--text-primary)] hover:text-[var(--text-primary)]">
                  {task.title}
                </h2>
              )}

              {/* Metadata grid */}
              <div className="mb-6 grid grid-cols-[110px_1fr] gap-y-3.5 text-sm">
                <span className="text-xs font-medium text-[var(--text-tertiary)]">Status</span>
                <select
                  value={task.status_id ?? ''}
                  onChange={(e) => updateTask(task.id, { status_id: e.target.value || null })}
                  className={selectClass}
                >
                  <option value="">None</option>
                  {projectStatuses.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                <span className="text-xs font-medium text-[var(--text-tertiary)]">Priority</span>
                <div className="flex items-center gap-2">
                  <select
                    value={task.priority}
                    onChange={(e) => updateTask(task.id, { priority: Number(e.target.value) as Priority })}
                    className={selectClass}
                  >
                    <option value={1}>Urgent</option>
                    <option value={2}>High</option>
                    <option value={3}>Medium</option>
                    <option value={4}>Low</option>
                  </select>
                  <PriorityBadge priority={task.priority} />
                </div>

                <span className="text-xs font-medium text-[var(--text-tertiary)]">Type</span>
                <select
                  value={task.type}
                  onChange={(e) => updateTask(task.id, { type: e.target.value as TaskType })}
                  className={selectClass}
                >
                  <option value="task">Task</option>
                  <option value="bug">Bug</option>
                  <option value="feature">Feature</option>
                </select>

                <span className="text-xs font-medium text-[var(--text-tertiary)]">Due date</span>
                <input
                  type="date"
                  value={task.due_date ?? ''}
                  onChange={(e) => updateTask(task.id, { due_date: e.target.value || null })}
                  className={selectClass}
                />

                <span className="text-xs font-medium text-[var(--text-tertiary)]">Recurrence</span>
                <select
                  value={task.recurrence_rule ?? ''}
                  onChange={(e) => updateTask(task.id, { recurrence_rule: (e.target.value || null) as RecurrenceRule | null })}
                  className={selectClass}
                >
                  {RECURRENCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                <span className="text-xs font-medium text-[var(--text-tertiary)]">Discipline</span>
                <div className="flex items-center gap-2">
                  <select
                    value={task.discipline ?? ''}
                    onChange={(e) => updateTask(task.id, { discipline: (e.target.value || null) as Discipline | null })}
                    className={selectClass}
                  >
                    <option value="">None</option>
                    {DISCIPLINE_LIST.map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                  {task.discipline && <DisciplineBadge discipline={task.discipline} />}
                </div>

                {projectReleases.length > 0 && (
                  <>
                    <span className="text-xs font-medium text-[var(--text-tertiary)]">Release</span>
                    <select
                      value={task.release_id ?? ''}
                      onChange={(e) => updateTask(task.id, { release_id: e.target.value || null })}
                      className={selectClass}
                    >
                      <option value="">None</option>
                      {projectReleases.map((r) => (
                        <option key={r.id} value={r.id}>{r.version}{r.title ? ` \u2014 ${r.title}` : ''}</option>
                      ))}
                    </select>
                  </>
                )}

                <span className="text-xs font-medium text-[var(--text-tertiary)]">Tags</span>
                <div className="flex flex-wrap items-center gap-1">
                  {taskTags.map((tag) => tag && (
                    <TagBadge key={tag.id} name={tag.name} color={tag.color} onRemove={() => removeTagFromTask(task.id, tag.id)} />
                  ))}
                  <div className="relative">
                    <button onClick={() => setShowTagPicker(!showTagPicker)} className="rounded px-1.5 py-0.5 text-xs text-[var(--text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)]">
                      + tag
                    </button>
                    {showTagPicker && (
                      <div className="popover absolute left-0 top-full z-10 mt-1 w-40 rounded-md p-1">
                        {tags.filter((t) => !taskTagIds.includes(t.id)).map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => { addTagToTask(task.id, tag.id); setShowTagPicker(false) }}
                            className="flex w-full items-center gap-2 rounded px-2 py-1 text-sm text-[var(--text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-primary)]"
                          >
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color ?? '#6b7280' }} />
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <div className="mb-2 flex items-center gap-2">
                  <h3 className={sectionHeading}>Description</h3>
                  {task.description && !editingDesc && (
                    <button
                      onClick={() => setPreviewDesc(!previewDesc)}
                      className="rounded px-1.5 py-0.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)]"
                    >
                      {previewDesc ? 'Raw' : 'Preview'}
                    </button>
                  )}
                </div>
                {editingDesc ? (
                  <textarea
                    value={descValue}
                    onChange={(e) => setDescValue(e.target.value)}
                    onBlur={handleDescSave}
                    rows={5}
                    className="w-full min-h-[80px] rounded-md border border-[var(--border-subtle)] bg-[var(--color-surface-input)] px-3 py-2 text-sm text-[var(--text-secondary)] placeholder-[var(--text-muted)] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                    placeholder="Add a description (markdown supported)..."
                    autoFocus
                  />
                ) : previewDesc && task.description ? (
                  <div
                    onClick={() => { setEditingDesc(true); setPreviewDesc(false) }}
                    className="prose-dark cursor-text rounded-md border border-[var(--border-subtle)] px-3 py-2 text-sm text-[var(--text-secondary)]"
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.description}</ReactMarkdown>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditingDesc(true)}
                    className="min-h-[80px] cursor-text rounded-md border border-[var(--border-subtle)] px-3 py-2 text-sm text-[var(--text-tertiary)] hover:border-[var(--border-default)] whitespace-pre-wrap"
                  >
                    {task.description || 'Click to add a description...'}
                  </div>
                )}
              </div>

              {/* Bug fields */}
              {task.type === 'bug' && (
                <div className="mb-6 rounded-md border border-[var(--border-subtle)] p-4">
                  <h3 className={`mb-3 ${sectionHeading}`}>Bug Details</h3>
                  <div className="grid grid-cols-[110px_1fr] gap-y-3.5 text-sm">
                    <span className="text-xs font-medium text-[var(--text-tertiary)]">Severity</span>
                    <select
                      value={task.severity ?? ''}
                      onChange={(e) => updateTask(task.id, { severity: (e.target.value || null) as Severity | null })}
                      className={selectClass}
                    >
                      <option value="">None</option>
                      <option value="critical">Critical</option>
                      <option value="major">Major</option>
                      <option value="minor">Minor</option>
                      <option value="trivial">Trivial</option>
                    </select>
                    <span className="text-xs font-medium text-[var(--text-tertiary)]">Repro steps</span>
                    <textarea
                      value={task.repro_steps ?? ''}
                      onChange={(e) => updateTask(task.id, { repro_steps: e.target.value || null })}
                      rows={3}
                      placeholder="1. Step one&#10;2. Step two"
                      className={`${selectClass} min-h-0`}
                    />
                    <span className="text-xs font-medium text-[var(--text-tertiary)]">Expected</span>
                    <input
                      value={task.expected ?? ''}
                      onChange={(e) => updateTask(task.id, { expected: e.target.value || null })}
                      placeholder="What should happen"
                      className={selectClass}
                    />
                    <span className="text-xs font-medium text-[var(--text-tertiary)]">Actual</span>
                    <input
                      value={task.actual ?? ''}
                      onChange={(e) => updateTask(task.id, { actual: e.target.value || null })}
                      placeholder="What actually happens"
                      className={selectClass}
                    />
                  </div>
                </div>
              )}

              {/* Dependencies */}
              <div className="mb-6">
                <h3 className={`mb-2 ${sectionHeading}`}>Dependencies</h3>
                {dependencies.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {dependencies.map((dep) => {
                      const depTask = tasks.find((t) => t.id === dep.depends_on_task_id)
                      return (
                        <span key={dep.id} className="inline-flex items-center gap-1 rounded bg-orange-500/10 px-2 py-0.5 text-xs text-orange-400">
                          {depTask?.title ?? 'Unknown'}
                          <button onClick={() => removeDependency(dep.id)} className="text-orange-400/60 hover:text-orange-300">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}
                {blocking.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs text-[var(--text-muted)]">Blocking: </span>
                    {blocking.map((dep) => {
                      const bt = tasks.find((t) => t.id === dep.task_id)
                      return <span key={dep.id} className="mr-1 text-xs text-[var(--text-tertiary)]">{bt?.title ?? 'Unknown'}</span>
                    })}
                  </div>
                )}
                <div className="relative">
                  <button
                    onClick={() => setShowDepSearch(!showDepSearch)}
                    className="rounded px-1.5 py-0.5 text-xs text-[var(--text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)]"
                  >
                    + dependency
                  </button>
                  {showDepSearch && (
                    <div className="popover absolute left-0 top-full z-10 mt-1 w-64 rounded-md p-2">
                      <input
                        value={depSearch}
                        onChange={(e) => setDepSearch(e.target.value)}
                        placeholder="Search tasks..."
                        className="w-full rounded bg-[var(--color-surface-input)] border border-[var(--border-subtle)] px-2 py-1 text-sm text-[var(--text-secondary)] placeholder-[var(--text-muted)] focus:outline-none"
                        autoFocus
                      />
                      {depSearchResults.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            addDependency(task.id, t.id)
                            setDepSearch('')
                            setShowDepSearch(false)
                          }}
                          className="flex w-full items-center rounded px-2 py-1 text-sm text-[var(--text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-primary)]"
                        >
                          {t.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Attachments */}
              <div className="mb-6">
                <h3 className={`mb-2 ${sectionHeading}`}>
                  Attachments{attachments.length > 0 && ` (${attachments.length})`}
                </h3>
                <AttachmentGallery attachments={attachments} />
                <div className={attachments.length > 0 ? 'mt-2' : ''}>
                  <AttachmentUpload taskId={task.id} />
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Paste from clipboard (Ctrl+V) or drag & drop</p>
              </div>

              {/* Checklist */}
              <div className="mb-6">
                <div className="mb-2 flex items-center gap-2">
                  <h3 className={sectionHeading}>Checklist</h3>
                  {checklist.length > 0 && (
                    <span className="text-xs text-[var(--text-muted)]">{checkedCount}/{checklist.length}</span>
                  )}
                </div>
                {checklist.length > 0 && (
                  <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
                    <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(checkedCount / checklist.length) * 100}%` }} />
                  </div>
                )}
                {checklist.map((item) => (
                  <div key={item.id} className="group flex items-center gap-2 py-1.5">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleToggleCheck(item.id)}
                      className={`h-4 w-4 rounded border-[var(--border-default)] bg-[var(--color-surface-input)] text-brand-500 focus:ring-brand-500 ${animatingCheckId === item.id ? 'check-bounce' : ''}`}
                    />
                    <span className={`flex-1 text-sm ${item.checked ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-secondary)]'}`}>{item.title}</span>
                    <button onClick={() => deleteChecklistItem(item.id)} className="hidden text-[var(--text-muted)] hover:text-red-400 group-hover:block">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                ))}
                <div className="mt-1 flex gap-1">
                  <input
                    value={newCheckItem}
                    onChange={(e) => setNewCheckItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCheckItem()}
                    placeholder="Add item..."
                    className="flex-1 bg-transparent px-1 py-1 text-sm text-[var(--text-secondary)] placeholder-[var(--text-muted)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <h3 className={`mb-2 ${sectionHeading}`}>Notes</h3>
                <div className="flex gap-2">
                  <input
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    placeholder="Add a note..."
                    className="flex-1 rounded-md border border-[var(--border-subtle)] bg-[var(--color-surface-input)] px-3 py-1.5 text-sm text-[var(--text-secondary)] placeholder-[var(--text-muted)] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                  />
                  <button onClick={handleAddNote} className="rounded-md bg-[var(--color-surface-hover)] px-3 py-1.5 text-sm text-[var(--text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)]">
                    Add
                  </button>
                </div>
                {notes.map((note) => (
                  <div key={note.id} className="mt-2 rounded-md border border-[var(--border-subtle)] px-3 py-2">
                    <p className="text-sm text-[var(--text-secondary)]">{note.content}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{format(new Date(note.created_at), 'MMM d, yyyy HH:mm')}</p>
                  </div>
                ))}
              </div>

              {/* Activity Timeline */}
              {activity.length > 0 && (
                <div className="mb-6">
                  <h3 className={`mb-2 ${sectionHeading}`}>Activity</h3>
                  <div className="space-y-2">
                    {activity.slice(0, 15).map((a) => (
                      <div key={a.id} className="flex items-start gap-2 text-xs">
                        <span className="mt-0.5 flex-shrink-0">{getActivityIcon(a.action)}</span>
                        <div className="flex-1">
                          <span className="text-[var(--text-tertiary)]">{getActivityLabel(a)}</span>
                          <span className="ml-2 text-[var(--text-muted)]">
                            {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 border-t border-[var(--border-subtle)] px-6 py-3">
              <button
                onClick={() => { archiveTask(task.id); closeDrawer() }}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-hover)] px-3 py-2 text-xs font-medium text-[var(--text-tertiary)] hover:border-red-300 hover:bg-red-50 hover:text-red-500 transition-all"
              >
                Archive
              </button>
              {currentStatus && <span className="ml-auto text-xs text-[var(--text-muted)]">{currentStatus.name}</span>}
              {currentRelease && <span className="text-xs text-[var(--text-muted)]">{currentRelease.version}</span>}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
