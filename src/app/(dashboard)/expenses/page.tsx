import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ExpensesClient from '@/components/expenses/ExpensesClient'
import { ensureRecurringInstallments } from './actions'

export default async function ExpensesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Auto-create recurring installments for this month
  await ensureRecurringInstallments()

  const [
    { data: categories },
    { data: settings },
    { data: expenses },
    { data: allInstallments },
    { data: snapshots },
  ] = await Promise.all([
    supabase
      .from('expense_categories')
      .select('id, name, is_vat_recognized')
      .eq('user_id', user.id)
      .order('name'),
    supabase
      .from('settings')
      .select('vat_rate, accountant_email')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('expenses')
      .select(`
        id, description, category_id, total_amount, transaction_date,
        is_recurring, installments_total, is_personal, notes,
        expense_categories(id, name, is_vat_recognized),
        receipts(id, cloudinary_url, file_type, cleaned_up_at, installment_id),
        expense_installments(id, installment_number, due_month, amount, vat_amount)
      `)
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false }),
    supabase
      .from('expense_installments')
      .select(`
        id, installment_number, due_month, amount, vat_amount,
        expenses!inner(is_personal, expense_categories(name, is_vat_recognized))
      `)
      .eq('user_id', user.id),
    supabase
      .from('balance_snapshots')
      .select('snapshot_month')
      .eq('user_id', user.id)
      .not('approved_at', 'is', null),
  ])

  const closedMonths = (snapshots ?? []).map(s => s.snapshot_month.slice(0, 7))

  return (
    <ExpensesClient
      categories={categories ?? []}
      expenses={(expenses ?? []) as unknown as Parameters<typeof ExpensesClient>[0]['expenses']}
      allInstallments={(allInstallments ?? []) as unknown as Parameters<typeof ExpensesClient>[0]['allInstallments']}
      vatRate={settings?.vat_rate ?? 18}
      hasAccountantEmail={!!settings?.accountant_email}
      closedMonths={closedMonths}
    />
  )
}
