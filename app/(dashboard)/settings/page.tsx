export default async function SettingsPage() {
  const hasApiKey   = !!process.env.CLOUDBEDS_API_KEY
  const hasBotToken = !!process.env.TELEGRAM_BOT_TOKEN
  const siteUrl     = process.env.NEXT_PUBLIC_SITE_URL ?? ''

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Dashboard configuration</p>
      </div>

      {/* Cloudbeds */}
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
            <p className="text-xs text-slate-600 mt-1">To update, replace CLOUDBEDS_API_KEY in Vercel and redeploy.</p>
          </div>
        )}
      </div>

      {/* Telegram Bot */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🤖</span>
          <h2 className="text-white font-semibold">Telegram Bot</h2>
          {hasBotToken ? (
            <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
              Token set
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">
              Not configured
            </span>
          )}
        </div>

        {hasBotToken ? (
          <>
            <p className="text-slate-400 text-sm mb-3">
              Bot token is configured. Register the webhook to start receiving messages.
            </p>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 mb-3">
              <p className="text-xs text-slate-500 mb-1 font-medium">Webhook URL</p>
              <p className="text-xs text-slate-400 font-mono break-all">{siteUrl}/api/telegram/webhook</p>
            </div>
            <p className="text-slate-500 text-xs mb-3">
              Visit the setup endpoint once after deployment to register the webhook with Telegram:
            </p>
            <a
              href="/api/telegram/setup"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg transition-colors"
            >
              Register Webhook
            </a>
          </>
        ) : (
          <>
            <p className="text-slate-400 text-sm mb-3">
              Set up a Telegram bot to query hotel stats by message. Commands: /stats, /occupancy, /revenue, /channels.
            </p>
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-700 text-xs space-y-2 text-slate-400">
              <p className="text-slate-300 font-medium">Setup steps:</p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Message <span className="text-violet-400 font-mono">@BotFather</span> on Telegram and run <span className="font-mono">/newbot</span></li>
                <li>Copy the token and add it to Vercel as <span className="font-mono text-slate-300">TELEGRAM_BOT_TOKEN</span></li>
                <li>Optionally set <span className="font-mono text-slate-300">TELEGRAM_WEBHOOK_SECRET</span> to a random string</li>
                <li>Redeploy, then visit <span className="font-mono text-violet-400">/api/telegram/setup</span> once to register the webhook</li>
              </ol>
            </div>
          </>
        )}
      </div>

      {/* Dashboard password */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🔐</span>
          <h2 className="text-white font-semibold">Dashboard Password</h2>
        </div>
        <p className="text-slate-400 text-sm">
          Change the login password by updating <span className="font-mono text-slate-300">DASHBOARD_PASSWORD</span> in Vercel environment variables and redeploying.
        </p>
      </div>
    </div>
  )
}
