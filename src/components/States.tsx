import type { ReactNode } from 'react'
import type { ApiError } from '../api/client'

export function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent motion-reduce:animate-none"
    />
  )
}

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-10 text-slate-300">
      <Spinner />
      <span>{label}</span>
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: ApiError; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-red-900 bg-red-950/40 p-5 text-center">
      <p className="font-medium text-red-200">{error.message}</p>
      {error.retryAfterSeconds !== undefined && (
        <p className="mt-1 text-sm text-red-300">Espera {error.retryAfterSeconds} s antes de reintentar.</p>
      )}
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
      >
        Reintentar
      </button>
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">
      <p className="font-semibold text-slate-200">{title}</p>
      {children && <div className="mt-2 text-sm text-slate-400">{children}</div>}
    </div>
  )
}
