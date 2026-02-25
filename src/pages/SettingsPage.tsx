import { useState, useRef } from 'react'
import { useUIStore } from '../stores/uiStore'
import { useAuth } from '../hooks/useAuth'
import { useProjectStore } from '../stores/projectStore'
import { useTaskStore } from '../stores/taskStore'
import { exportJSON, exportCSV, importJSON, previewImportJSON, type ImportMode, type ImportPreview } from '../lib/export'

const btnClass = 'rounded-md border border-[var(--border-subtle)] bg-[var(--color-surface-card)] px-3 py-1.5 text-[13px] text-[var(--text-secondary)] hover:border-[var(--border-default)] hover:bg-[var(--color-surface-hover)] disabled:opacity-50'
const inputClass = 'rounded-md border border-[var(--border-subtle)] bg-[var(--color-surface-card)] px-3 py-1.5 text-[13px] text-[var(--text-secondary)] focus:border-brand-500 focus:outline-none'

export function SettingsPage() {
  const { theme, toggleTheme } = useUIStore()
  const { user, signOut } = useAuth()
  const fetchAll = useProjectStore((s) => s.fetchAll)
  const fetchTasks = useTaskStore((s) => s.fetchTasks)
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importMode, setImportMode] = useState<ImportMode>('merge')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExportJSON = async () => {
    setExporting(true)
    try { await exportJSON() } finally { setExporting(false) }
  }

  const handleExportCSV = async () => {
    setExporting(true)
    try { await exportCSV() } finally { setExporting(false) }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFileName(file.name)
    setPreview(null)
    setPendingFile(null)
    setImportStatus('Generating import preview...')

    const previewResult = await previewImportJSON(file)
    if (typeof previewResult === 'string') {
      setImportStatus(previewResult)
    } else {
      setPreview(previewResult)
      setPendingFile(file)
      setImportStatus('Preview ready. Choose mode and run import.')
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRunImport = async () => {
    if (!pendingFile) return

    if (importMode === 'replace') {
      const confirmed = window.confirm('Full replace will delete all current data before restore. Continue?')
      if (!confirmed) return
    }

    setImporting(true)
    setImportStatus(importMode === 'merge' ? 'Merging data...' : 'Replacing data...')

    try {
      const result = await importJSON(pendingFile, { mode: importMode })
      if (result === 'ok') {
        await Promise.all([fetchAll(), fetchTasks()])
        setImportStatus('Import successful! Data refreshed.')
        setPreview(null)
        setPendingFile(null)
        setSelectedFileName(null)
      } else {
        setImportStatus(result)
      }
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-8">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h2>

      <div className="mt-6 space-y-6">
        {/* Theme */}
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-card)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-medium text-[var(--text-primary)]">Theme</h3>
              <p className="text-[13px] text-[var(--text-tertiary)]">Toggle between dark and light mode.</p>
            </div>
            <button onClick={toggleTheme} className={btnClass}>
              {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            </button>
          </div>
        </div>

        {/* Export / Import */}
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-card)] p-5 shadow-sm">
          <h3 className="text-[13px] font-medium text-[var(--text-primary)]">Data</h3>
          <p className="mb-3 text-[13px] text-[var(--text-tertiary)]">Export backups, then preview and import safely.</p>
          <div className="flex gap-2">
            <button onClick={handleExportJSON} disabled={exporting || importing} className={btnClass}>
              Export JSON
            </button>
            <button onClick={handleExportCSV} disabled={exporting || importing} className={btnClass}>
              Export CSV
            </button>
            <button onClick={() => fileInputRef.current?.click()} disabled={importing} className={btnClass}>
              Select Backup
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {selectedFileName && (
            <p className="mt-2 text-[12px] text-[var(--text-muted)]">Selected: {selectedFileName}</p>
          )}

          {preview && (
            <div className="mt-3 rounded-md border border-[var(--border-subtle)] bg-[var(--color-surface-raised)] p-3">
              <p className="text-[12px] font-semibold text-[var(--text-secondary)]">Import Preview</p>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[12px] text-[var(--text-tertiary)]">
                <span>Backup version</span>
                <span className="text-right">{preview.version}</span>
                <span>Backup records</span>
                <span className="text-right">{preview.totalRecords}</span>
                <span>Current records</span>
                <span className="text-right">
                  {Object.values(preview.existingCounts).reduce((sum, value) => sum + value, 0)}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <label htmlFor="import-mode" className="text-[12px] text-[var(--text-tertiary)]">Mode</label>
                <select
                  id="import-mode"
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value as ImportMode)}
                  className={inputClass}
                  disabled={importing}
                >
                  <option value="merge">Safe Merge (Recommended)</option>
                  <option value="replace">Full Replace</option>
                </select>
                <button
                  onClick={handleRunImport}
                  disabled={importing || !pendingFile}
                  className="rounded-md bg-brand-600 px-3 py-1.5 text-[13px] text-white hover:bg-brand-500 disabled:opacity-50"
                >
                  {importing ? 'Importing...' : 'Run Import'}
                </button>
              </div>
              {importMode === 'replace' && (
                <p className="mt-2 text-[12px] text-orange-400">Full replace is destructive and will prompt confirmation.</p>
              )}
            </div>
          )}

          {importStatus && (
            <p className={`mt-2 text-[13px] ${
              importStatus.includes('successful')
                ? 'text-green-400'
                : importStatus.includes('Preview') || importStatus.includes('Generating')
                  ? 'text-[var(--text-muted)]'
                  : importStatus.includes('Merging') || importStatus.includes('Replacing')
                    ? 'text-brand-400'
                    : 'text-red-400'
            }`}>
              {importStatus}
            </p>
          )}
        </div>

        {/* Account */}
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-card)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-medium text-[var(--text-primary)]">Account</h3>
              <p className="text-[13px] text-[var(--text-tertiary)]">{user?.email ?? 'Not signed in'}</p>
            </div>
            <button
              onClick={signOut}
              className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[13px] text-red-400 hover:bg-red-500/20"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
