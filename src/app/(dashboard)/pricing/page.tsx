import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PricingClient from '@/components/pricing/PricingClient'

export default async function PricingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: pricings },
    { data: materialCategories },
    { data: materials },
  ] = await Promise.all([
    supabase
      .from('product_pricings')
      .select('id, name, hourly_rate, time_hours, overhead_per_hour, profit_type, profit_value, suggested_price, created_at, pricing_parts(id, name, quantity, material_id, price, materials(price, unit))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('material_categories')
      .select('id, name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('materials')
      .select('id, name, unit, price, category_id, material_categories(name)')
      .eq('user_id', user.id)
      .order('name', { ascending: true }),
  ])

  return (
    <PricingClient
      pricings={(pricings ?? []) as unknown as Parameters<typeof PricingClient>[0]['pricings']}
      defaultHourlyRate={0}
      materialCategories={materialCategories ?? []}
      materials={(materials ?? []) as unknown as Parameters<typeof PricingClient>[0]['materials']}
    />
  )
}
