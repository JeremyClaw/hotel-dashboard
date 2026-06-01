import { cookies } from 'next/headers'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>
}) {
  const params = await searchParams
  const cookieStore = await cookies()
  const hasCloudbedsToken = !!cookieStore.get('cb_access_token')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your dashboard connections</p>
      </div>

      {/* Success/Error banners */}
      {params.connected && (
        <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <p className="text-emerald-300 font-medium text-sm">✓ Cloudbeds connected successfully</p>
          <p className="text-emerald-400/70 text-xs mt-0.5">Your hotel data will now appear in the dashboard</p>
        </div>
      )}
      {params.error && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <p className="text-red-300 font-medium text-sm">Cloudbeds connection failed</p>
          <p className="text-red-400/70 text-xs mt-0.5">Please try again or contact support</p>
        </div>
      )}

      {/* Cloudbeds connection card */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">☁️</span>
              <h2 className="text-white font-semibold">Cloudbeds</h2>
              {hasCloudbedsToken ? (
                <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">Connected</span>
              ) : (
                <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-400 rounded-full">Not connected</span>
              )}
            </div>
            <p className="text-slate-400 text-sm">
              {hasCloudbedsToken
                ? "Your hotel data is syncing from Cloudbeds. All dashboard stats reflect live data."
                : "Connect your Cloudbeds account to pull real hotel stats into this dashboard."}
            </p>
          </div>
          <a
            href="/api/auth/cloudbeds/connect"
            className={`ml-4 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              hasCloudbedsToken
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                : 'bg-violet-600 hover:bg-violet-700 text-white'
            }`}
          >
            {hasCloudbedsToken ? 'Reconnect' : 'Connect Cloudbeds'}
          </a>
        </div>
      </div>

      {/* Telegram section */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">✈️</span>
          <h2 className="text-white font-semibold">Telegram Bot</h2>
          <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-400 rounded-full">Setup required</span>
        </div>
        <p className="text-slate-400 text-sm">
          The Telegram bot lets you ask hotel performance questions from your phone.
          Add your Telegram user ID to the allowlist to enable access.
        </p>
        <div className="mt-3 p-3 rounded-lg bg-slate-900 border border-slate-700">
          <p className="text-xs text-slate-500 font-mono">ALLOWED_TELEGRAM_USER_IDS=your_id_here</p>
          <p className="text-xs text-slate-600 mt-1">Set this in your Vercel environment variables</p>
        </div>
      </div>
    </div>
  )
}
