import { useCallback, useEffect, useRef, useState } from 'react'
import { toApiError, type ApiError } from '../api/client'

/**
 * Pide datos cada vez que cambia `key` y SOLO deja escribir a la respuesta de la última petición.
 *
 * Protección contra respuestas que llegan tarde (Regla del Log Pose), en dos capas:
 * 1. Al cambiar la key, el cleanup del efecto ABORTA la petición anterior (AbortController).
 * 2. Cada petición guarda su número (requestId). Al responder, si ya no es la última, se descarta.
 *
 * A diferencia de useApi (CP1), mientras carga la nueva key conserva los datos anteriores
 * (`data` + `isStale`) para que el layout no salte. La UI los muestra atenuados.
 */

export interface LatestRequest<T> {
  data: T | null
  /** true mientras `data` corresponde a una key anterior y la nueva todavía está cargando. */
  isStale: boolean
  loading: boolean
  error: ApiError | null
  retry: () => void
}

interface Snapshot<T> {
  key: string
  data: T | null
  error: ApiError | null
}

export function useLatestRequest<T>(
  key: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
  initial?: { key: string; data: T } | null,
): LatestRequest<T> {
  const [attempt, setAttempt] = useState(0)
  const [snapshot, setSnapshot] = useState<Snapshot<T>>(() =>
    initial ? { key: initial.key, data: initial.data, error: null } : { key: '', data: null, error: null },
  )
  const [loadedAttempt, setLoadedAttempt] = useState(-1)
  const requestId = useRef(0)
  const fetcherRef = useRef(fetcher)

  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    const id = ++requestId.current
    const controller = new AbortController()

    fetcherRef
      .current(controller.signal)
      .then((data) => {
        if (id !== requestId.current) return // respuesta vieja: se ignora
        setSnapshot({ key, data, error: null })
        setLoadedAttempt(attempt)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || id !== requestId.current) return
        setSnapshot((prev) => ({ key, data: prev.data, error: toApiError(err) }))
        setLoadedAttempt(attempt)
      })

    return () => controller.abort()
  }, [key, attempt])

  const settled = snapshot.key === key && loadedAttempt === attempt
  // Datos cacheados para la misma key (ej. al volver del detalle) se muestran como válidos mientras se revalida.
  const fresh = snapshot.key === key && snapshot.error === null && snapshot.data !== null

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  return {
    data: snapshot.data,
    isStale: !fresh && snapshot.data !== null,
    loading: !settled,
    error: settled ? snapshot.error : null,
    retry,
  }
}
