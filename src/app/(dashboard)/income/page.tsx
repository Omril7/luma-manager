import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import IncomeClient from '@/components/income/IncomeClient'

export default async function IncomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: products }, { data: incomeRows }] = await Promise.all([
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
  ])

  return (
    <IncomeClient
      products={products ?? []}
      incomeRows={incomeRows ?? []}
    />
  )
}
