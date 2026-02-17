import { useCallback, useRef, useState } from 'react'
import { useTaskStore } from '../../stores/taskStore'

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

interface Props {
  taskId: string
}

export function AttachmentUpload({ taskId }: Props) {
  const uploadAttachment = useTaskStore((s) => s.uploadAttachment)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateAndUpload = useCallback(async (file: File) => {
    setError(null)
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Only PNG, JPEG, GIF, and WebP images are allowed.')
      return
    }
    if (file.size > MAX_SIZE) {
      setError('File must be under 5MB.')
      return
    }
    await uploadAttachment(taskId, file)
  }, [taskId, uploadAttachment])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) validateAndUpload(file)
  }, [validateAndUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) validateAndUpload(file)
    if (inputRef.current) inputRef.current.value = ''
  }, [validateAndUpload])

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border border-dashed px-4 py-4 text-center text-[13px] transition-colors ${
          dragging
            ? 'border-brand-500 bg-brand-500/10 text-brand-300'
            : 'border-[var(--border-default)] text-[var(--text-tertiary)] hover:border-[var(--border-strong)] hover:text-[var(--text-muted)]'
        }`}
      >
        Drop image here or click to upload
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}
