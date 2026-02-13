'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useClientStore } from '@/lib/store/clients'
import {
  LayoutDashboard,
  Kanban,
  Calendar,
  Settings,
  Sparkles,
  Users,
  Zap,
  Monitor,
  ChevronDown,
  Building2,
  Plus,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/command', label: 'Command Center', icon: Monitor },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/ideas', label: 'Generate', icon: Sparkles },
  { href: '/accounts', label: 'Accounts', icon: Users },
  { href: '/clients', label: 'Clients', icon: Building2 },
  { href: '/setup', label: 'Setup', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { clients, currentClientId, setCurrentClient, getCurrentClient } = useClientStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentClient = getCurrentClient()

  if (!mounted) {
    return (
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card min-h-screen">
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Content Command</span>
          </Link>
        </div>
      </aside>
    )
  }

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card min-h-screen">
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Content Command</span>
        </Link>
      </div>

      {/* Client Switcher */}
      <div className="p-4 border-b border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="truncate">{currentClient?.name || 'No Client'}</span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {clients.map((client) => (
              <DropdownMenuItem
                key={client.id}
                onClick={() => setCurrentClient(client.id)}
                className={currentClientId === client.id ? 'bg-accent' : ''}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{client.name}</span>
                    <span className="text-xs text-muted-foreground">{client.industry}</span>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/clients" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Manage Clients
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <Link href="/ideas" className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <Sparkles className="h-4 w-4" />
          Generate Ideas
        </Link>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
      <div className="flex justify-around py-2">
        {navItems.slice(0, 4).map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1 text-xs',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
