export default async function SettingsPage() {
  const hasApiKey = !!process.env.CLOUDBEDS_API_KEY

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Dashboard configuration</p>
      </div>

      {/* Cloudbeds connection */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">☁️</span>
          <h2 className="text-white font-semibold">Cloudbeds</h2>
          {hasApiKey ? (
            <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
              Connected
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
              No API key
            </span>
          )}
        </div>
        <p className="text-slate-400 text-sm">
          {hasApiKey
            ? 'API key is set. Dashboard is pulling live data from Cloudbeds.'
            : 'Set CLOUDBEDS_API_KEY in Vercel environment variables to connect.'}
        </p>
        {hasApiKey && (
          <div className="mt-3 p-3 rounded-lg bg-slate-900 border border-slate-700">
            <p className="text-xs text-slate-500 font-mono">Property: Fools Inn (133956142043362)</p>
            <p className="text-xs text-slate-600 mt-1">To update the API key, replace CLOUDBEDS_API_KEY in Vercel and redeploy.</p>
          </div>
        )}
      </div>

      {/* Dashboard password */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🔐</span>
          <h2 className="text-white font-semibold">Dashboard Password</h2>
        </div>
        <p className="text-slate-400 text-sm">
          Change the dashboard login password by updating DASHBOARD_PASSWORD in Vercel environment variables and redeploying.
        </p>
      </div>
    </div>
  )
}
