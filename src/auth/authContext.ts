import { createContext, useContext } from 'react'
import type { Team, User } from '../types'

export type AuthStatus = 'checking' | 'error' | 'authenticated' | 'anonymous'

export type SessionEndReason = 'logout' | 'expired' | null

export interface Session {
  user: User
  team: Team
  expiresAt: string
}

export interface AuthContextValue {
  status: AuthStatus
  session: Session | null
  endReason: SessionEndReason
  login: (email: string, password: string) => Promise<void>
  register: (teamName: string, email: string, password: string) => Promise<void>
  logout: () => void
  retryRestore: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
