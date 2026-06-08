'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Menu, X, TrendingUp, Receipt, DollarSign, CalendarDays, Tag, Settings, LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

const navItems = [
  { href: '/dashboard', label: 'תזרים', Icon: TrendingUp },
  { href: '/expenses', label: 'הוצאות', Icon: Receipt },
  { href: '/income', label: 'הכנסות', Icon: DollarSign },
  { href: '/calendar', label: 'יומן', Icon: CalendarDays },
  { href: '/pricing', label: 'תמחור', Icon: Tag },
  { href: '/settings', label: 'הגדרות', Icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('התנתקת בהצלחה')
    router.push('/login')
    router.refresh()
  }

  const navContent = (
    <>
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 border-r-2',
                active
                  ? 'bg-white/[0.2] text-white border-r-amber-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_2px_8px_rgba(0,0,0,0.4)]'
                  : 'text-slate-300 border-r-transparent hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-150"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          התנתקות
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 h-screen sticky top-0 flex-col sidebar-skeu">
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] shrink-0 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="לוגו" className="h-full w-full object-contain p-1" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-white leading-tight truncate">LUMA</h1>
                <p className="text-xs text-slate-400">עסקי</p>
              </div>
            </div>
            <div className="text-slate-300 [&_button]:text-slate-300 [&_button:hover]:text-white [&_button:hover]:bg-white/10 shrink-0">
              <ThemeToggle />
            </div>
          </div>
        </div>
        {navContent}
      </aside>

      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 right-0 left-0 z-40 flex items-center justify-between px-4 h-14 sidebar-skeu border-b border-white/10">
        <h1 className="text-sm font-bold text-white">LUMA</h1>
        <div className="flex items-center gap-1">
          <div className="text-slate-300 [&_button]:text-slate-300 [&_button:hover]:text-white [&_button:hover]:bg-white/10">
            <ThemeToggle />
          </div>
          <button onClick={() => setOpen(v => !v)} className="p-2 text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-white/10">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <aside
            className="absolute top-14 right-0 bottom-0 w-60 flex flex-col sidebar-skeu border-l border-white/10"
            onClick={e => e.stopPropagation()}
          >
            {navContent}
          </aside>
        </div>
      )}
    </>
  )
}
