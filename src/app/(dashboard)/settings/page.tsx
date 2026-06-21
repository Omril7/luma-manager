import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsCard, CalculatorsCard } from './SettingsForms'
import type { Settings } from '@/stores/settingsStore'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: settings }, { data: overheadItems }] = await Promise.all([
    supabase.from('settings').select('*').eq('user_id', user.id).single(),
    supabase
      .from('pricing_overhead_items')
      .select('id, name, price, note')
      .eq('user_id', user.id)
      .order('sort_order'),
  ])

  const s = settings as Settings | null
  const items = (overheadItems ?? []) as Array<{ id: string; name: string; price: number; note: string | null }>

  return (
    <div className="w-full space-y-10">
      <h1 className="text-2xl font-bold text-foreground">הגדרות</h1>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest border-b pb-2">הגדרות עסקיות</h2>
        <SettingsCard settings={s} email={user.email ?? ''} />
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest border-b pb-2">מחשבונים</h2>
        <CalculatorsCard settings={s} overheadItems={items} />
      </section>
    </div>
  )
}
