import StatCard from '@/components/stats/StatCard'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { getDashboard, getReservations } from '@/lib/cloudbeds'
import { format, subDays, startOfMonth } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const TZ = 'Africa/Johannesburg'
const tod = () => format(toZonedTime(new Date(), TZ), 'yyyy-MM-dd')
const yest = () => format(toZonedTime(subDays(new Date(), 1), TZ), 'yyyy-MM-dd')
const mtd = () => format(toZonedTime(startOfMonth(new Date()), TZ), 'yyyy-MM-dd')

type Resv = { total?: string; sourceName?: string }
type Dash = {
  percentageOccupied?: number
  roomsOccupied?: number
  capacity?: number
  arrivals?: string
  departures?: string
  inHouse?: number
  guestsInHouse?: number
  cancellations?: number
}

async function getStats() {
  const [dashToday, dashYesterday, resvToday, resvMTD] = await Promise.all([
    getDashboard(tod()),
    getDashboard(yest()),
    getReservations({ checkInFrom: tod(), checkInTo: tod(), pageSize: '100' }),
    getReservations({ checkInFrom: mtd(), checkInTo: tod(), pageSize: '200' }),
  ])

  const dt = dashToday as Dash
  const dy = dashYesterday as Dash
  const resvTodayArr: Resv[] = Array.isArray(resvToday) ? resvToday : []
  const resvMTDArr: Resv[]   = Array.isArray(resvMTD)   ? resvMTD   : []

  const revenueToday = resvTodayArr.reduce((s, r) => s + (parseFloat(r.total ?? '0') || 0), 0)
  const revenueMTD   = resvMTDArr.reduce((s, r) => s + (parseFloat(r.total ?? '0') || 0), 0)
  const adr          = resvMTDArr.length > 0 ? revenueMTD / resvMTDArr.length : 0
  const occupancy    = dt.percentageOccupied || 0
  const revpar       = adr * occupancy / 100

  const channelMap: Record<string, { count: number; revenue: number }> = {}
  resvMTDArr.forEach((r) => {
    const ch = r.sourceName || 'Direct'
    if (!channelMap[ch]) channelMap[ch] = { count: 0, revenue: 0 }
    channelMap[ch].count++
    channelMap[ch].revenue += parseFloat(r.total ?? '0') || 0
  })
  const channels = Object.entries(channelMap)
    .map(([name, d]) => ({ name, count: d.count, revenue: d.revenue }))
    .sort((a, b) => b.revenue - a.revenue)

  return {
    occupancyToday:     occupancy,
    occupancyYesterday: dy.percentageOccupied || 0,
    roomsOccupied:      dt.roomsOccupied      || 0,
    capacity:           dt.capacity           || 38,
    arrivalsToday:      parseInt(dt.arrivals  ?? '0') || 0,
    departuresToday:    parseInt(dt.departures ?? '0') || 0,
    inHouse:            dt.inHouse            || 0,
    guestsInHouse:      dt.guestsInHouse      || 0,
    cancellationsToday: dt.cancellations      || 0,
    revenueToday,
    revenueMTD,
    adr,
    revpar,
    channels,
  }
}

export default async function OverviewPage() {
  let s: Awaited<ReturnType<typeof getStats>> | null = null
  let errorMsg = ''

  try {
    s = await getStats()
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-slate-400 text-sm mt-1">
          {new Date().toLocaleDateString('en-ZA', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            timeZone: TZ,
          })}
        </p>
      </div>

      {!s ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <p className="text-red-300 font-medium text-sm">Could not load data from Cloudbeds</p>
          <p className="text-red-400/70 text-xs mt-1 font-mono">{errorMsg}</p>
        </div>
      ) : (
        <>
          <div className="mb-6 p-4 rounded-xl bg-violet-600/10 border border-violet-500/30 flex items-center gap-3">
            <span className="text-2xl">🏨</span>
            <div>
              <p className="text-violet-300 font-semibold text-sm">Fools Inn — Live Data</p>
              <p className="text-violet-400/70 text-xs">{s.capacity} rooms total · Updated now</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Occupancy Today"
              value={formatPercent(s.occupancyToday)}
              trend={+(s.occupancyToday - s.occupancyYesterday).toFixed(1)}
              trendLabel="vs yesterday"
              icon="🏨"
              highlight
            />
            <StatCard
              label="Rooms Occupied"
              value={`${s.roomsOccupied} / ${s.capacity}`}
              subValue="rooms tonight"
              icon="🛏️"
            />
            <StatCard
              label="Occupancy Yesterday"
              value={formatPercent(s.occupancyYesterday)}
              icon="📅"
            />
            <StatCard
              label="Guests In House"
              value={String(s.guestsInHouse)}
              subValue={`${s.inHouse} rooms`}
              icon="👥"
            />
            <StatCard
              label="Revenue Today"
              value={formatCurrency(s.revenueToday)}
              icon="💰"
            />
            <StatCard
              label="Revenue MTD"
              value={formatCurrency(s.revenueMTD)}
              icon="📈"
            />
            <StatCard
              label="ADR"
              value={formatCurrency(s.adr)}
              subValue="Avg Daily Rate (MTD)"
              icon="🏷️"
            />
            <StatCard
              label="RevPAR"
              value={formatCurrency(s.revpar)}
              subValue="Rev per Available Room"
              icon="📐"
            />
            <StatCard label="Arrivals Today"   value={String(s.arrivalsToday)}   icon="✈️" />
            <StatCard label="Departures Today" value={String(s.departuresToday)} icon="🧳" />
            <StatCard label="Cancellations"    value={String(s.cancellationsToday)} icon="❌" />
          </div>

          {s.channels.length > 0 && (
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
              <h2 className="text-white font-semibold text-sm mb-4">Booking Channels — MTD</h2>
              <div className="space-y-3">
                {s.channels.map((ch) => {
                  const pct = s!.revenueMTD > 0 ? (ch.revenue / s!.revenueMTD) * 100 : 0
                  return (
                    <div key={ch.name} className="flex items-center gap-3">
                      <div className="w-28 text-slate-300 text-xs truncate">{ch.name}</div>
                      <div className="flex-1 bg-slate-700/50 rounded-full h-2">
                        <div className="bg-violet-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-slate-500 text-xs w-8 text-right">{ch.count}</div>
                      <div className="text-slate-300 text-xs w-20 text-right">{formatCurrency(ch.revenue)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
