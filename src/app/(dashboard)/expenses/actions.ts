'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { installmentVat } from '@/lib/vat'
import { uploadFile, deleteFile } from '@/lib/cloudinary'

// ─── Categories ───────────────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().min(1, 'שם קטגוריה נדרש'),
  is_vat_recognized: z.boolean().default(false),
})

export async function createCategory(_prev: unknown, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    is_vat_recognized: formData.get('is_vat_recognized') === 'true',
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('expense_categories').insert({
    user_id: user.id,
    name: parsed.data.name,
    is_vat_recognized: parsed.data.is_vat_recognized,
  })
  if (error) return { error: error.message }
  revalidatePath('/expenses')
  return { success: true }
}

export async function updateCategoryVat(categoryId: string, isVatRecognized: boolean) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const { error } = await supabase
    .from('expense_categories')
    .update({ is_vat_recognized: isVatRecognized })
    .eq('id', categoryId)
    .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/expenses')
  return { success: true }
}

export async function deleteCategory(categoryId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  // Check if any expense uses this category
  const { count } = await supabase
    .from('expenses')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', categoryId)
    .eq('user_id', user.id)

  if (count && count > 0) return { error: 'לא ניתן למחוק קטגוריה בשימוש' }

  const { error } = await supabase
    .from('expense_categories')
    .delete()
    .eq('id', categoryId)
    .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/expenses')
  return { success: true }
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

const expenseSchema = z.object({
  description: z.string().min(1, 'תיאור נדרש'),
  category_id: z.string().optional(),
  total_amount: z.coerce.number().positive('סכום חייב להיות חיובי'),
  transaction_date: z.string().min(1, 'תאריך נדרש'),
  is_recurring: z.boolean().default(false),
  has_installments: z.boolean().default(false),
  installments_total: z.coerce.number().int().min(1).default(1),
  is_personal: z.boolean().default(false),
  notes: z.string().optional(),
})

export async function createExpense(_prev: unknown, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  // Fetch VAT rate from settings
  const { data: settings } = await supabase
    .from('settings')
    .select('vat_rate')
    .eq('user_id', user.id)
    .single()
  const vatRate = settings?.vat_rate ?? 18

  const parsed = expenseSchema.safeParse({
    description: formData.get('description'),
    category_id: formData.get('category_id') || undefined,
    total_amount: formData.get('total_amount'),
    transaction_date: formData.get('transaction_date'),
    is_recurring: formData.get('is_recurring') === 'true',
    has_installments: formData.get('has_installments') === 'true',
    installments_total: formData.get('installments_total') || 1,
    is_personal: formData.get('is_personal') === 'true',
    notes: formData.get('notes') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const numInstallments = parsed.data.has_installments ? parsed.data.installments_total : 1

  // Insert expense
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      user_id: user.id,
      category_id: parsed.data.category_id ?? null,
      description: parsed.data.description,
      total_amount: parsed.data.total_amount,
      transaction_date: parsed.data.transaction_date,
      is_recurring: parsed.data.is_recurring,
      installments_total: numInstallments,
      is_personal: parsed.data.is_personal,
      notes: parsed.data.notes ?? null,
    })
    .select('id')
    .single()

  if (expenseError || !expense) return { error: expenseError?.message ?? 'שגיאה ביצירת הוצאה' }

  // Create installments
  const installmentAmount = parsed.data.total_amount / numInstallments
  const baseDate = new Date(parsed.data.transaction_date)
  baseDate.setDate(1)

  const installments = Array.from({ length: numInstallments }, (_, i) => {
    const dueDate = new Date(baseDate)
    dueDate.setMonth(dueDate.getMonth() + i)
    return {
      expense_id: expense.id,
      user_id: user.id,
      installment_number: i + 1,
      due_month: dueDate.toISOString().slice(0, 10),
      amount: installmentAmount,
      vat_amount: installmentVat(parsed.data.total_amount, i + 1, vatRate),
    }
  })

  const { error: installmentError } = await supabase.from('expense_installments').insert(installments)
  if (installmentError) return { error: installmentError.message }

  // Handle receipt uploads
  const files = formData.getAll('receipts') as File[]
  for (const file of files) {
    if (file.size === 0) continue
    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `${expense.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const uploaded = await uploadFile(buffer, filename)
    await supabase.from('receipts').insert({
      expense_id: expense.id,
      user_id: user.id,
      cloudinary_public_id: uploaded.public_id,
      cloudinary_url: uploaded.secure_url,
      file_type: uploaded.resource_type === 'image' ? 'image' : 'pdf',
    })
  }

  revalidatePath('/expenses')
  return { success: true }
}

export async function updateExpense(_prev: unknown, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const expenseId = formData.get('expense_id') as string
  if (!expenseId) return { error: 'מזהה הוצאה חסר' }

  const { data: settings } = await supabase
    .from('settings')
    .select('vat_rate')
    .eq('user_id', user.id)
    .single()
  const vatRate = settings?.vat_rate ?? 18

  const parsed = expenseSchema.safeParse({
    description: formData.get('description'),
    category_id: formData.get('category_id') || undefined,
    total_amount: formData.get('total_amount'),
    transaction_date: formData.get('transaction_date'),
    is_recurring: formData.get('is_recurring') === 'true',
    has_installments: formData.get('has_installments') === 'true',
    installments_total: formData.get('installments_total') || 1,
    is_personal: formData.get('is_personal') === 'true',
    notes: formData.get('notes') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const numInstallments = parsed.data.has_installments ? parsed.data.installments_total : 1

  const { error: updateError } = await supabase
    .from('expenses')
    .update({
      category_id: parsed.data.category_id ?? null,
      description: parsed.data.description,
      total_amount: parsed.data.total_amount,
      transaction_date: parsed.data.transaction_date,
      is_recurring: parsed.data.is_recurring,
      installments_total: numInstallments,
      is_personal: parsed.data.is_personal,
      notes: parsed.data.notes ?? null,
    })
    .eq('id', expenseId)
    .eq('user_id', user.id)

  if (updateError) return { error: updateError.message }

  // Rebuild installments
  await supabase.from('expense_installments').delete().eq('expense_id', expenseId)
  const installmentAmount = parsed.data.total_amount / numInstallments
  const baseDate = new Date(parsed.data.transaction_date)
  baseDate.setDate(1)
  const installments = Array.from({ length: numInstallments }, (_, i) => {
    const dueDate = new Date(baseDate)
    dueDate.setMonth(dueDate.getMonth() + i)
    return {
      expense_id: expenseId,
      user_id: user.id,
      installment_number: i + 1,
      due_month: dueDate.toISOString().slice(0, 10),
      amount: installmentAmount,
      vat_amount: installmentVat(parsed.data.total_amount, i + 1, vatRate),
    }
  })
  await supabase.from('expense_installments').insert(installments)

  // Handle new receipt uploads
  const files = formData.getAll('receipts') as File[]
  for (const file of files) {
    if (file.size === 0) continue
    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `${expenseId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const uploaded = await uploadFile(buffer, filename)
    await supabase.from('receipts').insert({
      expense_id: expenseId,
      user_id: user.id,
      cloudinary_public_id: uploaded.public_id,
      cloudinary_url: uploaded.secure_url,
      file_type: uploaded.resource_type === 'image' ? 'image' : 'pdf',
    })
  }

  revalidatePath('/expenses')
  return { success: true }
}

export async function deleteExpense(expenseId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  // Fetch receipts before deleting so we can remove them from Cloudinary
  const { data: receipts } = await supabase
    .from('receipts')
    .select('cloudinary_public_id')
    .eq('expense_id', expenseId)
    .eq('user_id', user.id)

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)
    .eq('user_id', user.id)
  if (error) return { error: error.message }

  // Clean up Cloudinary files (best-effort, don't fail the delete if this errors)
  if (receipts) {
    await Promise.allSettled(receipts.filter(r => r.cloudinary_public_id).map(r => deleteFile(r.cloudinary_public_id!)))
  }

  revalidatePath('/expenses')
  return { success: true }
}

export async function deleteReceipt(receiptId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const { error } = await supabase
    .from('receipts')
    .delete()
    .eq('id', receiptId)
    .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/expenses')
  return { success: true }
}

// ─── Recurring expense auto-creation ──────────────────────────────────────────

export async function ensureRecurringInstallments() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: settings } = await supabase
    .from('settings')
    .select('vat_rate')
    .eq('user_id', user.id)
    .single()
  const vatRate = settings?.vat_rate ?? 18

  const now = new Date()
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)

  const { data: recurring } = await supabase
    .from('expenses')
    .select('id, total_amount')
    .eq('user_id', user.id)
    .eq('is_recurring', true)

  if (!recurring) return

  for (const expense of recurring) {
    const { count } = await supabase
      .from('expense_installments')
      .select('id', { count: 'exact', head: true })
      .eq('expense_id', expense.id)
      .eq('due_month', currentMonth)

    if (!count || count === 0) {
      const { data: lastInstallment } = await supabase
        .from('expense_installments')
        .select('installment_number')
        .eq('expense_id', expense.id)
        .order('installment_number', { ascending: false })
        .limit(1)
        .single()

      const nextNumber = (lastInstallment?.installment_number ?? 0) + 1
      await supabase.from('expense_installments').insert({
        expense_id: expense.id,
        user_id: user.id,
        installment_number: nextNumber,
        due_month: currentMonth,
        amount: expense.total_amount,
        vat_amount: installmentVat(expense.total_amount, nextNumber, vatRate),
      })
    }
  }
}
