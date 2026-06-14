'use server'

import { createClient } from '@/lib/supabase/server'
import { deleteFile } from '@/lib/cloudinary'
import { revalidatePath } from 'next/cache'

export type MonthStats = {
  month: string  // YYYY-MM
  active: number
  archived: number
}

type ReceiptWithDate = {
  id: string
  cleaned_up_at: string | null
  expenses: { transaction_date: string }
}

export async function getStorageStats(): Promise<MonthStats[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: raw } = await supabase
    .from('receipts')
    .select('id, cleaned_up_at, expenses!inner(transaction_date)')
    .eq('user_id', user.id)

  const receipts = (raw ?? []) as unknown as ReceiptWithDate[]

  const monthMap = new Map<string, { active: number; archived: number }>()
  for (const r of receipts) {
    const month = r.expenses.transaction_date.slice(0, 7)
    const entry = monthMap.get(month) ?? { active: 0, archived: 0 }
    if (r.cleaned_up_at) entry.archived++
    else entry.active++
    monthMap.set(month, entry)
  }

  return Array.from(monthMap.entries())
    .map(([month, counts]) => ({ month, ...counts }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

type ReceiptForCleanup = {
  id: string
  cloudinary_public_id: string | null
}

export async function cleanupMonth(year: number, month: number): Promise<{ success: boolean; count?: number; error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'לא מחובר' }

  const mm = String(month).padStart(2, '0')
  const startDate = `${year}-${mm}-01`
  const nextYear = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

  const { data: expenses } = await supabase
    .from('expenses')
    .select('id')
    .eq('user_id', user.id)
    .gte('transaction_date', startDate)
    .lt('transaction_date', endDate)

  const expenseIds = (expenses ?? []).map(e => e.id)
  if (expenseIds.length === 0) return { success: true, count: 0 }

  const { data: raw, error: fetchError } = await supabase
    .from('receipts')
    .select('id, cloudinary_public_id')
    .eq('user_id', user.id)
    .is('cleaned_up_at', null)
    .in('expense_id', expenseIds)

  if (fetchError) return { success: false, error: fetchError.message }

  const receipts = (raw ?? []) as ReceiptForCleanup[]
  if (receipts.length === 0) return { success: true, count: 0 }

  for (const receipt of receipts) {
    if (receipt.cloudinary_public_id) {
      try {
        await deleteFile(receipt.cloudinary_public_id)
      } catch {
        // Continue — partial Cloudinary failure shouldn't block the rest
      }
    }
  }

  const { error: updateError } = await supabase
    .from('receipts')
    .update({
      cleaned_up_at: new Date().toISOString(),
      cloudinary_public_id: null,
      cloudinary_url: null,
    })
    .in('id', receipts.map(r => r.id))
    .eq('user_id', user.id)

  if (updateError) return { success: false, error: updateError.message }

  revalidatePath('/storage')
  revalidatePath('/expenses')
  return { success: true, count: receipts.length }
}
