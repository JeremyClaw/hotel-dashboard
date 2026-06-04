import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | null | undefined, symbol = 'R') {
  if (value === null || value === undefined) return '—'
  return `${symbol}${value.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(1)}%`
}

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return '—'
  return value.toLocaleString('en-ZA')
}

export function trendColor(pct: number | null) {
  if (pct === null) return 'text-slate-400'
  if (pct > 0) return 'text-emerald-400'
  if (pct < 0) return 'text-red-400'
  return 'text-slate-400'
}

export function trendArrow(pct: number | null) {
  if (pct === null) return ''
  if (pct > 0) return '↑'
  if (pct < 0) return '↓'
  return '→'
}

// Cloudbeds reservation revenue — 'balance' is the outstanding amount in the list API.
// Positive = guest owes property. Negative = OTA has pre-paid (virtual credit card).
// We take Math.abs to get the booking value regardless of payment direction.
export function resvTotal(r: { balance?: string | number | null; grandTotal?: string | number | null; total?: string | number | null }): number {
  const raw = r.balance ?? r.grandTotal ?? r.total ?? 0
  return Math.abs(parseFloat(String(raw)) || 0)
}
