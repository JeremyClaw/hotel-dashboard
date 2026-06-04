import { NextResponse } from 'next/server'
import { getReservations, getDashboard } from '@/lib/cloudbeds'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const TZ = 'Africa/Johannesburg'
const tod = () => format(toZonedTime(new Date(), TZ), 'yyyy-MM-dd')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pick(obj: any, keys: string[]) {
  if (!obj) return {}
  return Object.fromEntries(keys.map(k => [k, obj[k]]))
}

export async function GET() {
  try {
    const [rawResvs, rawDash] = await Promise.all([
      getReservations({ checkInFrom: '2026-06-01', checkInTo: tod(), pageSize: '5' }),
      getDashboard(tod()),
    ])

    const arr = Array.isArray(rawResvs) ? rawResvs : []
    const sample = arr[0] ?? null

    return NextResponse.json({
      todayDate: tod(),
      reservationCount: arr.length,
      // These are the candidate revenue field names — one of these should be non-zero
      revenueCandidates: sample ? pick(sample, ['total', 'grandTotal', 'balance', 'subTotal', 'totalRevenue', 'amount']) : null,
      allReservationKeys: sample ? Object.keys(sample as object) : [],
      sampleReservation: sample,
      dashboardKeys: rawDash ? Object.keys(rawDash as object) : [],
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
