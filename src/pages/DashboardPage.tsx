import type { ReactNode } from 'react'
import { EmptyState, ErrorState, LoadingState } from '../components/States'
import { useApi } from '../hooks/useApi'
import { formatBerries, formatDate, formatNumber } from '../lib/format'
import type { DashboardSummary, FruitType, LogPose, WantedStatus } from '../types'

const STATUS_LABELS: Record<WantedStatus, string> = {
  AT_LARGE: 'Prófugos',
  CAPTURED: 'Capturados',
  MISSING: 'Desaparecidos',
}

const FRUIT_LABELS: Record<FruitType | 'NONE', string> = {
  PARAMECIA: 'Paramecia',
  ZOAN: 'Zoan',
  LOGIA: 'Logia',
  NONE: 'Sin fruta',
}

export default function DashboardPage() {
  const summary = useApi<DashboardSummary>('/dashboard/summary')
  const logPose = useApi<LogPose>('/log-pose')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <section aria-labelledby="logpose-title">
        <h2 id="logpose-title" className="mb-3 text-lg font-semibold">
          Log Pose
        </h2>
        {logPose.state.status === 'loading' && <LoadingState label="Consultando el Log Pose…" />}
        {logPose.state.status === 'error' && <ErrorState error={logPose.state.error} onRetry={logPose.retry} />}
        {logPose.state.status === 'success' && <LogPoseCard logPose={logPose.state.data} onRefresh={logPose.retry} />}
      </section>

      <section aria-labelledby="summary-title">
        <h2 id="summary-title" className="mb-3 text-lg font-semibold">
          Indicadores de la tripulación
        </h2>
        {summary.state.status === 'loading' && <LoadingState label="Cargando indicadores…" />}
        {summary.state.status === 'error' && <ErrorState error={summary.state.error} onRetry={summary.retry} />}
        {summary.state.status === 'success' && <SummaryView summary={summary.state.data} />}
      </section>
    </div>
  )
}

function LogPoseCard({ logPose, onRefresh }: { logPose: LogPose; onRefresh: () => void }) {
  const unlocked = logPose.status === 'UNLOCKED'
  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-4 rounded-xl border p-5 ${
        unlocked ? 'border-emerald-800 bg-emerald-950/40' : 'border-amber-800 bg-amber-950/30'
      }`}
    >
      <div>
        <p className={`font-semibold ${unlocked ? 'text-emerald-300' : 'text-amber-300'}`}>
          {unlocked ? 'Grand Line desbloqueado' : 'Grand Line bloqueado'}
        </p>
        <p className="mt-1 text-sm text-slate-300">{logPose.message}</p>
        {logPose.unlockedAt && (
          <p className="mt-1 text-xs text-slate-400">Aprobado el {formatDate(logPose.unlockedAt)}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onRefresh}
        className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
      >
        Actualizar
      </button>
    </div>
  )
}

function SummaryView({ summary }: { summary: DashboardSummary }) {
  const { wanted, crews, topBounties } = summary

  if (wanted.total === 0) {
    return (
      <EmptyState title="Todavía no hay carteles en su workspace.">
        Cuando la Guild publique carteles de "Se Busca", los indicadores aparecerán aquí.
      </EmptyState>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Carteles" value={formatNumber(wanted.total)} />
        <Stat label="Recompensa total" value={formatBerries(wanted.totalBounty)} />
        <Stat label="Recompensa promedio" value={formatBerries(wanted.averageBounty)} />
        <Stat label="Tripulaciones" value={formatNumber(crews.total)} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel title="Carteles por estado">
          <Breakdown
            total={wanted.total}
            rows={(Object.keys(STATUS_LABELS) as WantedStatus[]).map((s) => [STATUS_LABELS[s], wanted.byStatus[s]])}
          />
        </Panel>
        <Panel title="Carteles por fruta del diablo">
          <Breakdown
            total={wanted.total}
            rows={(Object.keys(FRUIT_LABELS) as (FruitType | 'NONE')[]).map((f) => [FRUIT_LABELS[f], wanted.byFruit[f]])}
          />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Panel title="Tripulación más buscada">
          {crews.mostWanted ? (
            <div className="space-y-1">
              <p className="flex items-center gap-2 font-semibold">
                <span
                  aria-hidden="true"
                  className="inline-block size-3 rounded-full"
                  style={{ backgroundColor: crews.mostWanted.jollyRogerColor }}
                />
                {crews.mostWanted.name}
              </p>
              <p className="text-sm text-slate-400">Barco: {crews.mostWanted.shipName}</p>
              <p className="text-sm text-slate-400">Carteles: {formatNumber(crews.mostWanted.memberCount)}</p>
              <p className="text-sm text-amber-300">{formatBerries(crews.mostWanted.totalBounty)}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Sin datos.</p>
          )}
        </Panel>

        <Panel title="Mayores recompensas" className="md:col-span-2">
          <ol className="divide-y divide-slate-800">
            {topBounties.map((w, i) => (
              <li key={w.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {i + 1}. {w.name} <span className="text-slate-400">"{w.epithet}"</span>
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {w.crew.name} · {STATUS_LABELS[w.status]}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-amber-300">{formatBerries(w.bounty)}</span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <p className="text-xs text-slate-500">Actualizado: {formatDate(summary.generatedAt)}</p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs text-slate-400 uppercase">{label}</p>
      <p className="mt-1 text-xl font-bold break-words">{value}</p>
    </div>
  )
}

function Panel({ title, className = '', children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900 p-4 ${className}`}>
      <h3 className="mb-3 text-sm font-semibold text-slate-300">{title}</h3>
      {children}
    </div>
  )
}

function Breakdown({ total, rows }: { total: number; rows: [string, number][] }) {
  return (
    <ul className="space-y-2">
      {rows.map(([label, count]) => (
        <li key={label}>
          <div className="flex justify-between text-sm">
            <span>{label}</span>
            <span className="text-slate-400">{formatNumber(count)}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-slate-800">
            <div className="h-2 rounded-full bg-amber-500" style={{ width: `${(count / total) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
