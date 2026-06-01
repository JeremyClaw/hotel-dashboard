import StatCard from '@/components/stats/StatCard'
import { formatCurrency, formatPercent } from '@/lib/utils'

// Placeholder — will be replaced with real Cloudbeds data in Phase 2
const PLACEHOLDER_STATS = {
  occupancyToday: 74.5,
  occupancyYesterday: 71.2,
  occupancyMTD: 68.3,
  revenueToday: 38400,
  revenueMTD: 1120000,
  adr: 1680,
  revpar: 1251,
  arrivalsToday: 12,
  departuresToday: 9,
  cancellationsToday: 2,
}

export default function OverviewPage() {
  const s = PLACEHOLDER_STATS

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-slate-400 text-sm mt-1">
          {new Date().toLocaleDateString('en-ZA', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
          })}
        </p>
      </div>

      {/* Cloudbeds connect banner — shown until connected */}
      <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
        <div>
          <p className="text-amber-300 font-medium text-sm">Connect Cloudbeds to see live data</p>
          <p className="text-amber-400/70 text-xs mt-0.5">Currently showing placeholder stats</p>
        </div>
        <a
          href="/api/auth/cloudbeds/connect"
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Connect Cloudbeds
        </a>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Occupancy Today"
          value={formatPercent(s.occupancyToday)}
          trend={4.6}
          trendLabel="vs yesterday"
          icon="🏨"
          highlight
        />
        <StatCard
          label="Occupancy Yesterday"
          value={formatPercent(s.occupancyYesterday)}
          icon="📅"
        />
        <StatCard
          label="Occupancy MTD"
          value={formatPercent(s.occupancyMTD)}
          trend={2.1}
          trendLabel="vs last month"
          icon="📊"
        />
        <StatCard
          label="Revenue Today"
          value={formatCurrency(s.revenueToday)}
          trend={8.3}
          trendLabel="vs yesterday"
          icon="💰"
        />
        <StatCard
          label="Revenue MTD"
          value={formatCurrency(s.revenueMTD)}
          trend={12.4}
          trendLabel="vs last month"
          icon="📈"
        />
        <StatCard
          label="ADR"
          value={formatCurrency(s.adr)}
          subValue="Average Daily Rate"
          icon="🏷️"
        />
        <StatCard
          label="RevPAR"
          value={formatCurrency(s.revpar)}
          subValue="Revenue per Available Room"
          icon="📐"
        />
        <StatCard
          label="Arrivals Today"
          value={String(s.arrivalsToday)}
          icon="✈️"
        />
        <StatCard
          label="Departures Today"
          value={String(s.departuresToday)}
          icon="🧳"
        />
        <StatCard
          label="Cancellations"
          value={String(s.cancellationsToday)}
          icon="❌"
        />
      </div>

      {/* Coming soon sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 p-6 flex items-center justify-center h-48">
          <div className="text-center">
            <p className="text-slate-400 text-sm">Occupancy chart</p>
            <p className="text-slate-600 text-xs mt-1">Available after Cloudbeds connection</p>
          </div>
        </div>
        <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 p-6 flex items-center justify-center h-48">
          <div className="text-center">
            <p className="text-slate-400 text-sm">Booking channel breakdown</p>
            <p className="text-slate-600 text-xs mt-1">Available after Cloudbeds connection</p>
          </div>
        </div>
      </div>
    </div>
  )
}
