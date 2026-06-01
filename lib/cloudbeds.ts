/**
 * Cloudbeds API Client
 * OAuth 2.0 authentication + data fetching
 */

const CLOUDBEDS_AUTH_URL = 'https://hotels.cloudbeds.com/api/v1.2/oauth'
const CLOUDBEDS_API_URL = 'https://hotels.cloudbeds.com/api/v1.2'

export function getOAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.CLOUDBEDS_CLIENT_ID!,
    redirect_uri: process.env.CLOUDBEDS_REDIRECT_URI!,
    response_type: 'code',
    scope: 'read:hotel read:reservations read:guests read:housekeeping read:revenue',
  })
  return `${CLOUDBEDS_AUTH_URL}/authorize?${params}`
}

export async function exchangeCodeForToken(code: string) {
  const res = await fetch(`${CLOUDBEDS_AUTH_URL}/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.CLOUDBEDS_CLIENT_ID!,
      client_secret: process.env.CLOUDBEDS_CLIENT_SECRET!,
      redirect_uri: process.env.CLOUDBEDS_REDIRECT_URI!,
      code,
    }),
  })
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`)
  return res.json()
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(`${CLOUDBEDS_AUTH_URL}/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.CLOUDBEDS_CLIENT_ID!,
      client_secret: process.env.CLOUDBEDS_CLIENT_SECRET!,
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`)
  return res.json()
}

export async function cloudbedsGet(endpoint: string, accessToken: string) {
  const res = await fetch(`${CLOUDBEDS_API_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Cloudbeds API error ${res.status}: ${text}`)
  }
  return res.json()
}

// ── Data fetching helpers ─────────────────────────────────────────────────

export async function getProperties(accessToken: string) {
  return cloudbedsGet('/getHotels', accessToken)
}

export async function getReservations(
  accessToken: string,
  params: {
    propertyID?: string
    checkInFrom?: string
    checkInTo?: string
    checkOutFrom?: string
    checkOutTo?: string
    status?: string
    pageSize?: number
    pageNumber?: number
  }
) {
  const query = new URLSearchParams(params as Record<string, string>)
  return cloudbedsGet(`/getReservations?${query}`, accessToken)
}

export async function getDashboardStats(
  accessToken: string,
  propertyID: string,
  dateStart: string,
  dateEnd: string
) {
  const query = new URLSearchParams({ propertyID, dateStart, dateEnd })
  return cloudbedsGet(`/getDashboard?${query}`, accessToken)
}
