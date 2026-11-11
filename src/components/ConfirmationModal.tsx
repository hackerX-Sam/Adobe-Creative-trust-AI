import { useEffect } from 'react'
import { TriangleAlert } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  tone?: 'danger' | 'accent'
  children?: React.ReactNode
}

export default function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'danger',
  children,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fadeIn bg-black/70 backdrop-blur-[2px]" onClick={onClose} />
      <div className="animate-popIn relative w-full max-w-sm rounded-xl border border-line bg-elevated p-5 shadow-pop">
        <div className="flex items-start gap-3.5">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              tone === 'danger' ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent'
            }`}
          >
            <TriangleAlert className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-body font-semibold text-ink">{title}</h3>
            <p className="mt-1.5 text-tiny leading-relaxed text-ink2">{description}</p>
          </div>
        </div>
        {children && <div className="mt-1">{children}</div>}
        <div className="mt-5 flex justify-end gap-2.5">
          <button className="btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`btn-sm btn ${tone === 'danger' ? 'bg-danger text-white hover:bg-[#FF6565]' : 'bg-accent text-white hover:bg-[#FF4D45]'}`}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
