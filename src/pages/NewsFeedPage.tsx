import { useEffect, useRef } from 'react'
import { Link, Outlet, useSearchParams } from 'react-router'
import { EmptyState, ErrorState, LoadingState, Spinner } from '../components/States'
import { NewsBadges } from '../features/news/NewsBadges'
import {
  NEWS_PRIORITY_LABELS,
  NEWS_STATUS_LABELS,
  NEWS_TYPE_LABELS,
  parseNewsFilters,
  serializeNewsFilters,
} from '../features/news/newsParams'
import { useNewsFeed } from '../hooks/useNewsFeed'
import { formatDate } from '../lib/format'
import type { NewsFilters, NewsItem } from '../types'

export interface NewsOutletContext {
  applyUpdate: (news: NewsItem) => void
}

export default function NewsFeedPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = parseNewsFilters(searchParams)
  const key = serializeNewsFilters(filters)
  const feed = useNewsFeed(key)

  function changeFilter(patch: Partial<NewsFilters>) {
    setSearchParams(serializeNewsFilters({ ...filters, ...patch }))
    window.scrollTo(0, 0)
  }

  // Infinite scroll: cuando el centinela del final entra en pantalla, se pide la siguiente página.
  // El observer se recrea tras cada carga; si el centinela sigue visible (página corta), dispara de nuevo.
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef(feed.loadMore)
  useEffect(() => {
    loadMoreRef.current = feed.loadMore
  })
  const canAutoLoad = feed.loaded && feed.hasMore && !feed.error
  const itemCount = feed.items.length
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !canAutoLoad) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMoreRef.current()
      },
      { rootMargin: '400px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [canAutoLoad, itemCount, key])

  const locked = feed.error?.code === 'LOG_POSE_REQUIRED'
  const context: NewsOutletContext = { applyUpdate: feed.applyUpdate }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Noticias del mundo</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FilterSelect
          id="news-type"
          label="Tipo"
          value={filters.type}
          options={NEWS_TYPE_LABELS}
          onChange={(type) => changeFilter({ type })}
        />
        <FilterSelect
          id="news-priority"
          label="Prioridad"
          value={filters.priority}
          options={NEWS_PRIORITY_LABELS}
          onChange={(priority) => changeFilter({ priority })}
        />
        <FilterSelect
          id="news-status"
          label="Estado"
          value={filters.status}
          options={NEWS_STATUS_LABELS}
          onChange={(status) => changeFilter({ status })}
        />
      </div>

      {locked && feed.items.length === 0 ? (
        <div role="alert" className="rounded-xl border border-amber-800 bg-amber-950/30 p-6 text-center">
          <p className="font-semibold text-amber-300">Grand Line bloqueado</p>
          <p className="mt-1 text-sm text-slate-300">{feed.error?.message}</p>
          <button
            type="button"
            onClick={feed.retry}
            className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Volver a comprobar
          </button>
        </div>
      ) : !feed.loaded && feed.error ? (
        <ErrorState error={feed.error} onRetry={feed.retry} />
      ) : !feed.loaded ? (
        <LoadingState label="Cargando noticias…" />
      ) : feed.items.length === 0 && !feed.hasMore ? (
        <EmptyState title="No hay noticias con estos filtros." />
      ) : (
        <ul className="space-y-3">
          {feed.items.map((news) => (
            <li key={news.id}>
              <Link
                to={{ pathname: `/news/${encodeURIComponent(news.id)}`, search: key }}
                state={{ fromFeed: true }}
                className="block rounded-xl border border-slate-800 bg-slate-900 p-4 hover:border-slate-600 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              >
                <NewsBadges news={news} />
                <p className="mt-2 font-semibold">{news.title}</p>
                <p className="mt-1 text-sm text-slate-400">{news.summary}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {news.source} · {news.island} · {formatDate(news.publishedAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {feed.loaded && (
        <div className="min-h-16">
          {feed.error ? (
            <div role="alert" className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <span className="text-red-300">No se pudieron cargar más noticias: {feed.error.message}</span>
              <button
                type="button"
                onClick={feed.retry}
                className="rounded-lg bg-red-700 px-3 py-1.5 font-semibold text-white hover:bg-red-600"
              >
                Reintentar
              </button>
            </div>
          ) : feed.hasMore ? (
            <div role="status" className="flex items-center justify-center gap-3 py-4 text-sm text-slate-400">
              {feed.loading && (
                <>
                  <Spinner />
                  <span>Cargando más noticias…</span>
                </>
              )}
            </div>
          ) : (
            feed.items.length > 0 && (
              <p className="py-4 text-center text-sm text-slate-500">No hay más noticias. Llegaste al final del feed.</p>
            )
          )}
        </div>
      )}
      <div ref={sentinelRef} aria-hidden="true" />

      <Outlet context={context} />
    </div>
  )
}

function FilterSelect<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: T | ''
  options: Record<T, string>
  onChange: (value: T | '') => void
}) {
  const entries = Object.entries(options) as [T, string][]
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-slate-400">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(entries.find(([k]) => k === e.target.value)?.[0] ?? '')}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:ring-2 focus:ring-amber-400 focus:outline-none"
      >
        <option value="">Todos</option>
        {entries.map(([k, text]) => (
          <option key={k} value={k}>
            {text}
          </option>
        ))}
      </select>
    </div>
  )
}
