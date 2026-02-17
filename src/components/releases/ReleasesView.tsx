import { useState, useMemo } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import { useTaskStore } from '../../stores/taskStore'
import { generateChangelog, changelogToMarkdown } from '../../lib/changelog'
import { format } from 'date-fns'
import type { ReleaseStatus } from '../../types'

const statusColors: Record<ReleaseStatus, string> = {
  draft: 'text-[var(--text-tertiary)] bg-[var(--color-surface-hover)]',
  in_progress: 'text-yellow-600 bg-yellow-50',
  released: 'text-green-600 bg-green-50',
}

const statusLabels: Record<ReleaseStatus, string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  released: 'Released',
}

export function ReleasesView({ projectId }: { projectId: string }) {
  const releases = useProjectStore((s) => s.releases)
  const statuses = useProjectStore((s) => s.statuses)
  const createRelease = useProjectStore((s) => s.createRelease)
  const updateRelease = useProjectStore((s) => s.updateRelease)
  const allTasks = useTaskStore((s) => s.tasks)

  const [showForm, setShowForm] = useState(false)
  const [newVersion, setNewVersion] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newTargetDate, setNewTargetDate] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const projectReleases = useMemo(
    () => releases.filter((r) => r.project_id === projectId),
    [releases, projectId]
  )

  const projectStatuses = useMemo(
    () => statuses.filter((s) => s.project_id === projectId),
    [statuses, projectId]
  )

  const handleCreate = async () => {
    if (!newVersion.trim()) return
    await createRelease({
      project_id: projectId,
      version: newVersion.trim(),
      title: newTitle.trim() || null,
      target_date: newTargetDate || null,
    })
    setNewVersion('')
    setNewTitle('')
    setNewTargetDate('')
    setShowForm(false)
  }

  const handleCopyChangelog = (releaseId: string, version: string) => {
    const releaseTasks = allTasks.filter((t) => t.release_id === releaseId)
    const sections = generateChangelog(releaseTasks, projectStatuses)
    const md = changelogToMarkdown(version, sections)
    navigator.clipboard.writeText(md)
    setCopiedId(releaseId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSaveChangelog = async (releaseId: string, version: string) => {
    const releaseTasks = allTasks.filter((t) => t.release_id === releaseId)
    const sections = generateChangelog(releaseTasks, projectStatuses)
    const md = changelogToMarkdown(version, sections)
    await updateRelease(releaseId, { changelog_md: md })
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Releases</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-500"
        >
          + New Release
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-6 rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-card)] p-4">
          <div className="grid grid-cols-3 gap-3">
            <input
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              placeholder="Version (e.g. 2.1.0)"
              className="rounded-md border border-[var(--border-subtle)] bg-[var(--color-surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-brand-500 focus:outline-none"
              autoFocus
            />
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title (optional)"
              className="rounded-md border border-[var(--border-subtle)] bg-[var(--color-surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-brand-500 focus:outline-none"
            />
            <input
              type="date"
              value={newTargetDate}
              onChange={(e) => setNewTargetDate(e.target.value)}
              className="rounded-md border border-[var(--border-subtle)] bg-[var(--color-surface-card)] px-3 py-2 text-sm text-[var(--text-secondary)] focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleCreate}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-500"
            >
              Create
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-md bg-[var(--color-surface-hover)] px-3 py-1.5 text-sm text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Release list */}
      {projectReleases.length === 0 && !showForm && (
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-card)] p-8 text-center">
          <p className="text-[var(--text-tertiary)]">No releases yet.</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Create a release to track versions and generate changelogs.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {projectReleases.map((release) => {
          const releaseTasks = allTasks.filter((t) => t.release_id === release.id)
          const doneTasks = releaseTasks.filter((t) => {
            const status = projectStatuses.find((s) => s.id === t.status_id)
            return status?.category === 'done'
          })
          const progress = releaseTasks.length > 0
            ? Math.round((doneTasks.length / releaseTasks.length) * 100)
            : 0
          const sections = generateChangelog(releaseTasks, projectStatuses)

          return (
            <div key={release.id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-card)] p-4 shadow-sm">
              {/* Release header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-[var(--text-primary)]">v{release.version}</span>
                  {release.title && (
                    <span className="text-sm text-[var(--text-muted)]">{release.title}</span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[release.status]}`}>
                    {statusLabels[release.status]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {release.target_date && (
                    <span className="text-xs text-[var(--text-tertiary)]">
                      Target: {format(new Date(release.target_date), 'MMM d, yyyy')}
                    </span>
                  )}
                  <select
                    value={release.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as ReleaseStatus
                      const updates: Record<string, unknown> = { status: newStatus }
                      if (newStatus === 'released') updates.released_date = new Date().toISOString().split('T')[0]
                      updateRelease(release.id, updates)
                    }}
                    className="rounded-lg bg-[var(--color-surface-hover)] border border-[var(--border-subtle)] px-2 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--color-surface-card)] hover:border-[var(--border-default)] hover:shadow-sm focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="draft">Draft</option>
                    <option value="in_progress">In Progress</option>
                    <option value="released">Released</option>
                  </select>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                  <span>{releaseTasks.length} tasks · {doneTasks.length} done · {releaseTasks.length - doneTasks.length} remaining</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
                  <div
                    className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-brand-500'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Changelog */}
              {sections.length > 0 && (
                <div className="mt-4 rounded-md border border-[var(--border-subtle)] bg-[var(--color-surface-hover)] p-3">
                  {sections.map((section) => (
                    <div key={section.heading} className="mb-2 last:mb-0">
                      <p className="text-xs font-semibold text-[var(--text-muted)]">{section.heading}</p>
                      <ul className="mt-1 space-y-0.5">
                        {section.items.map((item) => (
                          <li key={item.id} className="text-sm text-[var(--text-secondary)]">
                            - {item.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleCopyChangelog(release.id, release.version)}
                  className="rounded-md bg-[var(--color-surface-hover)] px-3 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)]"
                >
                  {copiedId === release.id ? 'Copied!' : 'Copy Markdown'}
                </button>
                <button
                  onClick={() => handleSaveChangelog(release.id, release.version)}
                  className="rounded-md bg-[var(--color-surface-hover)] px-3 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)]"
                >
                  Save Changelog
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
