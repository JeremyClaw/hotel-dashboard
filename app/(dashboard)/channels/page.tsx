import StatCard from '@/components/stats/StatCard'
import { formatCurrency, resvTotal } from '@/lib/utils'
import { getReservations } from '@/lib/cloudbeds'
import { format, startOfMonth } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const TZ = 'Africa/Johannesburg'
const tod = () => format(toZonedTime(new Date(), TZ), 'yyyy-MM-dd')
const mtd = () => format(toZonedTime(startOfMonth(new Date()), TZ), 'yyyy-MM-dd')

type Resv = { grandTotal?: string | number; total?: string | number; sourceName?: string; status?: string }

async function getChannelData() {
  const resvMTD = await getReservations({ checkInFrom: mtd(), checkInTo: tod(), pageSize: '200' })
  const arr: Resv[] = Array.isArray(resvMTD) ? resvMTD : []

  const channelMap: Record<string, { count: number; revenue: number; cancelled: number }> = {}
  arr.forEach(r => {
    const ch = r.sourceName || 'Direct'
    if (!channelMap[ch]) channelMap[ch] = { count: 0, revenue: 0, cancelled: 0 }
    channelMap[ch].count++
    channelMap[ch].revenue += resvTotal(r)
    if (r.status?.toLowerCase() === 'cancelled') channelMap[ch].cancelled++
  })

  const channels = Object.entries(channelMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.revenue - a.revenue)

  const totalRevenue = channels.reduce((s, c) => s + c.revenue, 0)
  const totalCount   = channels.reduce((s, c) => s + c.count, 0)

  return { channels, totalRevenue, totalCount }
}

const CHANNEL_COLORS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-rose-500',
]

export default async function ChannelsPage() {
  let d: Awaited<ReturnType<typeof getChannelData>> | null = null
  let errorMsg = ''

  try {
    d = await getChannelData()
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err)
  }

  const monthLabel = new Date().toLocaleDateString('en-ZA', {
    month: 'long', year: 'numeric', timeZone: TZ,
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Channels</h1>
        <p className="text-slate-400 text-sm mt-1">Booking source breakdown · {monthLabel}</p>
      </div>

      {errorMsg ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <p className="text-red-300 font-medium text-sm">Could not load channel data</p>
          <p className="text-red-400/70 text-xs mt-1 font-mono">{errorMsg}</p>
        </div>
      ) : d && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <StatCard
              label="Total Revenue MTD"
              value={formatCurrency(d.totalRevenue)}
              icon="💰"
              highlight
            />
            <StatCard
              label="Total Reservations"
              value={String(d.totalCount)}
              subValue="check-ins this month"
              icon="🗓️"
            />
            <StatCard
              label="Active Channels"
              value={String(d.channels.length)}
              subValue="booking sources"
              icon="📡"
            />
          </div>

          {d.channels.length === 0 ? (
            <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 p-12 flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl mb-3">📡</p>
                <p className="text-slate-300 font-medium">No channel data yet</p>
                <p className="text-slate-500 text-sm mt-1">Check-ins this month will appear here</p>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5 mb-4">
                <h2 className="text-white font-semibold text-sm mb-5">Revenue by Channel</h2>
                <div className="space-y-4">
                  {d.channels.map((ch, i) => {
                    const pct = d!.totalRevenue > 0 ? (ch.revenue / d!.totalRevenue) * 100 : 0
                    const color = CHANNEL_COLORS[i % CHANNEL_COLORS.length]
                    return (
                      <div key={ch.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${color.replace('bg-', 'bg-')}`} />
                            <span className="text-slate-200 text-sm font-medium">{ch.name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-slate-500">{ch.count} bookings</span>
                            <span className="text-white font-mono font-medium w-24 text-right">
                              {formatCurrency(ch.revenue)}
                            </span>
                            <span className="text-slate-500 w-10 text-right">{pct.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-slate-700/50">
                          <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
                <h2 className="text-white font-semibold text-sm mb-4">Channel Breakdown</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-500 text-xs uppercase tracking-wide border-b border-slate-700/50">
                        <th className="text-left pb-3 font-medium">Channel</th>
                        <th className="text-right pb-3 font-medium">Bookings</th>
                        <th className="text-right pb-3 font-medium hidden sm:table-cell">Cancelled</th>
                        <th className="text-right pb-3 font-medium hidden md:table-cell">Avg Value</th>
                        <th className="text-right pb-3 font-medium">Revenue</th>
                        <th className="text-right pb-3 font-medium">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {d.channels.map((ch, i) => {
                        const pct = d!.totalRevenue > 0 ? (ch.revenue / d!.totalRevenue) * 100 : 0
                        const avgValue = ch.count > 0 ? ch.revenue / ch.count : 0
                        const dot = CHANNEL_COLORS[i % CHANNEL_COLORS.length]
                        return (
                          <tr key={ch.name} className="text-slate-300 hover:bg-slate-700/20 transition-colors">
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                                <span className="font-medium text-white">{ch.name}</span>
                              </div>
                            </td>
                            <td className="py-3 text-right">{ch.count}</td>
                            <td className="py-3 text-right hidden sm:table-cell text-slate-500">{ch.cancelled || '—'}</td>
                            <td className="py-3 text-right hidden md:table-cell font-mono">{formatCurrency(avgValue)}</td>
                            <td className="py-3 text-right font-mono font-medium text-white">{formatCurrency(ch.revenue)}</td>
                            <td className="py-3 text-right text-slate-400">{pct.toFixed(1)}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-600">
                        <td className="pt-3 font-semibold text-white">Total</td>
                        <td className="pt-3 text-right font-semibold text-white">{d.totalCount}</td>
                        <td className="pt-3 hidden sm:table-cell" />
                        <td className="pt-3 hidden md:table-cell" />
                        <td className="pt-3 text-right font-mono font-bold text-white">{formatCurrency(d.totalRevenue)}</td>
                        <td className="pt-3 text-right text-slate-400">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
