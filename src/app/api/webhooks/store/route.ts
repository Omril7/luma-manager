import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const webhookSchema = z.object({
  user_id: z.string().uuid('user_id חסר או לא תקין'),
  order_id: z.string().optional(),
  product_name: z.string().min(1),
  product_external_id: z.string().optional(),
  original_price: z.number().nonnegative(),
  discount_amount: z.number().nonnegative().default(0),
  final_price: z.number().nonnegative(),
  payment_on_delivery: z.boolean().default(false),
  income_date: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret')
  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = webhookSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const supabase = createClient()

  const userId = parsed.data.user_id

  // Resolve product by external_id if provided
  let productId: string | null = null
  if (parsed.data.product_external_id) {
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('external_id', parsed.data.product_external_id)
      .eq('user_id', userId)
      .single()
    productId = product?.id ?? null

    // Auto-create product if not found
    if (!productId) {
      const { data: newProduct } = await supabase.from('products').insert({
        user_id: userId,
        external_id: parsed.data.product_external_id,
        name: parsed.data.product_name,
      }).select('id').single()
      productId = newProduct?.id ?? null
    }
  }

  const { error } = await supabase.from('income').insert({
    user_id: userId,
    source: 'store',
    product_id: productId,
    product_name: parsed.data.product_name,
    order_id: parsed.data.order_id ?? null,
    original_price: parsed.data.original_price,
    discount_amount: parsed.data.discount_amount,
    final_price: parsed.data.final_price,
    payment_on_delivery: parsed.data.payment_on_delivery,
    income_date: parsed.data.income_date,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
