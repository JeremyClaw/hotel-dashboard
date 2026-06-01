import { cn, trendColor, trendArrow } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  subValue?: string
  trend?: number | null   // % change vs comparison period
  trendLabel?: string
  icon?: string
  highlight?: boolean
}

export default function StatCard({
  label,
  value,
  subValue,
  trend,
  trendLabel,
  icon,
  highlight,
}: StatCardProps) {
  return (
    <div className={cn(
      'rounded-xl p-4 border',
      highlight
        ? 'bg-violet-600/10 border-violet-500/30'
        : 'bg-slate-800/50 border-slate-700/50'
    )}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        {icon && <span className="text-lg">{icon}</span>}
      </div>

      <p className={cn(
        'text-2xl font-bold',
        highlight ? 'text-violet-300' : 'text-white'
      )}>{value}</p>

      {subValue && (
        <p className="text-xs text-slate-500 mt-0.5">{subValue}</p>
      )}

      {trend !== undefined && trend !== null && (
        <p className={cn('text-xs mt-2 font-medium', trendColor(trend))}>
          {trendArrow(trend)} {Math.abs(trend).toFixed(1)}%
          {trendLabel && <span className="text-slate-500 font-normal ml-1">{trendLabel}</span>}
        </p>
      )}
    </div>
  )
}
