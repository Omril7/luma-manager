import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GeneralSettingsForm, BalanceSettingsForm, EmailSettingsForm, AccountSettingsForm } from './SettingsForms'
import type { Settings } from '@/stores/settingsStore'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">הגדרות</h1>
      <div className="space-y-6">
        <GeneralSettingsForm settings={settings as Settings | null} />
        <BalanceSettingsForm settings={settings as Settings | null} />
        <EmailSettingsForm settings={settings as Settings | null} />
        <AccountSettingsForm email={user.email ?? ''} />
      </div>
    </div>
  )
}
