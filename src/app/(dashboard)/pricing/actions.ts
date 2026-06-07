'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const partSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().min(0),
})

const savePricingSchema = z.object({
  name: z.string().min(1, 'שם תמחור נדרש'),
  hourly_rate: z.coerce.number().min(0),
  time_hours: z.coerce.number().min(0),
  overhead_per_hour: z.coerce.number().min(0),
  profit_type: z.enum(['percent', 'fixed']),
  profit_value: z.coerce.number().min(0),
  suggested_price: z.coerce.number().min(0),
  parts: z.array(partSchema),
})

export type SavePricingInput = z.infer<typeof savePricingSchema>

export async function savePricing(input: SavePricingInput) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const parsed = savePricingSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { data: pricing, error: pe } = await supabase
    .from('product_pricings')
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      hourly_rate: parsed.data.hourly_rate,
      time_hours: parsed.data.time_hours,
      overhead_per_hour: parsed.data.overhead_per_hour,
      profit_type: parsed.data.profit_type,
      profit_value: parsed.data.profit_value,
      suggested_price: parsed.data.suggested_price,
    })
    .select('id')
    .single()

  if (pe) return { error: pe.message }

  if (parsed.data.parts.length > 0) {
    const { error: partsError } = await supabase.from('pricing_parts').insert(
      parsed.data.parts.map(p => ({
        pricing_id: pricing.id,
        user_id: user.id,
        name: p.name,
        price: p.price,
      }))
    )
    if (partsError) return { error: partsError.message }
  }

  revalidatePath('/pricing')
  return { success: true }
}

export async function deletePricing(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const { error } = await supabase
    .from('product_pricings')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/pricing')
  return { success: true }
}
