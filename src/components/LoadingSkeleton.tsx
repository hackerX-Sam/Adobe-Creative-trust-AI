import type { ReactNode } from 'react'

export function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-md ${className}`}
      style={{
        background:
          'linear-gradient(90deg, var(--skel-a) 25%, var(--skel-b) 40%, var(--skel-a) 55%)',
        backgroundSize: '400% 100%',
      }}
    />
  )
}

export function LoadingSkeleton({ children }: { children: ReactNode }) {
  return <div>{children}</div>
}

/** Full-page skeleton used while a route "loads". */
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Shimmer className="h-7 w-64" />
        <Shimmer className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5">
            <Shimmer className="h-3.5 w-32" />
            <Shimmer className="mt-4 h-8 w-24" />
            <Shimmer className="mt-4 h-9 w-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="card h-80 p-5 xl:col-span-2">
          <Shimmer className="h-4 w-48" />
          <Shimmer className="mt-6 h-56 w-full" />
        </div>
        <div className="card h-80 p-5">
          <Shimmer className="h-4 w-40" />
          <Shimmer className="mt-6 h-56 w-full" />
        </div>
      </div>
    </div>
  )
}
