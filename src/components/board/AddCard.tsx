import { useState, useRef, useEffect } from 'react'
import { useTaskStore } from '../../stores/taskStore'

interface Props {
  projectId: string
  statusId: string
}

export function AddCard({ projectId, statusId }: Props) {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const createTask = useTaskStore((s) => s.createTask)

  useEffect(() => {
    if (isAdding) titleRef.current?.focus()
  }, [isAdding])

  // Close form when clicking outside
  useEffect(() => {
    if (!isAdding) return
    const handleClickOutside = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        handleSubmit()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isAdding, title, description])

  const handleSubmit = async () => {
    const trimmed = title.trim()
    if (!trimmed) {
      setIsAdding(false)
      setTitle('')
      setDescription('')
      return
    }
    await createTask({
      title: trimmed,
      description: description.trim() || null,
      project_id: projectId,
      status_id: statusId,
    })
    setTitle('')
    setDescription('')
    titleRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      setTitle('')
      setDescription('')
      setIsAdding(false)
    }
  }

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--color-surface-card)] hover:text-[var(--text-secondary)] hover:shadow-sm transition-all"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2z" />
        </svg>
        <span>Add task</span>
      </button>
    )
  }

  return (
    <div ref={formRef} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-card)] p-3 shadow-sm">
      <input
        ref={titleRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Task title..."
        className="w-full bg-transparent px-1 py-1 text-sm font-semibold text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Description (optional)..."
        rows={2}
        className="mt-1 w-full resize-none bg-transparent px-1 py-1 text-xs leading-relaxed text-[var(--text-secondary)] placeholder-[var(--text-muted)] focus:outline-none"
      />
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)]">Enter to save, Esc to cancel</span>
        <button
          onMouseDown={(e) => { e.preventDefault(); handleSubmit() }}
          className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-500 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  )
}
