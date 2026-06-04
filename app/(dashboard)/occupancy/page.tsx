import StatCard from '@/components/stats/StatCard'
import { formatPercent } from '@/lib/utils'
import { getDashboard } from '@/lib/cloudbeds'
import { format, subDays } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const TZ = 'Africa/Johannesburg'
const fmt = (d: Date) => format(toZonedTime(d, TZ), 'yyyy-MM-dd')

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

async function getOccupancyData() {
  const now = new Date()
  const days = Array.from({ length: 7 }, (_, i) => subDays(now, i))
  const dashboards = await Promise.allSettled(days.map(d => getDashboard(fmt(d))))

  return days.map((d, i) => {
    const dash = dashboards[i].status === 'fulfilled' ? (dashboards[i].value as Dash) : null
    return {
      date: fmt(d),
      label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : format(toZonedTime(d, TZ), 'EEE d MMM'),
      isToday: i === 0,
      occupancy: dash?.percentageOccupied ?? null,
      roomsOccupied: dash?.roomsOccupied ?? null,
      capacity: dash?.capacity ?? 38,
      arrivals: parseInt(dash?.arrivals ?? '0') || 0,
      departures: parseInt(dash?.departures ?? '0') || 0,
      inHouse: dash?.inHouse ?? null,
      guestsInHouse: dash?.guestsInHouse ?? null,
      cancellations: dash?.cancellations ?? 0,
    }
  })
}

export default async function OccupancyPage() {
  let rows: Awaited<ReturnType<typeof getOccupancyData>> = []
  let errorMsg = ''

  try {
    rows = await getOccupancyData()
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err)
  }

  const today = rows[0] ?? null
  const yesterday = rows[1] ?? null

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Occupancy</h1>
        <p className="text-slate-400 text-sm mt-1">
          {new Date().toLocaleDateString('en-ZA', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            timeZone: TZ,
          })}
        </p>
      </div>

      {errorMsg ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <p className="text-red-300 font-medium text-sm">Could not load occupancy data</p>
          <p className="text-red-400/70 text-xs mt-1 font-mono">{errorMsg}</p>
        </div>
      ) : (
        <>
          {today && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Occupancy Tonight"
                value={formatPercent(today.occupancy)}
                trend={
                  today.occupancy !== null && yesterday?.occupancy !== null && yesterday?.occupancy !== undefined
                    ? +(today.occupancy - yesterday.occupancy).toFixed(1)
                    : null
                }
                trendLabel="vs yesterday"
                icon="🏨"
                highlight
              />
              <StatCard
                label="Rooms Occupied"
                value={today.roomsOccupied !== null ? `${today.roomsOccupied} / ${today.capacity}` : '—'}
                subValue="rooms tonight"
                icon="🛏️"
              />
              <StatCard
                label="Guests In House"
                value={today.guestsInHouse !== null ? String(today.guestsInHouse) : '—'}
                subValue={today.inHouse !== null ? `${today.inHouse} rooms` : undefined}
                icon="👥"
              />
              <StatCard label="Arrivals Today"   value={String(today.arrivals)}   icon="✈️" />
              <StatCard label="Departures Today" value={String(today.departures)} icon="🧳" />
              <StatCard label="Cancellations"    value={String(today.cancellations)} icon="❌" />
              <StatCard
                label="Yesterday"
                value={formatPercent(yesterday?.occupancy ?? null)}
                icon="📅"
              />
              <StatCard
                label="Available Rooms"
                value={today.roomsOccupied !== null ? String(today.capacity - today.roomsOccupied) : '—'}
                subValue="not occupied tonight"
                icon="🔓"
              />
            </div>
          )}

          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
            <h2 className="text-white font-semibold text-sm mb-4">7-Day Trend</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs uppercase tracking-wide">
                    <th className="text-left pb-3 font-medium">Date</th>
                    <th className="text-right pb-3 font-medium">Occupancy</th>
                    <th className="hidden md:table-cell pb-3 px-4">
                      <div className="h-1 rounded-full bg-slate-700" />
                    </th>
                    <th className="text-right pb-3 font-medium">Rooms</th>
                    <th className="text-right pb-3 font-medium hidden sm:table-cell">Arrivals</th>
                    <th className="text-right pb-3 font-medium hidden sm:table-cell">Departures</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {rows.map((row) => (
                    <tr key={row.date} className={row.isToday ? 'text-white' : 'text-slate-400'}>
                      <td className="py-3">
                        <span className={row.isToday ? 'font-semibold' : ''}>{row.label}</span>
                      </td>
                      <td className="py-3 text-right font-mono">
                        <span className={row.isToday ? 'text-violet-300 font-bold' : ''}>
                          {formatPercent(row.occupancy)}
                        </span>
                      </td>
                      <td className="hidden md:table-cell py-3 px-4 w-40">
                        <div className="h-1.5 rounded-full bg-slate-700">
                          <div
                            className={`h-1.5 rounded-full ${row.isToday ? 'bg-violet-500' : 'bg-slate-500'}`}
                            style={{ width: `${row.occupancy ?? 0}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 text-right font-mono">
                        {row.roomsOccupied !== null ? `${row.roomsOccupied}/${row.capacity}` : '—'}
                      </td>
                      <td className="py-3 text-right hidden sm:table-cell">{row.arrivals}</td>
                      <td className="py-3 text-right hidden sm:table-cell">{row.departures}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
