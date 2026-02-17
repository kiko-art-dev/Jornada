import { useState, useRef } from 'react'
import { useUIStore } from '../stores/uiStore'
import { useAuth } from '../hooks/useAuth'
import { exportJSON, exportCSV, importJSON } from '../lib/export'

const btnClass = 'rounded-md border border-[var(--border-subtle)] bg-[var(--color-surface-card)] px-3 py-1.5 text-[13px] text-[var(--text-secondary)] hover:border-[var(--border-default)] hover:bg-[var(--color-surface-hover)] disabled:opacity-50'

export function SettingsPage() {
  const { theme, toggleTheme } = useUIStore()
  const { user, signOut } = useAuth()
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExportJSON = async () => {
    setExporting(true)
    try { await exportJSON() } finally { setExporting(false) }
  }

  const handleExportCSV = async () => {
    setExporting(true)
    try { await exportCSV() } finally { setExporting(false) }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportStatus('Importing...')
    const result = await importJSON(file)
    if (result === 'ok') {
      setImportStatus('Import successful! Reloading...')
      setTimeout(() => window.location.reload(), 1500)
    } else {
      setImportStatus(result)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
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
          <p className="mb-3 text-[13px] text-[var(--text-tertiary)]">Export or import your JORNADA data.</p>
          <div className="flex gap-2">
            <button onClick={handleExportJSON} disabled={exporting} className={btnClass}>
              Export JSON
            </button>
            <button onClick={handleExportCSV} disabled={exporting} className={btnClass}>
              Export CSV
            </button>
            <button onClick={() => fileInputRef.current?.click()} className={btnClass}>
              Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
          {importStatus && (
            <p className={`mt-2 text-[13px] ${importStatus.includes('successful') ? 'text-green-400' : importStatus === 'Importing...' ? 'text-[var(--text-muted)]' : 'text-red-400'}`}>
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
