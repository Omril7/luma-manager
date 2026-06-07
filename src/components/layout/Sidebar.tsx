'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Menu, X } from 'lucide-react'

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
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-2 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full text-right px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        >
          התנתקות
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 min-h-screen bg-white border-l border-gray-200 flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">מנהל כספים</h1>
        </div>
        {navContent}
      </aside>

      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 right-0 left-0 z-40 bg-white border-b border-gray-200 flex items-center justify-between px-4 h-14">
        <h1 className="text-base font-bold text-gray-900">מנהל כספים</h1>
        <button onClick={() => setOpen(v => !v)} className="p-2 text-gray-600">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <aside
            className="absolute top-14 right-0 bottom-0 w-56 bg-white border-l border-gray-200 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {navContent}
          </aside>
        </div>
      )}
    </>
  )
}
