'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const generalSchema = z.object({
  business_name: z.string().optional(),
  vat_rate: z.coerce.number().min(0).max(100),
  paycheck_percent: z.coerce.number().min(0).max(100),
  vat_report_frequency: z.enum(['monthly', 'bimonthly']).default('bimonthly'),
})

const balanceSchema = z.object({
  opening_balance: z.coerce.number(),
})

const emailSchema = z.object({
  accountant_email: z.string().email('כתובת מייל לא תקינה').optional().or(z.literal('')),
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
    vat_report_frequency: formData.get('vat_report_frequency'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('settings').upsert(
    {
      user_id: user.id,
      business_name: parsed.data.business_name ?? null,
      vat_rate: parsed.data.vat_rate,
      paycheck_percent: parsed.data.paycheck_percent,
      vat_report_frequency: parsed.data.vat_report_frequency,
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
    accountant_email: formData.get('accountant_email'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('settings').upsert(
    {
      user_id: user.id,
      accountant_email: parsed.data.accountant_email || null,
    },
    { onConflict: 'user_id' }
  )
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}

const pricingSettingsSchema = z.object({
  monthly_salary_target: z.coerce.number().min(0),
  monthly_fixed_expenses: z.coerce.number().min(0),
  working_days_per_month: z.coerce.number().min(1).max(31),
  hours_per_day: z.coerce.number().min(1).max(24),
  default_hourly_rate: z.coerce.number().min(0),
  default_overhead_per_hour: z.coerce.number().min(0),
})

export async function savePricingSettings(_prev: unknown, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const parsed = pricingSettingsSchema.safeParse({
    monthly_salary_target: formData.get('monthly_salary_target'),
    monthly_fixed_expenses: formData.get('monthly_fixed_expenses'),
    working_days_per_month: formData.get('working_days_per_month'),
    hours_per_day: formData.get('hours_per_day'),
    default_hourly_rate: formData.get('default_hourly_rate'),
    default_overhead_per_hour: formData.get('default_overhead_per_hour'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('settings').upsert(
    { user_id: user.id, ...parsed.data },
    { onConflict: 'user_id' }
  )
  if (error) return { error: error.message }
  revalidatePath('/settings')
  revalidatePath('/pricing')
  return { success: true }
}

const deliverySettingsSchema = z.object({
  fuel_price_per_liter: z.coerce.number().min(0),
  km_per_liter: z.coerce.number().min(0.1),
  yearly_maintenance_cost: z.coerce.number().min(0),
  yearly_insurance_cost: z.coerce.number().min(0),
  vehicle_value: z.coerce.number().min(0),
  depreciation_rate_percent: z.coerce.number().min(0).max(100),
  yearly_kilometers: z.coerce.number().min(1),
  cost_per_km: z.coerce.number().min(0),
})

export async function saveDeliverySettings(_prev: unknown, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const parsed = deliverySettingsSchema.safeParse({
    fuel_price_per_liter: formData.get('fuel_price_per_liter'),
    km_per_liter: formData.get('km_per_liter'),
    yearly_maintenance_cost: formData.get('yearly_maintenance_cost'),
    yearly_insurance_cost: formData.get('yearly_insurance_cost'),
    vehicle_value: formData.get('vehicle_value'),
    depreciation_rate_percent: formData.get('depreciation_rate_percent'),
    yearly_kilometers: formData.get('yearly_kilometers'),
    cost_per_km: formData.get('cost_per_km'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('settings').upsert(
    { user_id: user.id, ...parsed.data },
    { onConflict: 'user_id' }
  )
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}

const overheadItemSchema = z.object({
  name: z.string(),
  price: z.coerce.number().min(0),
  note: z.string().nullable().optional(),
})

const pricingWithItemsSchema = z.object({
  monthly_salary_target: z.coerce.number().min(0),
  working_days_per_month: z.coerce.number().min(1).max(31),
  hours_per_day: z.coerce.number().min(1).max(24),
  default_hourly_rate: z.coerce.number().min(0),
  default_overhead_per_hour: z.coerce.number().min(0),
  overhead_items_json: z.string(),
})

export async function savePricingWithItems(_prev: unknown, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const parsed = pricingWithItemsSchema.safeParse({
    monthly_salary_target: formData.get('monthly_salary_target'),
    working_days_per_month: formData.get('working_days_per_month'),
    hours_per_day: formData.get('hours_per_day'),
    default_hourly_rate: formData.get('default_hourly_rate'),
    default_overhead_per_hour: formData.get('default_overhead_per_hour'),
    overhead_items_json: formData.get('overhead_items_json'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  let items: { name: string; price: number; note?: string | null }[]
  try {
    const raw: unknown = JSON.parse(parsed.data.overhead_items_json)
    const itemsParsed = z.array(overheadItemSchema).safeParse(raw)
    if (!itemsParsed.success) return { error: 'שגיאה בנתוני פריטי עלויות' }
    items = itemsParsed.data
  } catch {
    return { error: 'שגיאה בנתוני פריטי עלויות' }
  }

  const { error: settingsError } = await supabase.from('settings').upsert(
    {
      user_id: user.id,
      monthly_salary_target: parsed.data.monthly_salary_target,
      working_days_per_month: parsed.data.working_days_per_month,
      hours_per_day: parsed.data.hours_per_day,
      default_hourly_rate: parsed.data.default_hourly_rate,
      default_overhead_per_hour: parsed.data.default_overhead_per_hour,
    },
    { onConflict: 'user_id' }
  )
  if (settingsError) return { error: settingsError.message }

  const { error: deleteError } = await supabase
    .from('pricing_overhead_items')
    .delete()
    .eq('user_id', user.id)
  if (deleteError) return { error: deleteError.message }

  if (items.length > 0) {
    const { error: insertError } = await supabase
      .from('pricing_overhead_items')
      .insert(items.map((item, i) => ({
        user_id: user.id,
        name: item.name,
        price: item.price,
        note: item.note ?? null,
        sort_order: i,
      })))
    if (insertError) return { error: insertError.message }
  }

  revalidatePath('/settings')
  revalidatePath('/pricing')
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
