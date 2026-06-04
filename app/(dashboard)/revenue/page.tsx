import StatCard from '@/components/stats/StatCard'
import { formatCurrency } from '@/lib/utils'
import { getDashboard, getReservations } from '@/lib/cloudbeds'
import { format, subDays, startOfMonth } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const TZ = 'Africa/Johannesburg'
const tod = () => format(toZonedTime(new Date(), TZ), 'yyyy-MM-dd')
const yest = () => format(toZonedTime(subDays(new Date(), 1), TZ), 'yyyy-MM-dd')
const mtd = () => format(toZonedTime(startOfMonth(new Date()), TZ), 'yyyy-MM-dd')

type Dash = { percentageOccupied?: number; capacity?: number }
type Resv = {
  reservationID?: string
  guestName?: string
  status?: string
  checkIn?: string
  checkOut?: string
  total?: string
  balance?: string
  sourceName?: string
}

function statusBadge(status?: string) {
  switch (status?.toLowerCase()) {
    case 'checked_in':   return { label: 'In house',    cls: 'bg-emerald-500/20 text-emerald-400' }
    case 'confirmed':    return { label: 'Confirmed',   cls: 'bg-blue-500/20 text-blue-400' }
    case 'checked_out':  return { label: 'Checked out', cls: 'bg-slate-500/20 text-slate-400' }
    case 'cancelled':    return { label: 'Cancelled',   cls: 'bg-red-500/20 text-red-400' }
    case 'no_show':      return { label: 'No show',     cls: 'bg-orange-500/20 text-orange-400' }
    default:             return { label: status ?? '—', cls: 'bg-slate-700/50 text-slate-400' }
  }
}

async function getRevenueData() {
  const [dashToday, dashYest, resvToday, resvMTD] = await Promise.all([
    getDashboard(tod()),
    getDashboard(yest()),
    getReservations({ checkInFrom: tod(), checkInTo: tod(), pageSize: '100' }),
    getReservations({ checkInFrom: mtd(), checkInTo: tod(), pageSize: '200' }),
  ])

  const dt = dashToday as Dash
  const dy = dashYest as Dash

  const todayArr: Resv[] = Array.isArray(resvToday) ? resvToday : []
  const mtdArr: Resv[]   = Array.isArray(resvMTD)   ? resvMTD   : []

  const revenueToday = todayArr.reduce((s, r) => s + (parseFloat(r.total ?? '0') || 0), 0)
  const revenueMTD   = mtdArr.reduce((s, r)   => s + (parseFloat(r.total ?? '0') || 0), 0)
  const adr          = mtdArr.length > 0 ? revenueMTD / mtdArr.length : 0
  const occupancy    = dt.percentageOccupied || 0
  const occYest      = dy.percentageOccupied || 0
  const revpar       = adr * occupancy / 100
  const revparYest   = adr * occYest / 100

  const recentResvs = [...mtdArr]
    .sort((a, b) => (b.checkIn ?? '').localeCompare(a.checkIn ?? ''))
    .slice(0, 15)

  return {
    revenueToday,
    revenueMTD,
    adr,
    revpar,
    revparYest,
    reservationsMTD: mtdArr.length,
    recentResvs,
  }
}

export default async function RevenuePage() {
  let d: Awaited<ReturnType<typeof getRevenueData>> | null = null
  let errorMsg = ''

  try {
    d = await getRevenueData()
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Revenue</h1>
        <p className="text-slate-400 text-sm mt-1">
          Month to date · {new Date().toLocaleDateString('en-ZA', {
            month: 'long', year: 'numeric', timeZone: TZ,
          })}
        </p>
      </div>

      {errorMsg ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <p className="text-red-300 font-medium text-sm">Could not load revenue data</p>
          <p className="text-red-400/70 text-xs mt-1 font-mono">{errorMsg}</p>
        </div>
      ) : d && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Revenue MTD"
              value={formatCurrency(d.revenueMTD)}
              icon="📈"
              highlight
            />
            <StatCard
              label="Revenue Today"
              value={formatCurrency(d.revenueToday)}
              icon="💰"
            />
            <StatCard
              label="ADR"
              value={formatCurrency(d.adr)}
              subValue="Avg Daily Rate (MTD)"
              icon="🏷️"
            />
            <StatCard
              label="RevPAR"
              value={formatCurrency(d.revpar)}
              trend={d.revpar !== null && d.revparYest !== null
                ? +((d.revpar - d.revparYest) / (d.revparYest || 1) * 100).toFixed(1)
                : null}
              trendLabel="vs yesterday"
              subValue="Rev per Available Room"
              icon="📐"
            />
            <StatCard
              label="Reservations MTD"
              value={String(d.reservationsMTD)}
              subValue="check-ins this month"
              icon="🗓️"
            />
          </div>

          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
            <h2 className="text-white font-semibold text-sm mb-4">Recent Reservations</h2>
            {d.recentResvs.length === 0 ? (
              <p className="text-slate-500 text-sm">No reservations found for this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 text-xs uppercase tracking-wide border-b border-slate-700/50">
                      <th className="text-left pb-3 font-medium">Guest</th>
                      <th className="text-left pb-3 font-medium hidden sm:table-cell">Check-in</th>
                      <th className="text-left pb-3 font-medium hidden md:table-cell">Check-out</th>
                      <th className="text-left pb-3 font-medium hidden lg:table-cell">Channel</th>
                      <th className="text-left pb-3 font-medium">Status</th>
                      <th className="text-right pb-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {d.recentResvs.map((r, i) => {
                      const badge = statusBadge(r.status)
                      return (
                        <tr key={r.reservationID ?? i} className="text-slate-300 hover:bg-slate-700/20 transition-colors">
                          <td className="py-3 font-medium text-white">{r.guestName || '—'}</td>
                          <td className="py-3 text-slate-400 hidden sm:table-cell font-mono text-xs">{r.checkIn || '—'}</td>
                          <td className="py-3 text-slate-400 hidden md:table-cell font-mono text-xs">{r.checkOut || '—'}</td>
                          <td className="py-3 text-slate-400 hidden lg:table-cell">{r.sourceName || 'Direct'}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3 text-right font-mono font-medium text-white">
                            {formatCurrency(parseFloat(r.total ?? '0') || 0)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-600">
                      <td colSpan={5} className="pt-3 text-slate-400 text-xs">
                        Showing {d.recentResvs.length} of {d.reservationsMTD} reservations MTD
                      </td>
                      <td className="pt-3 text-right font-mono font-bold text-white">
                        {formatCurrency(d.revenueMTD)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
