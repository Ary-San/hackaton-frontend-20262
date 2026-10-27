export interface User {
  id: string
  name: string
  email: string
}

export interface Team {
  code: string
  name: string
}

export interface LoginResponse {
  token: string
  tokenType: 'Bearer'
  expiresAt: string
  user: User
  team: Team
}

export interface MeResponse {
  user: User
  team: Team
  expiresAt: string
}

export type WantedStatus = 'AT_LARGE' | 'CAPTURED' | 'MISSING'
export type FruitType = 'PARAMECIA' | 'ZOAN' | 'LOGIA'

export interface Crew {
  id: string
  name: string
  shipName: string
  jollyRogerColor: string
  memberCount: number
  totalBounty: number
}

export interface WantedSummary {
  id: string
  name: string
  epithet: string
  bounty: number
  status: WantedStatus
  crew: { id: string; name: string }
  role: string
  devilFruit: { name: string; type: FruitType } | null
  threatLevel: number
  lastSeenIsland: string
  updatedAt: string
}

export interface DashboardSummary {
  team: Team
  wanted: {
    total: number
    totalBounty: number
    averageBounty: number
    byStatus: Record<WantedStatus, number>
    byFruit: Record<FruitType | 'NONE', number>
  }
  crews: {
    total: number
    mostWanted: Crew | null
  }
  topBounties: WantedSummary[]
  generatedAt: string
}

export interface LogPose {
  status: 'LOCKED' | 'UNLOCKED'
  grandLineUnlocked: boolean
  unlockedAt: string | null
  message: string
}

export interface ApiErrorBody {
  status: number
  code: string
  message: string
  traceId?: string
  details?: { field: string; message: string }[]
  retryAfterSeconds?: number
}

/** Respuesta paginada del servidor (GET /wanted). `page` empieza en 0. */
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export type WantedSort = 'bounty,desc' | 'name,asc' | 'updatedAt,desc'
export type PageSize = 10 | 20 | 50

/** Estado completo del listado /wanted. Vive en la URL. Los strings vacíos significan "sin filtro". */
export interface WantedQuery {
  page: number
  size: PageSize
  sort: WantedSort
  status: WantedStatus | ''
  crewId: string
  fruit: FruitType | ''
  q: string
}
