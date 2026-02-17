import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const shortcuts = [
  { category: 'Global', items: [
    { keys: 'Ctrl+K', action: 'Command palette' },
    { keys: 'Q', action: 'Quick add task' },
    { keys: '?', action: 'Show this help' },
    { keys: 'Esc', action: 'Close panel / modal' },
  ]},
  { category: 'Navigation', items: [
    { keys: 'G then T', action: 'Go to Today' },
    { keys: 'G then I', action: 'Go to Inbox' },
  ]},
  { category: 'Views', items: [
    { keys: 'V then B', action: 'Board view' },
    { keys: 'V then L', action: 'List view' },
    { keys: 'V then C', action: 'Calendar view' },
  ]},
]

export function ShortcutHelp() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        e.key === '?' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLSelectElement)
      ) {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="popover fixed left-1/2 top-[15%] z-50 w-full max-w-md -translate-x-1/2 rounded-xl p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Keyboard Shortcuts</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--text-secondary)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <div className="space-y-4">
              {shortcuts.map((group) => (
                <div key={group.category}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    {group.category}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <div key={item.keys} className="flex items-center justify-between py-1">
                        <span className="text-sm text-[var(--text-secondary)]">{item.action}</span>
                        <kbd className="rounded bg-[var(--color-surface-hover)] px-2 py-0.5 text-xs font-mono text-[var(--text-muted)]">
                          {item.keys}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-center text-xs text-[var(--text-muted)]">
              Press ? to toggle {'\u00B7'} Esc to close
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
