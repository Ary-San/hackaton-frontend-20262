import type { ReactNode } from 'react'

export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <p className="text-xs font-semibold tracking-widest text-amber-400 uppercase">Log Pose Console</p>
        <h1 className="mt-1 mb-6 text-2xl font-bold">{title}</h1>
        {children}
      </div>
    </main>
  )
}
