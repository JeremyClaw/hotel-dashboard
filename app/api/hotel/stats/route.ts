import { NextResponse } from 'next/server'
import { getDashboard, getReservations } from '@/lib/cloudbeds'
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

  // Revenue: sum balanceDetailed.grandTotal from reservations
  type Resv = { total?: string; sourceName?: string }
  const resvTodayArr: Resv[] = Array.isArray(resvToday) ? resvToday : []
  const resvMTDArr: Resv[]   = Array.isArray(resvMTD)   ? resvMTD   : []

  const revenueToday = resvTodayArr.reduce((sum, r) => sum + (parseFloat(r.total ?? '0') || 0), 0)
  const revenueMTD   = resvMTDArr.reduce((sum, r) => sum + (parseFloat(r.total ?? '0') || 0), 0)

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
    channelMap[ch].revenue += parseFloat(r.total ?? '0') || 0
  })
  const channels = Object.entries(channelMap)
    .map(([name, d]) => ({ name, count: d.count, revenue: d.revenue }))
    .sort((a, b) => b.revenue - a.revenue)

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
