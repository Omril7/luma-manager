'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const eventSchema = z.object({
  title: z.string().min(1, 'כותרת נדרשת'),
  description: z.string().optional(),
  start_time: z.string().min(1, 'שעת התחלה נדרשת'),
  end_time: z.string().optional(),
  is_all_day: z.boolean().default(false),
  recurrence_rule: z.string().optional(),
})

export async function createEvent(_prev: unknown, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const isAllDay = formData.get('is_all_day') === 'true'
  const parsed = eventSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time') || undefined,
    is_all_day: isAllDay,
    recurrence_rule: formData.get('recurrence_rule') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('calendar_events').insert({
    user_id: user.id,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    start_time: parsed.data.start_time,
    end_time: parsed.data.end_time ?? null,
    is_all_day: parsed.data.is_all_day,
    recurrence_rule: parsed.data.recurrence_rule ?? null,
  })
  if (error) return { error: error.message }
  revalidatePath('/calendar')
  return { success: true }
}

export async function updateEvent(_prev: unknown, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const eventId = formData.get('event_id') as string
  const isAllDay = formData.get('is_all_day') === 'true'
  const parsed = eventSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time') || undefined,
    is_all_day: isAllDay,
    recurrence_rule: formData.get('recurrence_rule') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('calendar_events').update({
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    start_time: parsed.data.start_time,
    end_time: parsed.data.end_time ?? null,
    is_all_day: parsed.data.is_all_day,
    recurrence_rule: parsed.data.recurrence_rule ?? null,
  }).eq('id', eventId).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/calendar')
  return { success: true }
}

export async function deleteEvent(eventId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const { error } = await supabase.from('calendar_events').delete()
    .eq('id', eventId).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/calendar')
  return { success: true }
}
