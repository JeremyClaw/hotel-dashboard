import { getDashboard, getProperty } from '@/lib/cloudbeds'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const TZ = 'Africa/Johannesburg'
const tod = () => format(toZonedTime(new Date(), TZ), 'yyyy-MM-dd')

type Property = {
  propertyID?: string
  propertyName?: string
  propertyAddress?: string
  propertyCity?: string
  propertyCountry?: string
  propertyPhone?: string
  propertyEmail?: string
  propertyWebsite?: string
  propertyTimezone?: string
  propertyLogo?: string
  propertyType?: string
  currencyCode?: string
}

type Dash = {
  percentageOccupied?: number
  roomsOccupied?: number
  capacity?: number
  inHouse?: number
  guestsInHouse?: number
}

async function getPropertyData() {
  const [property, dashboard] = await Promise.all([
    getProperty(),
    getDashboard(tod()),
  ])
  return {
    property: property as Property,
    dashboard: dashboard as Dash,
  }
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-700/50 last:border-0">
      <span className="text-slate-500 text-xs uppercase tracking-wide font-medium w-28 pt-0.5 flex-shrink-0">
        {label}
      </span>
      <span className="text-slate-200 text-sm">{value}</span>
    </div>
  )
}

export default async function PropertiesPage() {
  let d: Awaited<ReturnType<typeof getPropertyData>> | null = null
  let errorMsg = ''

  try {
    d = await getPropertyData()
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err)
  }

  const hasApiKey = !!process.env.CLOUDBEDS_API_KEY

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Properties</h1>
        <p className="text-slate-400 text-sm mt-1">Cloudbeds property details and connection status</p>
      </div>

      <div className="mb-4 rounded-xl p-4 border flex items-center gap-3
        bg-slate-800/50 border-slate-700/50">
        <div className={`w-2.5 h-2.5 rounded-full ${hasApiKey && !errorMsg ? 'bg-emerald-500' : 'bg-red-500'}`} />
        <div>
          <p className="text-sm font-medium text-white">
            Cloudbeds — {hasApiKey && !errorMsg ? 'Connected' : errorMsg ? 'Error' : 'No API key'}
          </p>
          {errorMsg ? (
            <p className="text-xs text-red-400 mt-0.5 font-mono">{errorMsg}</p>
          ) : (
            <p className="text-xs text-slate-500 mt-0.5">API key is set · Live data</p>
          )}
        </div>
      </div>

      {d && (
        <>
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5 mb-4">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-3xl">🏨</span>
              <div>
                <h2 className="text-white font-bold text-lg">
                  {d.property.propertyName || 'Fools Inn'}
                </h2>
                {d.property.propertyCity && (
                  <p className="text-slate-400 text-sm">
                    {d.property.propertyCity}{d.property.propertyCountry ? `, ${d.property.propertyCountry}` : ''}
                  </p>
                )}
              </div>
            </div>

            <InfoRow label="Property ID"  value={d.property.propertyID} />
            <InfoRow label="Type"         value={d.property.propertyType} />
            <InfoRow label="Address"      value={d.property.propertyAddress} />
            <InfoRow label="Timezone"     value={d.property.propertyTimezone} />
            <InfoRow label="Currency"     value={d.property.currencyCode} />
            <InfoRow label="Phone"        value={d.property.propertyPhone} />
            <InfoRow label="Email"        value={d.property.propertyEmail} />
            {d.property.propertyWebsite && (
              <div className="flex items-start gap-3 py-3">
                <span className="text-slate-500 text-xs uppercase tracking-wide font-medium w-28 pt-0.5 flex-shrink-0">
                  Website
                </span>
                <a
                  href={d.property.propertyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:text-violet-300 text-sm transition-colors"
                >
                  {d.property.propertyWebsite}
                </a>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
            <h2 className="text-white font-semibold text-sm mb-4">Live Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Occupancy', value: `${d.dashboard.percentageOccupied?.toFixed(1) ?? '—'}%` },
                { label: 'Rooms Occupied', value: `${d.dashboard.roomsOccupied ?? '—'} / ${d.dashboard.capacity ?? 38}` },
                { label: 'In House', value: String(d.dashboard.inHouse ?? '—') },
                { label: 'Guests', value: String(d.dashboard.guestsInHouse ?? '—') },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-900/50 rounded-lg p-4">
                  <p className="text-slate-500 text-xs uppercase tracking-wide font-medium mb-1">{label}</p>
                  <p className="text-white font-bold text-xl font-mono">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!d && !errorMsg && (
        <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 p-12 flex items-center justify-center">
          <div className="text-center">
            <p className="text-3xl mb-3">🏨</p>
            <p className="text-slate-300 font-medium">No property data</p>
            <p className="text-slate-500 text-sm mt-1">Set CLOUDBEDS_API_KEY in Vercel to connect</p>
          </div>
        </div>
      )}
    </div>
  )
}
