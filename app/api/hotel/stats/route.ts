import { NextResponse } from 'next/server'
import { getDashboard, getReservations } from '@/lib/cloudbeds'
import { resvTotal } from '@/lib/utils'
import { format, subDays, startOfMonth } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const TZ = 'Africa/Johannesburg'

function today() {
  return format(toZonedTime(new Date(), TZ), 'yyyy-MM-dd')
}
function yesterday() {
  return format(toZonedTime(subDays(new Date(), 1), TZ), 'yyyy-MM-dd')
}
function mtdStart() {
  return format(toZonedTime(startOfMonth(new Date()), TZ), 'yyyy-MM-dd')
}

async function getOverviewStats() {
  const [dashToday, dashYesterday, resvToday, resvMTD] = await Promise.all([
    getDashboard(today()),
    getDashboard(yesterday()),
    getReservations({ checkInFrom: today(), checkInTo: today(), pageSize: '100' }),
    getReservations({ checkInFrom: mtdStart(), checkInTo: today(), pageSize: '200' }),
  ])

  type Resv = { grandTotal?: string | number; total?: string | number; sourceName?: string }
  const resvTodayArr: Resv[] = Array.isArray(resvToday) ? resvToday : []
  const resvMTDArr: Resv[]   = Array.isArray(resvMTD)   ? resvMTD   : []

  const revenueToday = resvTodayArr.reduce((sum, r) => sum + resvTotal(r), 0)
  const revenueMTD   = resvMTDArr.reduce((sum, r) => sum + resvTotal(r), 0)

  const roomsSoldMTD = resvMTDArr.length
  const adr          = roomsSoldMTD > 0 ? revenueMTD / roomsSoldMTD : 0
  const capacity     = (dashToday as { capacity?: number })?.capacity || 38
  const occupancy    = (dashToday as { percentageOccupied?: number })?.percentageOccupied || 0
  const revpar       = adr * occupancy / 100

  // Channel breakdown from MTD reservations
  const channelMap: Record<string, { count: number; revenue: number }> = {}
  resvMTDArr.forEach((r) => {
    const ch = r.sourceName || 'Direct'
    if (!channelMap[ch]) channelMap[ch] = { count: 0, revenue: 0 }
    channelMap[ch].count++
    channelMap[ch].revenue += resvTotal(r)
  })
  const channels = Object.entries(channelMap)
    .map(([name, d]) => ({ name, count: d.count, revenue: d.revenue }))
    .sort((a, b) => b.revenue - a.revenue)

  // Temporary debug — remove after confirming field names
  const _firstResv = resvMTDArr[0] as Record<string, unknown> | undefined
  const _debug = _firstResv ? {
    keys: Object.keys(_firstResv),
    revCandidates: {
      total:        _firstResv['total'],
      grandTotal:   _firstResv['grandTotal'],
      balance:      _firstResv['balance'],
      subTotal:     _firstResv['subTotal'],
      amount:       _firstResv['amount'],
      roomRevenue:  _firstResv['roomRevenue'],
    },
  } : { keys: [], revCandidates: {}, note: 'no reservations returned' }

  return {
    today: today(),
    occupancyToday:     occupancy,
    occupancyYesterday: (dashYesterday as { percentageOccupied?: number })?.percentageOccupied || 0,
    roomsOccupied:      (dashToday as { roomsOccupied?: number })?.roomsOccupied || 0,
    capacity,
    arrivalsToday:      parseInt((dashToday as { arrivals?: string })?.arrivals ?? '0') || 0,
    departuresToday:    parseInt((dashToday as { departures?: string })?.departures ?? '0') || 0,
    inHouse:            (dashToday as { inHouse?: number })?.inHouse || 0,
    guestsInHouse:      (dashToday as { guestsInHouse?: number })?.guestsInHouse || 0,
    cancellationsToday: (dashToday as { cancellations?: number })?.cancellations || 0,
    revenueToday,
    revenueMTD,
    adr,
    revpar,
    channels,
    _debug,
  }
}

export async function GET() {
  try {
    const stats = await getOverviewStats()
    return NextResponse.json(stats)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Stats API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
