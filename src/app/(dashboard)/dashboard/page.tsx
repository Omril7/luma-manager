import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'

function toYM(dateStr: string) {
  return dateStr.slice(0, 7) // YYYY-MM
}


export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [
    { data: settings },
    { data: authorityPayments },
    { data: snapshots },
    { data: allInstallments },
    { data: allIncome },
    { data: allAuthority },
    { data: allProvisions },
    { data: personalProvisions },
  ] = await Promise.all([
    supabase.from('settings').select('paycheck_percent, opening_balance').eq('user_id', user.id).single(),
    // all authority payments
    supabase
      .from('authority_payments')
      .select('id, type, amount, payment_month, notes')
      .eq('user_id', user.id)
      .order('payment_month', { ascending: false }),
    // all balance snapshots
    supabase
      .from('balance_snapshots')
      .select('snapshot_month, opening_balance, closing_balance, approved_at')
      .eq('user_id', user.id)
      .order('snapshot_month', { ascending: true }),
    // all installments for running balance
    supabase
      .from('expense_installments')
      .select('amount, due_month, expenses!inner(is_personal, user_id)')
      .eq('expenses.user_id', user.id)
      .eq('expenses.is_personal', false),
    // all income for running balance
    supabase
      .from('income')
      .select('final_price, income_date')
      .eq('user_id', user.id),
    // all authority payments for running balance
    supabase
      .from('authority_payments')
      .select('amount, payment_month, type')
      .eq('user_id', user.id),
    // all personal provisions for running balance
    supabase
      .from('personal_provisions')
      .select('amount, payment_month')
      .eq('user_id', user.id),
    // all personal provisions for the card (with full details)
    supabase
      .from('personal_provisions')
      .select('id, type, amount, payment_month, notes')
      .eq('user_id', user.id)
      .order('payment_month', { ascending: false }),
  ])

  const paycheckPercent = settings?.paycheck_percent ?? 30
  const openingBalance = settings?.opening_balance ?? 0

  // Build running balance rows for the last 12 months + current
  const snapshotMap = new Map<string, typeof snapshots extends (infer T)[] | null ? T : never>()
  for (const snap of snapshots ?? []) {
    snapshotMap.set(toYM(snap.snapshot_month), snap)
  }

  // Group income/expenses/authority by month
  const incomeByMonth = new Map<string, number>()
  for (const r of allIncome ?? []) {
    const ym = toYM(r.income_date)
    incomeByMonth.set(ym, (incomeByMonth.get(ym) ?? 0) + r.final_price)
  }

  const expensesByMonth = new Map<string, number>()
  for (const r of allInstallments ?? []) {
    const ym = toYM((r as { due_month: string }).due_month)
    expensesByMonth.set(ym, (expensesByMonth.get(ym) ?? 0) + (r as { amount: number }).amount)
  }

  type AuthorityBreakdown = { income_tax: number; social_security: number; vat: number }
  const authorityByMonth = new Map<string, AuthorityBreakdown>()
  for (const r of allAuthority ?? []) {
    const ym = toYM(r.payment_month)
    const existing = authorityByMonth.get(ym) ?? { income_tax: 0, social_security: 0, vat: 0 }
    const type = r.type as keyof AuthorityBreakdown
    if (type in existing) existing[type] += r.amount
    authorityByMonth.set(ym, existing)
  }

  const provisionsByMonth = new Map<string, number>()
  for (const r of allProvisions ?? []) {
    const ym = toYM(r.payment_month)
    provisionsByMonth.set(ym, (provisionsByMonth.get(ym) ?? 0) + r.amount)
  }

  // Collect all months that have data, plus current
  const allMonths = new Set<string>([
    ...Array.from(incomeByMonth.keys()),
    ...Array.from(expensesByMonth.keys()),
    ...Array.from(authorityByMonth.keys()),
    ...Array.from(provisionsByMonth.keys()),
    ...Array.from(snapshotMap.keys()),
    currentMonth,
  ])

  const sortedMonths = Array.from(allMonths).sort((a, b) => a.localeCompare(b))

  // Build rows with running balance
  let runningBalance = openingBalance
  // Find first approved snapshot before our range to set opening
  const firstMonth = sortedMonths[0] ?? currentMonth
  // If there's a snapshot just before firstMonth, use its closing balance
  const preSnapshots = (snapshots ?? []).filter(s => toYM(s.snapshot_month) < firstMonth)
  if (preSnapshots.length > 0) {
    runningBalance = preSnapshots[preSnapshots.length - 1].closing_balance
  }

  const balanceRows = sortedMonths.map(month => {
    const snap = snapshotMap.get(month)
    const income = incomeByMonth.get(month) ?? 0
    const expenses = expensesByMonth.get(month) ?? 0
    const authorityBreakdown = authorityByMonth.get(month) ?? { income_tax: 0, social_security: 0, vat: 0 }
    const authority = authorityBreakdown.income_tax + authorityBreakdown.social_security + authorityBreakdown.vat
    const provisions = provisionsByMonth.get(month) ?? 0
    const grossP = income - expenses
    const sal = grossP * (paycheckPercent / 100)
    const isLive = month === currentMonth && !snap?.approved_at

    if (snap?.approved_at) {
      const row = {
        month,
        label: month,
        opening: snap.opening_balance,
        income,
        expenses,
        authority,
        ...authorityBreakdown,
        provisions,
        salary: sal,
        closing: snap.closing_balance,
        isLive: false,
        isApproved: true,
      }
      runningBalance = snap.closing_balance
      return row
    }

    const opening = runningBalance
    const closing = opening + grossP - sal - authority - provisions
    runningBalance = closing

    return {
      month,
      label: month,
      opening,
      income,
      expenses,
      authority,
      ...authorityBreakdown,
      provisions,
      salary: sal,
      closing,
      isLive,
      isApproved: false,
    }
  })

  balanceRows.reverse() // most recent month first for display

  return (
    <DashboardClient
      currentMonth={currentMonth}
      authorityPayments={(authorityPayments ?? []) as { id: string; type: string; amount: number; payment_month: string; notes: string | null }[]}
      personalProvisions={(personalProvisions ?? []) as { id: string; type: string; amount: number; payment_month: string; notes: string | null }[]}
      paycheckPercent={paycheckPercent}
      balanceRows={balanceRows}
    />
  )
}
