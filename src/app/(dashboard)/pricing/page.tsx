import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PricingClient from '@/components/pricing/PricingClient'

export default async function PricingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: pricings } = await supabase
    .from('product_pricings')
    .select('id, name, hourly_rate, time_hours, overhead_per_hour, profit_type, profit_value, suggested_price, created_at, pricing_parts(id, name, price)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <PricingClient
      pricings={(pricings ?? []) as unknown as Parameters<typeof PricingClient>[0]['pricings']}
      defaultHourlyRate={0}
    />
  )
}
