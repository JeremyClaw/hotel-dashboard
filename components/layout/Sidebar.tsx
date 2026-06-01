'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BedDouble,
  DollarSign,
  Building2,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react'

const nav = [
  { href: '/',           label: 'Overview',    icon: LayoutDashboard },
  { href: '/occupancy',  label: 'Occupancy',   icon: BedDouble },
  { href: '/revenue',    label: 'Revenue',     icon: DollarSign },
  { href: '/properties', label: 'Properties',  icon: Building2 },
  { href: '/channels',   label: 'Channels',    icon: BarChart3 },
  { href: '/settings',   label: 'Settings',    icon: Settings },
]

async function handleLogout() {
  await fetch('/api/auth', { method: 'DELETE' })
  window.location.href = '/login'
}

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen bg-[#0f172a] border-r border-slate-800 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏨</span>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Hotel Dashboard</p>
            <p className="text-slate-500 text-xs">Sam's Properties</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 w-full transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
