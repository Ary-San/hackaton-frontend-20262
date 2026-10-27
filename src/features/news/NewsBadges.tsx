import type { NewsItem, NewsPriority, NewsStatus } from '../../types'
import { NEWS_PRIORITY_LABELS, NEWS_STATUS_LABELS, NEWS_TYPE_LABELS } from './newsParams'

const STATUS_STYLES: Record<NewsStatus, string> = {
  RUMOR: 'border-amber-700 text-amber-300',
  CONFIRMED: 'border-emerald-700 text-emerald-300',
  DEBUNKED: 'border-red-800 text-red-300',
}

const PRIORITY_STYLES: Record<NewsPriority, string> = {
  LOW: 'text-slate-400',
  MEDIUM: 'text-sky-300',
  HIGH: 'text-orange-300',
  CRITICAL: 'text-red-300 font-semibold',
}

export function NewsBadges({ news }: { news: NewsItem }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className={`rounded-full border px-2 py-0.5 ${STATUS_STYLES[news.status]}`}>
        {NEWS_STATUS_LABELS[news.status]}
      </span>
      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-300">{NEWS_TYPE_LABELS[news.type]}</span>
      <span className={PRIORITY_STYLES[news.priority]}>Prioridad {NEWS_PRIORITY_LABELS[news.priority].toLowerCase()}</span>
    </div>
  )
}
