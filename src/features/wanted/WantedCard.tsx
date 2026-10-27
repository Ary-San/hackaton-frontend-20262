import { formatBerries } from '../../lib/format'
import type { WantedSummary } from '../../types'
import { FRUIT_TYPE_LABELS, WANTED_STATUS_LABELS } from './wantedLabels'

const STATUS_STYLES: Record<WantedSummary['status'], string> = {
  AT_LARGE: 'bg-red-800 text-white',
  CAPTURED: 'bg-emerald-800 text-white',
  MISSING: 'bg-slate-700 text-white',
}

/** Cartel de "Se Busca" con diseño propio (sin imágenes ni logos oficiales). */
export function WantedCard({ wanted }: { wanted: WantedSummary }) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-amber-900/40 bg-amber-50 p-4 text-slate-900 shadow-md transition-transform group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
      <p className="text-center font-serif text-xl font-black tracking-[0.3em] text-amber-900">WANTED</p>
      <h2 className="mt-3 line-clamp-1 text-center text-lg font-bold">{wanted.name}</h2>
      <p className="line-clamp-1 min-h-5 text-center text-sm text-amber-900 italic">"{wanted.epithet}"</p>
      <p className="mt-3 text-center font-mono text-lg font-bold">{formatBerries(wanted.bounty)}</p>
      <p className="mt-1 line-clamp-1 text-center text-xs text-slate-600">{wanted.crew.name}</p>
      <div className="mt-auto flex flex-wrap justify-center gap-1 pt-3 text-[11px] font-semibold uppercase">
        <span className={`rounded px-2 py-0.5 ${STATUS_STYLES[wanted.status]}`}>{WANTED_STATUS_LABELS[wanted.status]}</span>
        <span className="rounded bg-amber-900 px-2 py-0.5 text-amber-50">
          {wanted.devilFruit ? FRUIT_TYPE_LABELS[wanted.devilFruit.type] : 'Sin fruta'}
        </span>
      </div>
    </article>
  )
}
