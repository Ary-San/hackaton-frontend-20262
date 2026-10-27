import { useCallback, useEffect, useRef, useState } from 'react'
import { toApiError, type ApiError } from '../api/client'
import { fetchNewsFeed } from '../api/news'
import { matchesFilters, parseNewsFilters } from '../features/news/newsParams'
import type { NewsItem } from '../types'

interface FeedState {
  /** Filtros (query canónico) a los que pertenecen estos items. */
  key: string
  items: NewsItem[]
  nextCursor: string | null
  hasMore: boolean
  loaded: boolean
  error: ApiError | null
}

const CURSOR_ERRORS = ['INVALID_CURSOR', 'CURSOR_FILTER_MISMATCH']

const emptyFeed = (key: string): FeedState => ({
  key,
  items: [],
  nextCursor: null,
  hasMore: true,
  loaded: false,
  error: null,
})

export function useNewsFeed(key: string) {
  const [feed, setFeed] = useState<FeedState>(() => emptyFeed(key))
  const [loading, setLoading] = useState(false)
  // Una sola carga en vuelo: mientras exista este controller, nadie más pide.
  const inflight = useRef<AbortController | null>(null)

  const load = useCallback((feedKey: string, cursor: string | null) => {
    if (inflight.current) return
    const controller = new AbortController()
    inflight.current = controller
    setLoading(true)

    fetchNewsFeed(parseNewsFilters(new URLSearchParams(feedKey)), cursor, controller.signal)
      .then((page) => {
        if (controller.signal.aborted) return
        setFeed((prev) => {
          const base = prev.key === feedKey ? prev : emptyFeed(feedKey)
          // Regla de Nami: una noticia que ya tenemos no se agrega dos veces.
          const seen = new Set(base.items.map((item) => item.id))
          const fresh = page.items.filter((item) => !seen.has(item.id))
          return {
            key: feedKey,
            items: [...base.items, ...fresh],
            nextCursor: page.nextCursor,
            hasMore: page.hasMore && page.nextCursor !== null,
            loaded: true,
            error: null,
          }
        })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        // Si falla, se conservan las noticias ya cargadas; solo se marca el error.
        setFeed((prev) => ({ ...(prev.key === feedKey ? prev : emptyFeed(feedKey)), error: toApiError(err) }))
      })
      .finally(() => {
        if (inflight.current !== controller) return
        inflight.current = null
        setLoading(false)
      })
  }, [])

  // Filtros nuevos: se aborta lo que esté en vuelo y se empieza sin cursor.
  useEffect(() => {
    load(key, null)
    return () => {
      inflight.current?.abort()
      inflight.current = null
    }
  }, [key, load])

  // Mientras llega la primera página de unos filtros nuevos, lo de los filtros viejos no se muestra.
  const current = feed.key === key ? feed : emptyFeed(key)

  const loadMore = useCallback(() => {
    if (current.loaded && current.hasMore && !current.error) load(key, current.nextCursor)
  }, [current.loaded, current.hasMore, current.error, current.nextCursor, key, load])

  const retry = useCallback(() => {
    if (current.error && CURSOR_ERRORS.includes(current.error.code)) {
      setFeed(emptyFeed(key))
      load(key, null)
    } else {
      load(key, current.loaded ? current.nextCursor : null)
    }
  }, [current.error, current.loaded, current.nextCursor, key, load])

  /** Refleja en el feed una noticia que cambió en el detalle, sin volver a pedir el feed. */
  const applyUpdate = useCallback(
    (updated: NewsItem) => {
      const filters = parseNewsFilters(new URLSearchParams(key))
      setFeed((prev) => ({
        ...prev,
        items: prev.items.flatMap((item) =>
          item.id !== updated.id ? [item] : matchesFilters(updated, filters) ? [updated] : [],
        ),
      }))
    },
    [key],
  )

  return {
    items: current.items,
    loaded: current.loaded,
    hasMore: current.hasMore,
    error: current.error,
    loading: loading || (!current.loaded && !current.error),
    loadMore,
    retry,
    applyUpdate,
  }
}
