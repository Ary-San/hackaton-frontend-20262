import type { FruitType, PageSize, WantedQuery, WantedSort, WantedStatus } from '../../types'
import { FRUIT_TYPES, PAGE_SIZES, WANTED_SORTS, WANTED_STATUSES } from './wantedLabels'

/**
 * La URL es la ÚNICA fuente de verdad del listado /wanted.
 *
 * - parseWantedParams: URL → WantedQuery validado. Cada valor inválido se reemplaza por su
 *   valor por defecto, así una URL manipulada (page=-5, size=7, status=XYZ…) nunca rompe la vista.
 * - serializeWantedParams: WantedQuery → query string CANÓNICO (orden fijo, sin valores por defecto).
 *   Ese string se usa también como "key" de la request.
 */

export const WANTED_DEFAULTS: WantedQuery = {
  page: 0,
  size: 20,
  sort: 'bounty,desc',
  status: '',
  crewId: '',
  fruit: '',
  q: '',
}

const MAX_PAGE = 100_000
const MAX_QUERY_LENGTH = 80

function isOneOf<T extends string | number>(value: unknown, allowed: readonly T[]): value is T {
  return allowed.includes(value as T)
}

export function parseWantedParams(params: URLSearchParams): WantedQuery {
  const rawPage = params.get('page') ?? ''
  const page = /^\d+$/.test(rawPage) ? Math.min(Number(rawPage), MAX_PAGE) : WANTED_DEFAULTS.page

  const rawSize = Number(params.get('size'))
  const size: PageSize = isOneOf(rawSize, PAGE_SIZES) ? rawSize : WANTED_DEFAULTS.size

  const rawSort = params.get('sort')
  const sort: WantedSort = isOneOf(rawSort, WANTED_SORTS) ? rawSort : WANTED_DEFAULTS.sort

  const rawStatus = params.get('status')
  const status: WantedStatus | '' = isOneOf(rawStatus, WANTED_STATUSES) ? rawStatus : ''

  const rawFruit = params.get('fruit')
  const fruit: FruitType | '' = isOneOf(rawFruit, FRUIT_TYPES) ? rawFruit : ''

  const rawCrew = params.get('crewId') ?? ''
  const crewId = /^[\w-]{1,64}$/.test(rawCrew) ? rawCrew : ''

  const q = (params.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH)

  return { page, size, sort, status, crewId, fruit, q }
}

const ORDER: readonly (keyof WantedQuery)[] = ['q', 'status', 'crewId', 'fruit', 'sort', 'size', 'page']

export function serializeWantedParams(query: WantedQuery): string {
  const params = new URLSearchParams()
  for (const key of ORDER) {
    const value = query[key]
    if (value !== '' && value !== WANTED_DEFAULTS[key]) params.set(key, String(value))
  }
  return params.toString()
}

/** Query string para el backend: igual que el de la URL pero SIEMPRE con page, size y sort explícitos. */
export function toApiQuery(query: WantedQuery): string {
  const params = new URLSearchParams()
  params.set('page', String(query.page))
  params.set('size', String(query.size))
  params.set('sort', query.sort)
  if (query.status) params.set('status', query.status)
  if (query.crewId) params.set('crewId', query.crewId)
  if (query.fruit) params.set('fruit', query.fruit)
  if (query.q) params.set('q', query.q)
  return params.toString()
}

export function hasActiveFilters(query: WantedQuery): boolean {
  return query.q !== '' || query.status !== '' || query.crewId !== '' || query.fruit !== ''
}
