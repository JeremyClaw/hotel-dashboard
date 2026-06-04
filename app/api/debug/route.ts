import { NextResponse } from 'next/server'
import { getReservations, getDashboard } from '@/lib/cloudbeds'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const TZ = 'Africa/Johannesburg'
const tod = () => format(toZonedTime(new Date(), TZ), 'yyyy-MM-dd')

export async function GET() {
  try {
    const [rawResvs, rawDash] = await Promise.all([
      getReservations({ checkInFrom: tod(), checkInTo: tod(), pageSize: '5' }),
      getDashboard(tod()),
    ])

    // Return first reservation with ALL fields so we can see what's available
    const arr = Array.isArray(rawResvs) ? rawResvs : []
    const sample = arr[0] ?? null

    return NextResponse.json({
      todayDate: tod(),
      reservationCount: arr.length,
      sampleReservationAllFields: sample,
      allReservationKeys: sample ? Object.keys(sample) : [],
      dashboardKeys: rawDash ? Object.keys(rawDash as object) : [],
      rawDashboard: rawDash,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
