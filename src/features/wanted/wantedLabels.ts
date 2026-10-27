import type { FruitType, PageSize, WantedSort, WantedStatus } from '../../types'

export const WANTED_STATUS_LABELS: Record<WantedStatus, string> = {
  AT_LARGE: 'Prófugo',
  CAPTURED: 'Capturado',
  MISSING: 'Desaparecido',
}

export const FRUIT_TYPE_LABELS: Record<FruitType, string> = {
  PARAMECIA: 'Paramecia',
  ZOAN: 'Zoan',
  LOGIA: 'Logia',
}

export const SORT_LABELS: Record<WantedSort, string> = {
  'bounty,desc': 'Mayor recompensa',
  'name,asc': 'Nombre (A-Z)',
  'updatedAt,desc': 'Actualizados recientemente',
}

export const WANTED_STATUSES = Object.keys(WANTED_STATUS_LABELS) as WantedStatus[]
export const FRUIT_TYPES = Object.keys(FRUIT_TYPE_LABELS) as FruitType[]
export const WANTED_SORTS = Object.keys(SORT_LABELS) as WantedSort[]
export const PAGE_SIZES: readonly PageSize[] = [10, 20, 50]
