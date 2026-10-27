import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, apiFetch, setUnauthorizedHandler, tokenStorage } from '../api/client'
import type { LoginResponse, MeResponse } from '../types'
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
  type Session,
  type SessionEndReason,
} from './authContext'

// setTimeout se desborda por encima de ~24.8 días y dispararía al instante.
const MAX_TIMEOUT_MS = 2_147_483_647

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(() =>
    tokenStorage.get() ? 'checking' : 'anonymous',
  )
  const [session, setSession] = useState<Session | null>(null)
  const [endReason, setEndReason] = useState<SessionEndReason>(null)

  const endSession = useCallback((reason: Exclude<SessionEndReason, null>) => {
    tokenStorage.clear()
    setSession(null)
    setEndReason(reason)
    setStatus('anonymous')
  }, [])

  const startSession = useCallback((res: LoginResponse) => {
    tokenStorage.set(res.token)
    setSession({ user: res.user, team: res.team, expiresAt: res.expiresAt })
    setEndReason(null)
    setStatus('authenticated')
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => endSession('expired'))
  }, [endSession])

  useEffect(() => {
    if (status !== 'checking') return
    const controller = new AbortController()
    apiFetch<MeResponse>('/auth/me', { signal: controller.signal })
      .then((me) => {
        setSession(me)
        setStatus('authenticated')
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        // El 401 ya lo resolvió el handler global; cualquier otro error no invalida la sesión.
        if (err instanceof ApiError && err.status === 401) return
        setStatus('error')
      })
    return () => controller.abort()
  }, [status])

  useEffect(() => {
    if (!session) return
    const msLeft = new Date(session.expiresAt).getTime() - Date.now()
    if (Number.isNaN(msLeft) || msLeft > MAX_TIMEOUT_MS) return
    const id = setTimeout(() => endSession('expired'), Math.max(msLeft, 0))
    return () => clearTimeout(id)
  }, [session, endSession])

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
        auth: false,
      })
      startSession(res)
    },
    [startSession],
  )

  const register = useCallback(
    async (teamName: string, email: string, password: string) => {
      const res = await apiFetch<LoginResponse>('/auth/register', {
        method: 'POST',
        body: { teamName, email, password },
        auth: false,
      })
      startSession(res)
    },
    [startSession],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      endReason,
      login,
      register,
      logout: () => endSession('logout'),
      retryRestore: () => setStatus('checking'),
    }),
    [status, session, endReason, login, register, endSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
