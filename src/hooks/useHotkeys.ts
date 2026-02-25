import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../stores/uiStore'

function isInputFocused(): boolean {
  const el = document.activeElement
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement ||
    (el as HTMLElement)?.isContentEditable === true
  )
}

export function useHotkeys() {
  const navigate = useNavigate()
  const { setCommandPaletteOpen, setQuickCaptureOpen, setViewMode, closeDrawer, drawerTaskId } = useUIStore()

  const pendingKey = useRef<string | null>(null)
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      if (isInputFocused()) return

      // Ctrl+N — open quick capture
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        setQuickCaptureOpen(true)
        return
      }

      // Don't intercept when modifiers are held (except for Ctrl+K handled elsewhere)
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const key = e.key.toLowerCase()

      // Handle second key of composable shortcuts
      if (pendingKey.current) {
        const combo = pendingKey.current + key
        pendingKey.current = null
        if (pendingTimer.current) clearTimeout(pendingTimer.current)

        switch (combo) {
          case 'gt':
            e.preventDefault()
            navigate('/')
            return
          case 'gi':
            e.preventDefault()
            navigate('/')
            return
          case 'vb':
            e.preventDefault()
            setViewMode('board')
            return
          case 'vl':
            e.preventDefault()
            setViewMode('list')
            return
          case 'vc':
            e.preventDefault()
            setViewMode('calendar')
            return
        }
        // No match for combo — fall through
      }

      // Composable shortcut starters
      if (key === 'g' || key === 'v') {
        pendingKey.current = key
        pendingTimer.current = setTimeout(() => {
          pendingKey.current = null
        }, 500)
        return
      }

      // Single-key shortcuts
      switch (key) {
        case 'escape':
          if (drawerTaskId) {
            closeDrawer()
          }
          break
        case '?':
          // Will be handled by help overlay component
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, setCommandPaletteOpen, setQuickCaptureOpen, setViewMode, closeDrawer, drawerTaskId])
}
