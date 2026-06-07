'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Menu, X } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

const navItems = [
  { href: '/dashboard', label: 'תזרים' },
  { href: '/expenses', label: 'הוצאות' },
  { href: '/income', label: 'הכנסות' },
  { href: '/calendar', label: 'יומן' },
  { href: '/pricing', label: 'תמחור' },
  { href: '/settings', label: 'הגדרות' },
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
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-2 border-t border-border space-y-1">
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="w-full text-right px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          התנתקות
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 min-h-screen bg-card border-l border-border flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-bold text-foreground">מנהל כספים</h1>
        </div>
        {navContent}
      </aside>

      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 right-0 left-0 z-40 bg-card border-b border-border flex items-center justify-between px-4 h-14">
        <h1 className="text-base font-bold text-foreground">מנהל כספים</h1>
        <button onClick={() => setOpen(v => !v)} className="p-2 text-muted-foreground">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <aside
            className="absolute top-14 right-0 bottom-0 w-56 bg-card border-l border-border flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {navContent}
          </aside>
        </div>
      )}
    </>
  )
}
