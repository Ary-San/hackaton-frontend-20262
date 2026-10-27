import type { NewsFilters, NewsItem, NewsPriority, NewsStatus, NewsType } from '../../types'

export const NEWS_TYPE_LABELS: Record<NewsType, string> = {
  BOUNTY_UPDATE: 'Recompensas',
  BATTLE: 'Batallas',
  MARINE_OPERATION: 'Operación de la Marina',
  WORLD_GOVERNMENT: 'Gobierno Mundial',
  DISCOVERY: 'Descubrimientos',
}

export const NEWS_PRIORITY_LABELS: Record<NewsPriority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

export const NEWS_STATUS_LABELS: Record<NewsStatus, string> = {
  RUMOR: 'Rumor',
  CONFIRMED: 'Confirmada',
  DEBUNKED: 'Desmentida',
}

const NEWS_TYPES = Object.keys(NEWS_TYPE_LABELS) as NewsType[]
const NEWS_PRIORITIES = Object.keys(NEWS_PRIORITY_LABELS) as NewsPriority[]
const NEWS_STATUSES = Object.keys(NEWS_STATUS_LABELS) as NewsStatus[]

function pick<T extends string>(value: string | null, allowed: readonly T[]): T | '' {
  return allowed.find((a) => a === value) ?? ''
}

/** URL → filtros válidos. Un valor desconocido se ignora en vez de romper la vista. */
export function parseNewsFilters(params: URLSearchParams): NewsFilters {
  return {
    type: pick(params.get('type'), NEWS_TYPES),
    priority: pick(params.get('priority'), NEWS_PRIORITIES),
    status: pick(params.get('status'), NEWS_STATUSES),
  }
}

/** Filtros → query string canónico (orden fijo, sin vacíos). Sirve también como "key" del feed. */
export function serializeNewsFilters(filters: NewsFilters): string {
  const params = new URLSearchParams()
  if (filters.type) params.set('type', filters.type)
  if (filters.priority) params.set('priority', filters.priority)
  if (filters.status) params.set('status', filters.status)
  return params.toString()
}

export function matchesFilters(item: NewsItem, filters: NewsFilters): boolean {
  return (
    (!filters.type || item.type === filters.type) &&
    (!filters.priority || item.priority === filters.priority) &&
    (!filters.status || item.status === filters.status)
  )
}
