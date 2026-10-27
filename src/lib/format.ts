const numberFormat = new Intl.NumberFormat('es-PE')
const dateFormat = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' })

export function formatBerries(amount: number): string {
  return `฿ ${numberFormat.format(amount)}`
}

export function formatNumber(value: number): string {
  return numberFormat.format(value)
}

export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso))
}
