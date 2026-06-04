import { NextRequest, NextResponse } from 'next/server'
import { getDashboard, getReservations } from '@/lib/cloudbeds'
import { formatCurrency, formatPercent, resvTotal } from '@/lib/utils'
import { format, subDays, startOfMonth } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const TZ = 'Africa/Johannesburg'
const tod  = () => format(toZonedTime(new Date(), TZ), 'yyyy-MM-dd')
const yest = () => format(toZonedTime(subDays(new Date(), 1), TZ), 'yyyy-MM-dd')
const mtd  = () => format(toZonedTime(startOfMonth(new Date()), TZ), 'yyyy-MM-dd')

const BOT_TOKEN      = process.env.TELEGRAM_BOT_TOKEN
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET
const SITE_URL       = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hotel-dashboard-gamma-self.vercel.app'

type Dash = {
  percentageOccupied?: number
  roomsOccupied?: number
  capacity?: number
  arrivals?: string
  departures?: string
  inHouse?: number
  guestsInHouse?: number
}
type Resv = { balance?: string | number; grandTotal?: string | number; total?: string | number; sourceName?: string }

async function sendMessage(chatId: number, text: string) {
  if (!BOT_TOKEN) return
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

async function fetchOverview() {
  const [dashToday, dashYest, resvMTD] = await Promise.all([
    getDashboard(tod()),
    getDashboard(yest()),
    getReservations({ checkInFrom: mtd(), checkInTo: tod(), pageSize: '200' }),
  ])

  const dt = dashToday as Dash
  const dy = dashYest as Dash
  const arr: Resv[] = Array.isArray(resvMTD) ? resvMTD : []

  const revenueMTD = arr.reduce((s, r) => s + (resvTotal(r)), 0)
  const adr        = arr.length > 0 ? revenueMTD / arr.length : 0
  const occupancy  = dt.percentageOccupied || 0
  const revpar     = adr * occupancy / 100
  const occYest    = dy.percentageOccupied || 0
  const occChange  = +(occupancy - occYest).toFixed(1)

  const channelMap: Record<string, { count: number; revenue: number }> = {}
  arr.forEach(r => {
    const ch = r.sourceName || 'Direct'
    if (!channelMap[ch]) channelMap[ch] = { count: 0, revenue: 0 }
    channelMap[ch].count++
    channelMap[ch].revenue += resvTotal(r)
  })

  const channels = Object.entries(channelMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)

  return { dt, dy, revenueMTD, adr, revpar, occupancy, occYest, occChange, channels, resvCount: arr.length }
}

function overviewMessage(s: Awaited<ReturnType<typeof fetchOverview>>) {
  const { dt, revenueMTD, adr, revpar, occupancy, occYest, occChange, channels } = s

  const date = new Date().toLocaleDateString('en-ZA', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ,
  })
  const occArrow  = occChange > 0 ? '↑' : occChange < 0 ? '↓' : '→'
  const occDir    = occChange !== 0 ? ` ${occArrow}${Math.abs(occChange)}%` : ''

  const channelLines = channels.length > 0
    ? channels.map(([name, d]) => `  · ${name}: ${d.count} · ${formatCurrency(d.revenue)}`).join('\n')
    : '  No data yet'

  return `🏨 <b>Fools Inn</b> — ${date}

📊 <b>Occupancy</b>
Tonight: <b>${formatPercent(occupancy)}</b>${occDir}
Rooms: ${dt.roomsOccupied ?? '—'}/${dt.capacity ?? 38} · Guests: ${dt.guestsInHouse ?? '—'}
Arrivals: ${dt.arrivals ?? '—'} · Departures: ${dt.departures ?? '—'}
Yesterday: ${formatPercent(occYest)}

💰 <b>Revenue MTD</b>
Total: <b>${formatCurrency(revenueMTD)}</b> (${s.resvCount} reservations)
ADR: ${formatCurrency(adr)} · RevPAR: ${formatCurrency(revpar)}

📡 <b>Top Channels</b>
${channelLines}

🔗 <a href="${SITE_URL}">Open dashboard</a>`
}

export async function POST(req: NextRequest) {
  if (WEBHOOK_SECRET) {
    const header = req.headers.get('x-telegram-bot-api-secret-token')
    if (header !== WEBHOOK_SECRET) {
      return NextResponse.json({ ok: false }, { status: 403 })
    }
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  const message = (body.message ?? body.channel_post) as Record<string, unknown> | undefined
  if (!message) return NextResponse.json({ ok: true })

  const chatId = (message.chat as Record<string, unknown>)?.id as number | undefined
  const text   = ((message.text as string) ?? '').trim()

  if (!chatId || !text.startsWith('/')) return NextResponse.json({ ok: true })

  const command = text.split(/[\s@]/)[0].toLowerCase()

  try {
    switch (command) {
      case '/start':
      case '/stats': {
        await sendMessage(chatId, 'Fetching live data...')
        const stats = await fetchOverview()
        await sendMessage(chatId, overviewMessage(stats))
        break
      }

      case '/occupancy': {
        const [dt, dy] = await Promise.all([
          getDashboard(tod()).then(d => d as Dash),
          getDashboard(yest()).then(d => d as Dash),
        ])
        const occ      = dt.percentageOccupied || 0
        const occY     = dy.percentageOccupied || 0
        const change   = +(occ - occY).toFixed(1)
        const arrow    = change > 0 ? '↑' : change < 0 ? '↓' : '→'
        await sendMessage(chatId, `🏨 <b>Occupancy — Fools Inn</b>

Tonight: <b>${formatPercent(occ)}</b> ${arrow}${Math.abs(change)}% vs yesterday
Rooms: ${dt.roomsOccupied ?? '—'}/${dt.capacity ?? 38}
Guests in house: ${dt.guestsInHouse ?? '—'}
Arrivals: ${dt.arrivals ?? '—'} · Departures: ${dt.departures ?? '—'}
Yesterday: ${formatPercent(occY)}`)
        break
      }

      case '/revenue': {
        const [dt, resvMTD] = await Promise.all([
          getDashboard(tod()).then(d => d as Dash),
          getReservations({ checkInFrom: mtd(), checkInTo: tod(), pageSize: '200' }),
        ])
        const arr: Resv[] = Array.isArray(resvMTD) ? resvMTD : []
        const total  = arr.reduce((s, r) => s + (resvTotal(r)), 0)
        const adr    = arr.length > 0 ? total / arr.length : 0
        const revpar = adr * (dt.percentageOccupied || 0) / 100
        await sendMessage(chatId, `💰 <b>Revenue MTD — Fools Inn</b>

Total: <b>${formatCurrency(total)}</b>
Reservations: ${arr.length}
ADR: ${formatCurrency(adr)}
RevPAR: ${formatCurrency(revpar)}`)
        break
      }

      case '/channels': {
        const resvMTD = await getReservations({ checkInFrom: mtd(), checkInTo: tod(), pageSize: '200' })
        const arr: Resv[] = Array.isArray(resvMTD) ? resvMTD : []
        const channelMap: Record<string, { count: number; revenue: number }> = {}
        arr.forEach(r => {
          const ch = r.sourceName || 'Direct'
          if (!channelMap[ch]) channelMap[ch] = { count: 0, revenue: 0 }
          channelMap[ch].count++
          channelMap[ch].revenue += resvTotal(r)
        })
        const lines = Object.entries(channelMap)
          .sort((a, b) => b[1].revenue - a[1].revenue)
          .map(([name, d]) => `${name}: ${d.count} bookings · ${formatCurrency(d.revenue)}`)
          .join('\n')
        await sendMessage(chatId, `📡 <b>Channels MTD — Fools Inn</b>\n\n${lines || 'No data yet'}`)
        break
      }

      case '/help': {
        await sendMessage(chatId, `🏨 <b>Fools Inn Bot</b>

Commands:
/stats — Full overview
/occupancy — Tonight's occupancy
/revenue — MTD revenue, ADR, RevPAR
/channels — Booking channel breakdown
/help — This message

<a href="${SITE_URL}">Open dashboard</a>`)
        break
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await sendMessage(chatId, `Could not fetch data: ${msg}`)
  }

  return NextResponse.json({ ok: true })
}
