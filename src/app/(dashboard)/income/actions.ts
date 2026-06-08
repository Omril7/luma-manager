'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// ─── Products ─────────────────────────────────────────────────────────────────

const productSchema = z.object({
  name: z.string().min(1, 'שם מוצר נדרש'),
  description: z.string().optional(),
})

export async function createProduct(_prev: unknown, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const parsed = productSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('products').insert({
    user_id: user.id,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
  })
  if (error) return { error: error.message }
  revalidatePath('/income')
  return { success: true }
}

export async function updateProduct(_prev: unknown, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const id = formData.get('product_id') as string
  const parsed = productSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('products').update({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
  }).eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/income')
  return { success: true }
}

export async function deleteProduct(productId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const { error } = await supabase.from('products').delete()
    .eq('id', productId).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/income')
  return { success: true }
}

// ─── Income ───────────────────────────────────────────────────────────────────

const incomeSchema = z.object({
  product_name: z.string().min(1, 'שם מוצר נדרש'),
  product_id: z.string().optional(),
  order_id: z.string().optional(),
  original_price: z.coerce.number().nonnegative('מחיר מקורי חייב להיות אפס או יותר'),
  has_discount: z.boolean().default(false),
  discount_amount: z.coerce.number().nonnegative().default(0),
  delivery_amount: z.coerce.number().nonnegative().default(0),
  income_date: z.string().min(1, 'תאריך נדרש'),
  notes: z.string().optional(),
})

export async function createIncome(_prev: unknown, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const hasDiscount = formData.get('has_discount') === 'true'
  const parsed = incomeSchema.safeParse({
    product_name: formData.get('product_name'),
    product_id: formData.get('product_id') || undefined,
    order_id: formData.get('order_id') || undefined,
    original_price: formData.get('original_price'),
    has_discount: hasDiscount,
    discount_amount: hasDiscount ? formData.get('discount_amount') : 0,
    delivery_amount: formData.get('delivery_amount') || 0,
    income_date: formData.get('income_date'),
    notes: formData.get('notes') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const discountAmount = parsed.data.has_discount ? parsed.data.discount_amount : 0
  const finalPrice = parsed.data.original_price - discountAmount

  const { error } = await supabase.from('income').insert({
    user_id: user.id,
    source: 'manual',
    product_id: parsed.data.product_id ?? null,
    product_name: parsed.data.product_name,
    order_id: parsed.data.order_id ?? null,
    original_price: parsed.data.original_price,
    discount_amount: discountAmount,
    final_price: finalPrice,
    delivery_amount: parsed.data.delivery_amount,
    income_date: parsed.data.income_date,
    notes: parsed.data.notes ?? null,
  })
  if (error) return { error: error.message }
  revalidatePath('/income')
  return { success: true }
}

export async function updateIncome(_prev: unknown, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const incomeId = formData.get('income_id') as string
  const hasDiscount = formData.get('has_discount') === 'true'
  const parsed = incomeSchema.safeParse({
    product_name: formData.get('product_name'),
    product_id: formData.get('product_id') || undefined,
    order_id: formData.get('order_id') || undefined,
    original_price: formData.get('original_price'),
    has_discount: hasDiscount,
    discount_amount: hasDiscount ? formData.get('discount_amount') : 0,
    delivery_amount: formData.get('delivery_amount') || 0,
    income_date: formData.get('income_date'),
    notes: formData.get('notes') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const discountAmount = parsed.data.has_discount ? parsed.data.discount_amount : 0
  const finalPrice = parsed.data.original_price - discountAmount

  const { error } = await supabase.from('income').update({
    product_id: parsed.data.product_id ?? null,
    product_name: parsed.data.product_name,
    order_id: parsed.data.order_id ?? null,
    original_price: parsed.data.original_price,
    discount_amount: discountAmount,
    final_price: finalPrice,
    delivery_amount: parsed.data.delivery_amount,
    income_date: parsed.data.income_date,
    notes: parsed.data.notes ?? null,
  }).eq('id', incomeId).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/income')
  return { success: true }
}

export async function deleteIncome(incomeId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const { error } = await supabase.from('income').delete()
    .eq('id', incomeId).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/income')
  return { success: true }
}
