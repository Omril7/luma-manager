'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const generalSchema = z.object({
  business_name: z.string().optional(),
  vat_rate: z.coerce.number().min(0).max(100),
  paycheck_percent: z.coerce.number().min(0).max(100),
})

const balanceSchema = z.object({
  opening_balance: z.coerce.number(),
})

const emailSchema = z.object({
  gmail_user: z.string().email('כתובת מייל לא תקינה').optional().or(z.literal('')),
  gmail_app_password: z.string().optional(),
})

const passwordSchema = z.object({
  password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים'),
})

export async function saveGeneralSettings(_prev: unknown, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const parsed = generalSchema.safeParse({
    business_name: formData.get('business_name'),
    vat_rate: formData.get('vat_rate'),
    paycheck_percent: formData.get('paycheck_percent'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('settings').upsert(
    {
      user_id: user.id,
      business_name: parsed.data.business_name ?? null,
      vat_rate: parsed.data.vat_rate,
      paycheck_percent: parsed.data.paycheck_percent,
    },
    { onConflict: 'user_id' }
  )
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}

export async function saveBalanceSettings(_prev: unknown, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const parsed = balanceSchema.safeParse({ opening_balance: formData.get('opening_balance') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('settings').upsert(
    { user_id: user.id, opening_balance: parsed.data.opening_balance },
    { onConflict: 'user_id' }
  )
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}

export async function saveEmailSettings(_prev: unknown, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const parsed = emailSchema.safeParse({
    gmail_user: formData.get('gmail_user'),
    gmail_app_password: formData.get('gmail_app_password'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('settings').upsert(
    {
      user_id: user.id,
      gmail_user: parsed.data.gmail_user || null,
      gmail_app_password: parsed.data.gmail_app_password || null,
    },
    { onConflict: 'user_id' }
  )
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}

export async function changePassword(_prev: unknown, formData: FormData) {
  const parsed = passwordSchema.safeParse({ password: formData.get('password') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { error: error.message }
  return { success: true }
}
