import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import IncomeClient from '@/components/income/IncomeClient'

export default async function IncomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: products }, { data: incomeRows }, { data: snapshots }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, description')
      .eq('user_id', user.id)
      .order('name'),
    supabase
      .from('income')
      .select('id, product_name, product_id, order_id, original_price, discount_amount, final_price, delivery_amount, income_date, notes, source')
      .eq('user_id', user.id)
      .order('income_date', { ascending: false }),
    supabase
      .from('balance_snapshots')
      .select('snapshot_month')
      .eq('user_id', user.id)
      .not('approved_at', 'is', null),
  ])

  const closedMonths = (snapshots ?? []).map(s => s.snapshot_month.slice(0, 7))

  return (
    <IncomeClient
      products={products ?? []}
      incomeRows={incomeRows ?? []}
      closedMonths={closedMonths}
    />
  )
}
