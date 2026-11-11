import type { LucideIcon } from 'lucide-react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-elevated">
        <Icon className="h-5 w-5 text-ink3" />
      </div>
      <p className="mt-4 text-body font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-tiny leading-relaxed text-ink2">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({
  title = 'Analysis could not complete',
  description = 'The service returned an unexpected response. Please retry — if the problem persists, contact your workspace administrator.',
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-danger/30 bg-danger/10">
        <span className="text-lg text-danger">!</span>
      </div>
      <p className="mt-3.5 text-body font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-md text-tiny leading-relaxed text-ink2">{description}</p>
      {onRetry && (
        <button className="btn-secondary btn-sm mt-5" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  )
}
