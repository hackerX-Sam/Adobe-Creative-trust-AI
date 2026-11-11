import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CheckCircle2, Info, TriangleAlert, XCircle, X } from 'lucide-react'

export type ToastKind = 'success' | 'info' | 'warning' | 'error'

interface Toast {
  id: number
  kind: ToastKind
  title: string
  message?: string
}

interface ToastApi {
  toast: (_kind: ToastKind, _title: string, _message?: string) => void
}

const ToastCtx = createContext<ToastApi>({ toast: () => {} })

export const useToast = () => useContext(ToastCtx)

const ICONS: Record<ToastKind, ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-success shrink-0" />,
  info: <Info className="h-4 w-4 text-[#6FB2F5] shrink-0" />,
  warning: <TriangleAlert className="h-4 w-4 text-warning shrink-0" />,
  error: <XCircle className="h-4 w-4 text-danger shrink-0" />,
}

const BAR: Record<ToastKind, string> = {
  success: 'bg-success',
  info: 'bg-[#6FB2F5]',
  warning: 'bg-warning',
  error: 'bg-danger',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    (kind: ToastKind, title: string, message?: string) => {
      const id = nextId.current++
      setToasts((t) => [...t.slice(-3), { id, kind, title, message }])
      const timer = setTimeout(() => dismiss(id), 4200)
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[70] flex w-[340px] max-w-[calc(100vw-2.5rem)] flex-col gap-2.5">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-popIn relative overflow-hidden rounded-lg border border-line bg-elevated shadow-pop"
            role="status"
          >
            <div className={`absolute left-0 top-0 h-full w-[3px] ${BAR[t.kind]}`} />
            <div className="flex items-start gap-3 p-3.5 pl-4">
              <div className="mt-0.5">{ICONS[t.kind]}</div>
              <div className="min-w-0 flex-1">
                <p className="text-body font-semibold text-ink">{t.title}</p>
                {t.message && <p className="mt-0.5 text-tiny text-ink2">{t.message}</p>}
              </div>
              <button
                className="rounded-md p-1 text-ink3 transition-colors hover:bg-base hover:text-ink"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
