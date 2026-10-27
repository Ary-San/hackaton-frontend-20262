import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigationType, useSearchParams } from 'react-router'
import { fetchCrews, fetchWanted } from '../api/wanted'
import { EmptyState, ErrorState, Spinner } from '../components/States'
import { WantedCard } from '../features/wanted/WantedCard'
import {
  FRUIT_TYPE_LABELS,
  FRUIT_TYPES,
  PAGE_SIZES,
  SORT_LABELS,
  WANTED_SORTS,
  WANTED_STATUS_LABELS,
  WANTED_STATUSES,
} from '../features/wanted/wantedLabels'
import { hasActiveFilters, parseWantedParams, serializeWantedParams } from '../features/wanted/wantedParams'
import { useLatestRequest } from '../hooks/useLatestRequest'
import { formatNumber } from '../lib/format'
import type { Crew, Page, PageSize, WantedQuery, WantedSummary } from '../types'

const SEARCH_DEBOUNCE_MS = 400

/**
 * Caché mínima propia (no es React Query): guarda SOLO la última página que se vio.
 * Al volver desde el detalle el listado se pinta al instante con lo mismo que se dejó,
 * así podemos restaurar el scroll, y en paralelo se revalida contra el servidor.
 */
let lastPage: { key: string; data: Page<WantedSummary> } | null = null

/** Posición de scroll guardada al abrir un detalle, por query canónica. */
const SCROLL_KEY = (key: string) => `wanted:scroll:${key}`

export default function WantedListPage() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigationType = useNavigationType()

  const query = parseWantedParams(params)
  const canonical = serializeWantedParams(query)

  // 1) URL inválida o desordenada → versión canónica. `replace` para no ensuciar el historial.
  useEffect(() => {
    if (params.toString() !== canonical) setParams(canonical, { replace: true })
  }, [params, canonical, setParams])

  /**
   * Escribe un cambio en la URL. Cualquier cambio que no sea de página vuelve a la página 0.
   * Parte de la URL REAL del navegador (window.location), no de la de este render: el timer del
   * debounce se creó en un render anterior y, si usara su `query`, pisaría un filtro que el usuario
   * cambió mientras tanto. (Ojo: la forma funcional de setSearchParams también usa la URL de su render.)
   */
  function update(patch: Partial<WantedQuery>, { replace = false } = {}) {
    const latest = parseWantedParams(new URLSearchParams(window.location.search))
    const next: WantedQuery = { ...latest, ...patch }
    if (!('page' in patch)) next.page = 0
    setParams(serializeWantedParams(next), { replace })
    if ('page' in patch && !replace) resultsTopRef.current?.scrollIntoView({ block: 'start' })
  }
  const resultsTopRef = useRef<HTMLDivElement | null>(null)

  // 2) Búsqueda con debounce: el input es estado local y la URL se actualiza 400 ms después de la última tecla.
  const [searchText, setSearchText] = useState(query.q)
  const debounceRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    // Si `q` cambia por atrás/adelante o por "Limpiar filtros", el input lo refleja
    // y se cancela cualquier búsqueda pendiente (si no, el timer reescribiría la URL vieja).
    window.clearTimeout(debounceRef.current)
    setSearchText(query.q)
  }, [query.q])

  // Atrás/adelante (navegación POP) cancela la búsqueda pendiente aunque `q` no haya cambiado:
  // el usuario pidió volver a esa URL, y eso es lo último que pidió (Regla del Log Pose).
  useEffect(() => {
    if (navigationType !== 'POP') return
    window.clearTimeout(debounceRef.current)
    setSearchText(parseWantedParams(new URLSearchParams(location.search)).q)
  }, [location.key, location.search, navigationType])

  useEffect(() => () => window.clearTimeout(debounceRef.current), [])

  function onSearchChange(value: string) {
    setSearchText(value)
    window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => update({ q: value.trim() }), SEARCH_DEBOUNCE_MS)
  }

  function onSearchSubmit(event: FormEvent) {
    event.preventDefault()
    window.clearTimeout(debounceRef.current)
    if (searchText.trim() !== query.q) update({ q: searchText.trim() })
  }

  // 3) Datos: la key es la query canónica. Cada cambio = 1 request; la anterior se aborta y se ignora.
  const wanted = useLatestRequest(canonical, (signal) => fetchWanted(query, signal), lastPage?.key === canonical ? lastPage : null)
  const crews = useLatestRequest<Crew[]>('crews', fetchCrews)
  const crewOptions = crews.data ?? []

  const current = wanted.isStale ? null : wanted.data
  useEffect(() => {
    if (current) lastPage = { key: canonical, data: current }
  }, [current, canonical])

  // 4) Nunca quedarse en una página que no existe (ej: page=99 cuando ahora hay 3 páginas).
  useEffect(() => {
    if (!current || wanted.loading) return
    const lastValid = Math.max(current.totalPages - 1, 0)
    if (query.page > lastValid) update({ page: lastValid }, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, wanted.loading])

  // Si el backend rechaza una página que ya no existe (400/404/422), volvemos a la primera.
  useEffect(() => {
    const status = wanted.error?.status
    if (query.page > 0 && (status === 400 || status === 404 || status === 422)) update({ page: 0 }, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted.error])

  // 5) Volver del detalle: restauramos el scroll guardado (con BrowserRouter no hay ScrollRestoration automático).
  const restored = useRef(false)
  useLayoutEffect(() => {
    if (restored.current || !current) return
    restored.current = true
    const saved = sessionStorage.getItem(SCROLL_KEY(canonical))
    if (navigationType === 'POP' && saved !== null) window.scrollTo(0, Number(saved))
    sessionStorage.removeItem(SCROLL_KEY(canonical))
  }, [current, canonical, navigationType])

  function rememberScroll() {
    sessionStorage.setItem(SCROLL_KEY(canonical), String(window.scrollY))
  }

  const data = wanted.data
  const showInitialLoading = data === null && wanted.loading
  const showError = wanted.error !== null
  const filtersActive = hasActiveFilters(query)
  const from = location.pathname + location.search

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs tracking-widest text-slate-400 uppercase">East Blue</p>
        <h1 className="text-2xl font-bold">Carteles de "Se Busca"</h1>
      </header>

      {/* Filtros */}
      <section aria-label="Filtros" className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <form role="search" onSubmit={onSearchSubmit} className="sm:col-span-2">
          <label htmlFor="wanted-q" className="mb-1 block text-sm font-medium text-slate-300">
            Buscar por nombre o epíteto
          </label>
          <input
            id="wanted-q"
            type="search"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Ej: Cazador de piratas"
            autoComplete="off"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400"
          />
        </form>
        <FilterSelect
          id="wanted-status"
          label="Estado"
          value={query.status}
          allLabel="Todos"
          options={WANTED_STATUSES.map((s) => ({ value: s, label: WANTED_STATUS_LABELS[s] }))}
          onChange={(v) => update({ status: parseWantedParams(new URLSearchParams({ status: v })).status })}
        />
        <FilterSelect
          id="wanted-crew"
          label="Tripulación"
          value={query.crewId}
          allLabel={crews.loading && crews.data === null ? 'Cargando…' : crews.error ? 'Todas (no se pudo cargar la lista)' : 'Todas'}
          options={crewOptions.map((c) => ({ value: c.id, label: c.name }))}
          onChange={(v) => update({ crewId: v })}
        />
        <FilterSelect
          id="wanted-fruit"
          label="Fruta del diablo"
          value={query.fruit}
          allLabel="Todas"
          options={FRUIT_TYPES.map((f) => ({ value: f, label: FRUIT_TYPE_LABELS[f] }))}
          onChange={(v) => update({ fruit: parseWantedParams(new URLSearchParams({ fruit: v })).fruit })}
        />
        <FilterSelect
          id="wanted-sort"
          label="Ordenar por"
          value={query.sort}
          options={WANTED_SORTS.map((s) => ({ value: s, label: SORT_LABELS[s] }))}
          onChange={(v) => update({ sort: parseWantedParams(new URLSearchParams({ sort: v })).sort })}
        />
        {filtersActive && (
          <div className="sm:col-span-2 lg:col-span-6">
            <button
              type="button"
              onClick={() => {
                window.clearTimeout(debounceRef.current)
                setSearchText('')
                update({ q: '', status: '', crewId: '', fruit: '' })
              }}
              className="text-sm text-amber-400 underline hover:text-amber-300"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </section>

      <div ref={resultsTopRef} className="scroll-mt-4" />
      {/* Barra de resultados: altura fija para que no salte el layout */}
      <div className="flex min-h-10 flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
        <p aria-live="polite" className="flex items-center gap-2">
          {wanted.loading && <Spinner />}
          {current && !showError ? `${formatNumber(current.totalElements)} carteles encontrados` : wanted.loading ? 'Buscando carteles…' : ''}
        </p>
        <label className="flex items-center gap-2">
          Por página
          <select
            value={query.size}
            onChange={(e) => update({ size: Number(e.target.value) as PageSize })}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Resultados: alto mínimo fijo → loading, error y vacío ocupan el mismo espacio */}
      <section aria-label="Resultados" aria-busy={wanted.loading} className="min-h-[60vh]">
        {showInitialLoading && <SkeletonGrid count={Math.min(query.size, 12)} />}

        {showError && wanted.error && <ErrorState error={wanted.error} onRetry={wanted.retry} />}

        {!showError && data !== null &&
          (data.content.length === 0 && !wanted.isStale ? (
            <EmptyState title="Ningún cartel coincide con la búsqueda.">
              {filtersActive ? 'Prueba con otros filtros o límpialos.' : 'Aún no hay carteles en su workspace.'}
            </EmptyState>
          ) : (
            <ul
              className={`grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-4 ${
                wanted.isStale ? 'pointer-events-none opacity-40' : ''
              }`}
            >
              {data.content.map((w) => (
                <li key={w.id}>
                  <Link to={`/wanted/${encodeURIComponent(w.id)}`} state={{ from }} onClick={rememberScroll} className="group block h-full rounded-xl focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none">
                    <WantedCard wanted={w} />
                  </Link>
                </li>
              ))}
            </ul>
          ))}
      </section>

      {/* Paginación del servidor */}
      {!showError && data !== null && data.totalPages > 0 && (
        <nav aria-label="Paginación" className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={query.page === 0 || wanted.loading}
            onClick={() => update({ page: query.page - 1 })}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="min-w-32 text-center text-sm text-slate-300">
            {current ? `Página ${Math.min(query.page, current.totalPages - 1) + 1} de ${current.totalPages}` : `Página ${query.page + 1}…`}
          </span>
          <button
            type="button"
            disabled={!current || query.page >= current.totalPages - 1 || wanted.loading}
            onClick={() => update({ page: query.page + 1 })}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente →
          </button>
        </nav>
      )}
    </div>
  )
}

function FilterSelect(props: {
  id: string
  label: string
  value: string
  options: { value: string; label: string }[]
  allLabel?: string
  onChange: (value: string) => void
}) {
  const known = props.value === '' || props.options.some((o) => o.value === props.value)
  return (
    <div>
      <label htmlFor={props.id} className="mb-1 block text-sm font-medium text-slate-300">
        {props.label}
      </label>
      <select
        id={props.id}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400"
      >
        {props.allLabel !== undefined && <option value="">{props.allLabel}</option>}
        {/* Mientras cargan las tripulaciones, el valor de la URL se mantiene visible */}
        {!known && <option value={props.value}>{props.value}</option>}
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function SkeletonGrid({ count }: { count: number }) {
  return (
    <ul aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="h-64 animate-pulse rounded-xl bg-slate-900 motion-reduce:animate-none" />
      ))}
    </ul>
  )
}
