import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VatReportClient, { type IncomeRow, type InstallmentRow, type VatPaymentRow } from '@/components/vat-report/VatReportClient'

export default async function VatReportPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: settings },
    { data: incomeRows },
    { data: installments },
    { data: vatPayments },
  ] = await Promise.all([
    supabase
      .from('settings')
      .select('vat_rate, vat_report_frequency')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('income')
      .select('id, product_name, final_price, income_date')
      .eq('user_id', user.id)
      .order('income_date', { ascending: false }),
    supabase
      .from('expense_installments')
      .select(`
        id, due_month, amount, vat_amount,
        expenses!inner(description, is_personal, expense_categories(name, is_vat_recognized))
      `)
      .eq('user_id', user.id)
      .eq('expenses.is_personal', false)
      .gt('vat_amount', 0),
    supabase
      .from('authority_payments')
      .select('id, amount, payment_month')
      .eq('user_id', user.id)
      .eq('type', 'vat'),
  ])

  const vatReportFrequency =
    settings?.vat_report_frequency === 'monthly' ? 'monthly' : 'bimonthly'

  return (
    <VatReportClient
      vatRate={settings?.vat_rate ?? 18}
      vatReportFrequency={vatReportFrequency}
      incomeRows={(incomeRows ?? []) as IncomeRow[]}
      installments={(installments ?? []) as unknown as InstallmentRow[]}
      vatPayments={(vatPayments ?? []) as VatPaymentRow[]}
    />
  )
}
