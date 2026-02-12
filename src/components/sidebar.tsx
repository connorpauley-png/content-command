'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CalendarDays,
  Columns3,
  PenSquare,
  Image,
  PartyPopper,
  Wand2,
  CheckCircle,
  Settings,
  TrendingUp,
  Hammer,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/build', label: 'Build', icon: Hammer },
  { href: '/generate', label: 'Generate', icon: Wand2 },
  { href: '/approve', label: 'Approve', icon: CheckCircle },
  { href: '/intelligence', label: 'Intelligence', icon: TrendingUp },
  { href: '/pipeline', label: 'Pipeline', icon: Columns3 },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/photos', label: 'Photos', icon: Image },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-[#1a1a1a] text-white flex flex-col shrink-0">
      {/* Logo / Brand */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#254421] flex items-center justify-center font-bold text-lg">
            CB
          </div>
          <div>
            <h1 className="font-semibold text-sm">Content Command</h1>
            <p className="text-xs text-gray-400">College Bros LLC</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-[#254421] text-white font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-gray-500 text-center">
          Local · No Auth Required
        </p>
      </div>
    </aside>
  )
}
