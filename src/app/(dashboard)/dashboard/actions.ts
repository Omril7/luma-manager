'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'


const authorityPaymentSchema = z.object({
  type: z.enum(['income_tax', 'social_security', 'vat']),
  amount: z.coerce.number().positive('סכום חייב להיות חיובי'),
  payment_month: z.string().min(1, 'חודש נדרש'),
  notes: z.string().optional(),
})

export async function createAuthorityPayment(_prev: unknown, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const parsed = authorityPaymentSchema.safeParse({
    type: formData.get('type'),
    amount: formData.get('amount'),
    payment_month: formData.get('payment_month'),
    notes: formData.get('notes') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('authority_payments').insert({
    user_id: user.id,
    type: parsed.data.type,
    amount: parsed.data.amount,
    payment_month: parsed.data.payment_month + '-01',
    notes: parsed.data.notes ?? null,
  })
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteAuthorityPayment(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const { error } = await supabase
    .from('authority_payments')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function approveMonthClose(
  snapshotMonth: string,
  openingBalance: number,
  closingBalance: number,
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const { error } = await supabase.from('balance_snapshots').upsert({
    user_id: user.id,
    snapshot_month: snapshotMonth + '-01',
    opening_balance: openingBalance,
    closing_balance: closingBalance,
    approved_at: new Date().toISOString(),
  }, { onConflict: 'user_id,snapshot_month' })
  if (error) return { error: error.message }

  revalidatePath('/dashboard')

  return { success: true }
}

export async function deleteSnapshot(snapshotMonth: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const { error } = await supabase
    .from('balance_snapshots')
    .delete()
    .eq('snapshot_month', snapshotMonth + '-01')
    .eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function updatePaycheckPercent(percent: number) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const { error } = await supabase
    .from('settings')
    .upsert({ user_id: user.id, paycheck_percent: percent }, { onConflict: 'user_id' })
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}
