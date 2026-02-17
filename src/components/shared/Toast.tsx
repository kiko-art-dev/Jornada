import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useToastStore, type Toast } from '../../stores/toastStore'

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      removeToast(toast.id)
    }, toast.duration)
    return () => clearTimeout(timerRef.current)
  }, [toast.id, toast.duration, removeToast])

  const iconMap = {
    success: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
    ),
    info: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
    ),
    warning: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
    ),
    undo: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>
    ),
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-auto flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--color-surface-card)] px-4 py-3 shadow-lg shadow-black/10"
    >
      <span className="flex-shrink-0">{iconMap[toast.type]}</span>
      <span className="flex-1 text-sm text-[var(--text-secondary)]">{toast.message}</span>

      {toast.type === 'undo' && toast.onUndo && (
        <button
          onClick={() => {
            toast.onUndo?.()
            removeToast(toast.id)
          }}
          className="flex-shrink-0 rounded px-2 py-0.5 text-xs font-medium text-brand-400 hover:bg-brand-500/10"
        >
          Undo
        </button>
      )}

      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
      </button>

      {/* Countdown bar for undo toasts */}
      {toast.type === 'undo' && (
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-brand-500 rounded-b-lg"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  )
}
