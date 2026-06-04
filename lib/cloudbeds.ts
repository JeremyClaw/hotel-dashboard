/**
 * Cloudbeds API Client
 * API key authentication — Bearer token in Authorization header
 */

const CLOUDBEDS_API_URL = 'https://hotels.cloudbeds.com/api/v1.2'

export const PROPERTY_ID = '133956142043362'

function apiKey() {
  return process.env.CLOUDBEDS_API_KEY!
}

export async function cloudbedsGet(endpoint: string, params?: Record<string, string>) {
  const url = new URL(`${CLOUDBEDS_API_URL}${endpoint}`)
  url.searchParams.set('propertyID', PROPERTY_ID)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey()}` },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Cloudbeds API error ${res.status}: ${text}`)
  }

  const json = await res.json()
  if (!json.success) throw new Error(`Cloudbeds error: ${JSON.stringify(json)}`)
  return json.data
}

// ── Endpoints ────────────────────────────────────────────────────────────────

export async function getProperty() {
  const data = await cloudbedsGet('/getHotels')
  return Array.isArray(data) ? data[0] : data
}

export async function getDashboard(date: string) {
  return cloudbedsGet('/getDashboard', { dateStart: date, dateEnd: date })
}

export async function getReservations(params: {
  checkInFrom?: string
  checkInTo?: string
  checkOutFrom?: string
  checkOutTo?: string
  status?: string
  pageSize?: string
  pageNumber?: string
}) {
  return cloudbedsGet('/getReservations', params as Record<string, string>)
}

export async function getReservationDetail(reservationID: string) {
  const res = await fetch(
    `${CLOUDBEDS_API_URL}/getReservation?propertyID=${PROPERTY_ID}&reservationID=${reservationID}`,
    { headers: { Authorization: `Bearer ${apiKey()}` }, next: { revalidate: 0 } }
  )
  const json = await res.json()
  return json.data
}
