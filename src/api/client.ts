import type { ApiErrorBody, NewsDetail } from '../types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL
const TOKEN_KEY = 'logpose.token'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: { field: string; message: string }[]
  readonly retryAfterSeconds?: number
  readonly current?: NewsDetail

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.status = body.status
    this.code = body.code
    this.details = body.details ?? []
    this.retryAfterSeconds = body.retryAfterSeconds
    this.current = body.current
  }
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err
  return new ApiError({ status: 0, code: 'UNKNOWN', message: 'Ocurrió un error inesperado.' })
}

let onUnauthorized: () => void = () => {}

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH'
  body?: unknown
  signal?: AbortSignal
  auth?: boolean
}

export async function apiFetch<T>(
  path: string,
  { method = 'GET', body, signal, auth = true }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = tokenStorage.get()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (err) {
    if (signal?.aborted) throw err
    throw new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'No se pudo conectar con el servidor. Revisa tu conexión.',
    })
  }

  if (res.ok) return (await res.json()) as T

  const error = new ApiError(await readErrorBody(res))
  // Login y registro mandan auth: false; su 401 es "credenciales incorrectas", no sesión vencida.
  if (res.status === 401 && auth) onUnauthorized()
  throw error
}

async function readErrorBody(res: Response): Promise<ApiErrorBody> {
  try {
    const data = (await res.json()) as Partial<ApiErrorBody>
    if (typeof data.code === 'string' && typeof data.message === 'string') {
      return { ...data, code: data.code, message: data.message, status: res.status }
    }
  } catch {
    // El cuerpo no era JSON (por ejemplo, una página de error del proxy).
  }
  return {
    status: res.status,
    code: 'HTTP_ERROR',
    message: `El servidor respondió con un error (${res.status}).`,
  }
}
