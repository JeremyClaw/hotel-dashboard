import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getDashboard, getReservations } from '@/lib/cloudbeds'
import { resvTotal } from '@/lib/utils'
import { format, eachDayOfInterval, parseISO } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const TZ = 'Africa/Johannesburg'
const todayStr = () => format(toZonedTime(new Date(), TZ), 'yyyy-MM-dd')

// ── Cloudbeds data aggregator ─────────────────────────────────────────────────

type DashDay = {
  percentageOccupied?: number
  roomsOccupied?: number
  capacity?: number
  arrivals?: string
  departures?: string
  cancellations?: number
}

type Resv = {
  balance?: string | number
  grandTotal?: string | number
  total?: string | number
  sourceName?: string
  status?: string
}

async function fetchRangeStats(startDate: string, endDate: string) {
  const days = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) })
    .map(d => format(d, 'yyyy-MM-dd'))

  // Cap dashboard fetches at 31 days to avoid too many API calls
  const fetchDash = days.length <= 31

  const [dashResults, rawResvs] = await Promise.all([
    fetchDash
      ? Promise.allSettled(days.map(d => getDashboard(d)))
      : Promise.resolve([]),
    getReservations({ checkInFrom: startDate, checkInTo: endDate, pageSize: '500' })
      .catch(() => []),
  ])

  const resvArr: Resv[] = Array.isArray(rawResvs) ? rawResvs : []

  // Daily occupancy from dashboard
  const dailyOccupancy = fetchDash
    ? days.map((date, i) => {
        const r = dashResults[i]
        const d = r.status === 'fulfilled' ? (r.value as DashDay) : null
        return {
          date,
          occupancy: d?.percentageOccupied ?? null,
          roomsOccupied: d?.roomsOccupied ?? null,
          arrivals: parseInt(d?.arrivals ?? '0') || 0,
          departures: parseInt(d?.departures ?? '0') || 0,
        }
      })
    : []

  const validOcc = dailyOccupancy.filter(d => d.occupancy !== null)
  const avgOccupancy = validOcc.length > 0
    ? validOcc.reduce((s, d) => s + (d.occupancy ?? 0), 0) / validOcc.length
    : null

  const capacity = (() => {
    const r = fetchDash && dashResults[0]?.status === 'fulfilled'
      ? (dashResults[0].value as DashDay)?.capacity
      : undefined
    return r ?? 38
  })()

  // Revenue from reservations
  const totalRevenue = resvArr.reduce((s, r) => s + resvTotal(r), 0)
  const adr = resvArr.length > 0 ? totalRevenue / resvArr.length : 0
  const revpar = avgOccupancy !== null ? adr * avgOccupancy / 100 : null

  // Channel breakdown
  const channelMap: Record<string, { count: number; revenue: number }> = {}
  resvArr.forEach(r => {
    const ch = r.sourceName || 'Direct'
    if (!channelMap[ch]) channelMap[ch] = { count: 0, revenue: 0 }
    channelMap[ch].count++
    channelMap[ch].revenue += resvTotal(r)
  })
  const channels = Object.entries(channelMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([name, d]) => ({ name, bookings: d.count, revenue: Math.round(d.revenue) }))

  const totalArrivals = dailyOccupancy.reduce((s, d) => s + d.arrivals, 0)

  return {
    period: `${startDate} to ${endDate}`,
    days: days.length,
    capacity,
    occupancy: avgOccupancy !== null ? Math.round(avgOccupancy * 10) / 10 : null,
    roomsData: fetchDash ? dailyOccupancy.map(d => ({
      date: d.date,
      occupancyPct: d.occupancy,
      roomsOccupied: d.roomsOccupied,
    })) : 'Period too long for daily breakdown — use a shorter range',
    revenue: {
      total: Math.round(totalRevenue),
      adr: Math.round(adr),
      revpar: revpar !== null ? Math.round(revpar) : null,
    },
    reservations: resvArr.length,
    arrivals: totalArrivals,
    channels,
    note: 'Revenue is based on outstanding balances per reservation. Fully settled reservations may show R0 and be undercounted.',
  }
}

// ── Tool definition ───────────────────────────────────────────────────────────

const tools: Anthropic.Tool[] = [
  {
    name: 'get_stats',
    description: 'Fetch hotel statistics (occupancy, revenue, ADR, RevPAR, arrivals, channel breakdown) for a specific date range. Call this once per period you need data for. For week-over-week or month-over-month comparisons, call it twice.',
    input_schema: {
      type: 'object' as const,
      properties: {
        start_date: {
          type: 'string',
          description: 'Start of the period in YYYY-MM-DD format',
        },
        end_date: {
          type: 'string',
          description: 'End of the period in YYYY-MM-DD format',
        },
        label: {
          type: 'string',
          description: 'Human-readable label for this period, e.g. "this week", "last week", "this month"',
        },
      },
      required: ['start_date', 'end_date'],
    },
  },
]

// ── API handler ───────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

function buildSystemPrompt() {
  const today = todayStr()
  const now = new Date()
  const dayOfWeek = now.toLocaleDateString('en-ZA', { weekday: 'long', timeZone: TZ })

  return `You are a hotel analytics assistant for Fools Inn, a 38-room property in Cape Town, South Africa.

Today is ${dayOfWeek}, ${today}. All dates and times are SAST (UTC+2).
Currency is South African Rand — always format amounts as R1,234 (R prefix, comma thousands separator, no decimals unless cents matter).

Always use the get_stats tool to fetch data before answering. For comparisons, call the tool twice — once per period.

Date period conventions:
- "today" = ${today}
- "yesterday" = one day before today
- "this week" = Monday of the current week through today
- "last week" = the full Monday–Sunday week before this one
- "this month" = 1st of current month through today
- "last month" = 1st through last day of the previous calendar month
- "last 7 days" / "past week" = 7 days ending today (inclusive)
- "last 30 days" = 30 days ending today

Answer style:
- Be concise and specific
- Use line breaks and bullet points for readability
- Lead with the headline number, then supporting detail
- For comparisons, show the change (↑ / ↓) and percentage difference
- If data looks like it might be incomplete (e.g. revenue undercounted for settled bookings), briefly note it
- Do not make up numbers — only use what the tool returns`
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured. Add it to Vercel environment variables.' }, { status: 503 })
  }

  let body: { question: string; history?: ChatMessage[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { question, history = [] } = body
  if (!question?.trim()) {
    return NextResponse.json({ error: 'No question provided' }, { status: 400 })
  }

  const client = new Anthropic({ apiKey })

  // Build message history for Anthropic
  const messages: Anthropic.MessageParam[] = [
    ...history.map(m => ({ role: m.role, content: m.content } as Anthropic.MessageParam)),
    { role: 'user', content: question },
  ]

  try {
    let iterations = 0
    const MAX_ITERATIONS = 5

    while (iterations < MAX_ITERATIONS) {
      iterations++

      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: buildSystemPrompt(),
        tools,
        messages,
      })

      if (response.stop_reason === 'end_turn') {
        const text = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map(b => b.text)
          .join('')
        return NextResponse.json({ answer: text })
      }

      if (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
        )

        // Execute all tool calls in parallel
        const toolResults = await Promise.all(
          toolUseBlocks.map(async (block) => {
            try {
              const input = block.input as { start_date: string; end_date: string; label?: string }
              const result = await fetchRangeStats(input.start_date, input.end_date)
              return {
                type: 'tool_result' as const,
                tool_use_id: block.id,
                content: JSON.stringify({ label: input.label, ...result }),
              }
            } catch (err) {
              return {
                type: 'tool_result' as const,
                tool_use_id: block.id,
                content: `Error fetching data: ${err instanceof Error ? err.message : String(err)}`,
                is_error: true,
              }
            }
          })
        )

        // Add assistant response + tool results to message history
        messages.push({ role: 'assistant', content: response.content })
        messages.push({ role: 'user', content: toolResults })
        continue
      }

      // Unexpected stop reason
      break
    }

    return NextResponse.json({ error: 'Could not generate a response. Try rephrasing your question.' }, { status: 500 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
