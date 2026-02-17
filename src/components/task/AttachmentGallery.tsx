import { useState } from 'react'
import { useTaskStore } from '../../stores/taskStore'
import { Lightbox } from '../shared/Lightbox'
import type { TaskAttachment } from '../../types'

interface Props {
  attachments: TaskAttachment[]
}

export function AttachmentGallery({ attachments }: Props) {
  const deleteAttachment = useTaskStore((s) => s.deleteAttachment)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  if (attachments.length === 0) return null

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {attachments.map((att) => (
          <div key={att.id} className="group relative aspect-video overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--color-surface-raised)]">
            <img
              src={att.file_url}
              alt={att.file_name}
              className="h-full w-full cursor-pointer object-cover transition-transform hover:scale-105"
              onClick={() => setLightboxUrl(att.file_url)}
            />
            <button
              onClick={() => deleteAttachment(att.id, att.file_url)}
              className="absolute top-1 right-1 hidden rounded bg-black/60 p-0.5 text-[var(--text-muted)] hover:text-red-400 group-hover:block"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1">
              <span className="text-[11px] text-white truncate block">{att.file_name}</span>
            </div>
          </div>
        ))}
      </div>

      {lightboxUrl && (
        <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </>
  )
}
