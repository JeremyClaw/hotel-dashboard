export default function Page() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Loading...</h1>
        <p className="text-slate-400 text-sm mt-1">Connect Cloudbeds to see live data</p>
      </div>
      <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 p-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-3xl mb-3">📊</p>
          <p className="text-slate-300 font-medium">Data coming soon</p>
          <p className="text-slate-500 text-sm mt-1">Go to Settings to connect Cloudbeds</p>
          <a href="/settings" className="inline-block mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg transition-colors">Connect now</a>
        </div>
      </div>
    </div>
  )
}
