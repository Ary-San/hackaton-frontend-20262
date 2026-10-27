import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router'
import { toApiError, type ApiError } from '../api/client'
import { fetchNewsById, verifyNews } from '../api/news'
import { ErrorState, LoadingState } from '../components/States'
import { NewsBadges } from '../features/news/NewsBadges'
import { NEWS_STATUS_LABELS } from '../features/news/newsParams'
import { useLatestRequest } from '../hooks/useLatestRequest'
import { formatDate } from '../lib/format'
import type { NewsDetail } from '../types'
import type { NewsOutletContext } from './NewsFeedPage'

type Verdict = 'CONFIRMED' | 'DEBUNKED'

export default function NewsDetailModal() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { applyUpdate } = useOutletContext<NewsOutletContext>()
  const news = useLatestRequest(`news:${id}`, (signal) => fetchNewsById(id, signal))

  const [updated, setUpdated] = useState<NewsDetail | null>(null)
  const [pending, setPending] = useState<Verdict | null>(null)
  const [verifyError, setVerifyError] = useState<{ verdict: Verdict; error: ApiError } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const fromFeed = (location.state as { fromFeed?: unknown } | null)?.fromFeed === true

  // Cerrar: si venimos del feed, "atrás" vuelve a la misma entrada con el feed intacto debajo.
  function close() {
    if (fromFeed) navigate(-1)
    else navigate({ pathname: '/news', search: location.search })
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  })

  const fetched = news.isStale ? null : news.data
  const detail = updated?.id === id ? updated : fetched

  async function verify(verdict: Verdict) {
    if (!detail || pending) return
    setPending(verdict)
    setVerifyError(null)
    setNotice(null)
    try {
      const result = await verifyNews(detail.id, verdict)
      setUpdated(result)
      applyUpdate(result)
      setNotice(`Listo: la noticia quedó como ${NEWS_STATUS_LABELS[result.status].toLowerCase()}.`)
    } catch (err) {
      const error = toApiError(err)
      // 409: otro miembro ya la verificó con el otro estado. El servidor manda el estado real en `current`.
      if (error.code === 'NEWS_ALREADY_VERIFIED' && error.current) {
        setUpdated(error.current)
        applyUpdate(error.current)
      }
      setVerifyError({ verdict, error })
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-6" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="news-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-slate-800 bg-slate-900 p-6 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            autoFocus
            onClick={close}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>

        {news.error?.status === 404 ? (
          <p id="news-title" className="text-center text-slate-300">Esta noticia no existe en su workspace.</p>
        ) : news.error && !detail ? (
          <ErrorState error={news.error} onRetry={news.retry} />
        ) : !detail ? (
          <LoadingState label="Cargando noticia…" />
        ) : (
          <article className="space-y-4">
            <NewsBadges news={detail} />
            <h2 id="news-title" className="text-xl font-bold">
              {detail.title}
            </h2>
            <p className="text-xs text-slate-500">
              {detail.source} · {detail.island} · {formatDate(detail.publishedAt)}
              {detail.verifiedAt && ` · Verificada el ${formatDate(detail.verifiedAt)}`}
            </p>
            {detail.body.map((paragraph, i) => (
              <p key={i} className="text-slate-300">
                {paragraph}
              </p>
            ))}
            {detail.relatedWanted && (
              <p className="text-sm">
                Cartel relacionado:{' '}
                <Link to={`/wanted/${encodeURIComponent(detail.relatedWanted.id)}`} className="text-amber-400 hover:underline">
                  {detail.relatedWanted.name}
                </Link>
              </p>
            )}

            <section aria-label="Verificar noticia" className="space-y-3 border-t border-slate-800 pt-4">
              {detail.status === 'RUMOR' ? (
                <>
                  <p className="text-sm text-slate-400">¿Qué sabe la Guild de este rumor?</p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={pending !== null}
                      onClick={() => void verify('CONFIRMED')}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {pending === 'CONFIRMED' ? 'Confirmando…' : 'Confirmar'}
                    </button>
                    <button
                      type="button"
                      disabled={pending !== null}
                      onClick={() => void verify('DEBUNKED')}
                      className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {pending === 'DEBUNKED' ? 'Desmintiendo…' : 'Desmentir'}
                    </button>
                  </div>
                </>
              ) : (
                !notice && (
                  <p className="text-sm text-slate-400">
                    Esta noticia ya está {NEWS_STATUS_LABELS[detail.status].toLowerCase()}.
                  </p>
                )
              )}

              {notice && (
                <p role="status" className="rounded-lg bg-emerald-950/60 p-3 text-sm text-emerald-200">
                  {notice}
                </p>
              )}

              {verifyError && (
                <div role="alert" className="rounded-lg bg-red-950/60 p-3 text-sm text-red-200">
                  <p>No se pudo verificar: {verifyError.error.message}</p>
                  {verifyError.error.code === 'NEWS_ALREADY_VERIFIED' ? (
                    <p className="mt-1">Se muestra el estado actual que tiene el servidor.</p>
                  ) : (
                    <button
                      type="button"
                      disabled={pending !== null}
                      onClick={() => void verify(verifyError.verdict)}
                      className="mt-2 rounded-lg bg-red-700 px-3 py-1.5 font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                    >
                      Reintentar
                    </button>
                  )}
                </div>
              )}
            </section>
          </article>
        )}
      </div>
    </div>
  )
}
