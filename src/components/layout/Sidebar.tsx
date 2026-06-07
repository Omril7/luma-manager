'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

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

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('התנתקת בהצלחה')
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 min-h-screen bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900">מנהל כספים</h1>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
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
    </aside>
  )
}
