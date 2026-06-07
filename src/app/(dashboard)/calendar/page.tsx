import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarClient from '@/components/calendar/CalendarClient'

export default async function CalendarPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: events } = await supabase
    .from('calendar_events')
    .select('id, title, description, start_time, end_time, is_all_day, recurrence_rule')
    .eq('user_id', user.id)
    .order('start_time')

  return <CalendarClient events={events ?? []} />
}
