import { create } from 'zustand'

export type ToastType = 'success' | 'info' | 'warning' | 'undo'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration: number
  onUndo?: () => void
  createdAt: number
}

interface ToastState {
  toasts: Toast[]
  addToast: (message: string, opts?: { type?: ToastType; duration?: number; onUndo?: () => void }) => string
  removeToast: (id: string) => void
}

let toastCounter = 0

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (message, opts) => {
    const id = `toast-${++toastCounter}`
    const toast: Toast = {
      id,
      message,
      type: opts?.type ?? 'info',
      duration: opts?.duration ?? 3000,
      onUndo: opts?.onUndo,
      createdAt: Date.now(),
    }

    set((s) => {
      // Max 3 visible — remove oldest if needed
      const next = [...s.toasts, toast]
      return { toasts: next.length > 3 ? next.slice(-3) : next }
    })

    return id
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))
