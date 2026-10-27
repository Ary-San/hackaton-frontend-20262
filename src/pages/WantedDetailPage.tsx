import { useEffect } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { fetchWantedById } from '../api/wanted'
import { ErrorState, LoadingState } from '../components/States'
import { FRUIT_TYPE_LABELS, WANTED_STATUS_LABELS } from '../features/wanted/wantedLabels'
import { WantedCard } from '../features/wanted/WantedCard'
import { useLatestRequest } from '../hooks/useLatestRequest'
import { formatBerries, formatDate } from '../lib/format'
import NotFoundPage from './NotFoundPage'

export default function WantedDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const cameFromList = typeof (location.state as { from?: unknown } | null)?.from === 'string'
  const wanted = useLatestRequest(`wanted:${id}`, (signal) => fetchWantedById(id, signal))

  // Con BrowserRouter el scroll no se reinicia solo: el detalle empieza arriba.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  /**
   * Volver: si venimos del listado usamos navigate(-1). Regresa a la MISMA entrada del historial,
   * con la misma URL (filtros, página, orden), y el listado restaura su scroll.
   * Si el detalle se abrió directo (link compartido), vamos a /wanted.
   */
  function goBack() {
    if (cameFromList) navigate(-1)
    else navigate('/wanted')
  }

  if (wanted.error?.status === 404) return <NotFoundPage />

  const data = wanted.isStale ? null : wanted.data

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={goBack}
        className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
      >
        ← Volver a los carteles
      </button>

      {wanted.error && <ErrorState error={wanted.error} onRetry={wanted.retry} />}
      {!wanted.error && data === null && <LoadingState label="Desenrollando el cartel…" />}
      {!wanted.error && data !== null && (
        <div className="grid gap-8 md:grid-cols-[minmax(0,300px)_1fr]">
          <WantedCard wanted={data} />
          <div>
            <h1 className="text-3xl font-bold text-amber-400">{data.name}</h1>
            <p className="mt-1 text-lg text-slate-300 italic">"{data.epithet}"</p>
            <p className="mt-4 font-mono text-2xl font-bold">{formatBerries(data.bounty)}</p>
            <dl className="mt-6 grid gap-x-8 sm:grid-cols-2">
              <Row label="Estado" value={WANTED_STATUS_LABELS[data.status]} />
              <Row label="Tripulación" value={data.crew.name} />
              <Row label="Rol" value={data.role} />
              <Row label="Fruta del diablo" value={data.devilFruit ? `${data.devilFruit.name} (${FRUIT_TYPE_LABELS[data.devilFruit.type]})` : 'Ninguna'} />
              <Row label="Nivel de amenaza" value={String(data.threatLevel)} />
              <Row label="Última isla vista" value={data.lastSeenIsland} />
              <Row label="Actualizado" value={formatDate(data.updatedAt)} />
            </dl>
            {!cameFromList && (
              <Link to="/wanted" className="mt-6 inline-block text-sm text-amber-400 underline">
                Ver todos los carteles
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-800 py-2">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}
