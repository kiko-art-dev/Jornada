import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { TaskDrawer } from '../task/TaskDrawer'
import { CommandPalette } from '../command-palette/CommandPalette'
import { QuickCapture } from '../quick-capture/QuickCapture'
import { ShortcutHelp } from '../shared/ShortcutHelp'
import { ToastContainer } from '../shared/Toast'
import { BulkActionBar } from '../shared/BulkActionBar'
import { useHotkeys } from '../../hooks/useHotkeys'

export function AppLayout() {
  useHotkeys()
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-base)] text-[var(--text-primary)]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <TaskDrawer />
      <CommandPalette />
      <QuickCapture />
      <ShortcutHelp />
      <ToastContainer />
      <BulkActionBar />
    </div>
  )
}
