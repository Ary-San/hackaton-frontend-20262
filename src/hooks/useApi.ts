import { useCallback, useEffect, useState } from 'react'
import { apiFetch, toApiError, type ApiError } from '../api/client'

type Settled<T> = { status: 'error'; error: ApiError } | { status: 'success'; data: T }

export type ApiState<T> = { status: 'loading' } | Settled<T>

export function useApi<T>(path: string) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ key: string; value: Settled<T> } | null>(null)
  const key = `${attempt}:${path}`

  useEffect(() => {
    const controller = new AbortController()
    apiFetch<T>(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setResult({ key, value: { status: 'success', data } })
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setResult({ key, value: { status: 'error', error: toApiError(err) } })
      })
    return () => controller.abort()
  }, [key, path])

  // Un resultado guardado con otra key es de una petición anterior: mientras llega la actual, se muestra "cargando".
  const state: ApiState<T> = result?.key === key ? result.value : { status: 'loading' }
  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  return { state, retry }
}
