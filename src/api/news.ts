import type { NewsDetail, NewsFeed, NewsFilters } from '../types'
import { apiFetch } from './client'

export const NEWS_PAGE_LIMIT = 20

/** GET /news/feed — el cursor queda ligado a los filtros, así que siempre viajan juntos. */
export function fetchNewsFeed(filters: NewsFilters, cursor: string | null, signal: AbortSignal): Promise<NewsFeed> {
  const params = new URLSearchParams({ limit: String(NEWS_PAGE_LIMIT) })
  if (filters.type) params.set('type', filters.type)
  if (filters.priority) params.set('priority', filters.priority)
  if (filters.status) params.set('status', filters.status)
  if (cursor) params.set('cursor', cursor)
  return apiFetch<NewsFeed>(`/news/feed?${params}`, { signal })
}

export function fetchNewsById(id: string, signal: AbortSignal): Promise<NewsDetail> {
  return apiFetch<NewsDetail>(`/news/${encodeURIComponent(id)}`, { signal })
}

export function verifyNews(id: string, status: 'CONFIRMED' | 'DEBUNKED'): Promise<NewsDetail> {
  return apiFetch<NewsDetail>(`/news/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } })
}
