import { toApiQuery } from '../features/wanted/wantedParams'
import type { Crew, Page, WantedQuery, WantedSummary } from '../types'
import { apiFetch } from './client'

/** GET /wanted — paginación REAL del servidor: solo pedimos la página que se muestra. */
export function fetchWanted(query: WantedQuery, signal?: AbortSignal): Promise<Page<WantedSummary>> {
  return apiFetch<Page<WantedSummary>>(`/wanted?${toApiQuery(query)}`, { signal })
}

/** GET /wanted/{id} */
export function fetchWantedById(id: string, signal?: AbortSignal): Promise<WantedSummary> {
  return apiFetch<WantedSummary>(`/wanted/${encodeURIComponent(id)}`, { signal })
}

/** GET /crews — para las opciones del filtro "Tripulación". Acepta arreglo directo o respuesta paginada. */
export async function fetchCrews(signal?: AbortSignal): Promise<Crew[]> {
  const data = await apiFetch<Crew[] | Page<Crew>>('/crews', { signal })
  return Array.isArray(data) ? data : data.content
}
