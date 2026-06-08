'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { sendSummaryEmail } from '@/lib/email'

const MONTH_NAMES_HE = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

function ils(n: number) {
  return n.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })
}

const authorityPaymentSchema = z.object({
  type: z.enum(['income_tax', 'social_security', 'vat']),
  amount: z.coerce.number().positive('סכום חייב להיות חיובי'),
  payment_month: z.string().min(1, 'חודש נדרש'),
  notes: z.string().optional(),
})

export async function createAuthorityPayment(_prev: unknown, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const parsed = authorityPaymentSchema.safeParse({
    type: formData.get('type'),
    amount: formData.get('amount'),
    payment_month: formData.get('payment_month'),
    notes: formData.get('notes') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('authority_payments').insert({
    user_id: user.id,
    type: parsed.data.type,
    amount: parsed.data.amount,
    payment_month: parsed.data.payment_month + '-01',
    notes: parsed.data.notes ?? null,
  })
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteAuthorityPayment(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const { error } = await supabase
    .from('authority_payments')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function approveMonthClose(
  snapshotMonth: string,
  openingBalance: number,
  closingBalance: number,
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const { error } = await supabase.from('balance_snapshots').upsert({
    user_id: user.id,
    snapshot_month: snapshotMonth + '-01',
    opening_balance: openingBalance,
    closing_balance: closingBalance,
    approved_at: new Date().toISOString(),
  }, { onConflict: 'user_id,snapshot_month' })
  if (error) return { error: error.message }

  revalidatePath('/dashboard')

  // Send cash-flow summary email to accountant
  let emailWarning: string | undefined
  try {
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const [year, month] = snapshotMonth.split('-').map(Number)
      const monthKey = snapshotMonth

      const [settingsRes, incomeRes, installmentsRes, authorityRes] = await Promise.all([
        supabase.from('settings').select('accountant_email, business_name, paycheck_percent').eq('user_id', user.id).single(),
        supabase.from('income').select('final_price').eq('user_id', user.id).like('income_date', `${monthKey}%`),
        supabase.from('expense_installments').select('amount').eq('user_id', user.id).like('due_month', `${monthKey}%`),
        supabase.from('authority_payments').select('type, amount').eq('user_id', user.id).like('payment_month', `${monthKey}%`),
      ])

      const accountantEmail = settingsRes.data?.accountant_email
      if (accountantEmail) {
        const businessName = settingsRes.data?.business_name ?? ''
        const paycheckPct = settingsRes.data?.paycheck_percent ?? 30

        const totalIncome = (incomeRes.data ?? []).reduce((s, r) => s + r.final_price, 0)
        const totalExpenses = (installmentsRes.data ?? []).reduce((s, r) => s + r.amount, 0)
        const grossProfit = totalIncome - totalExpenses
        const salary = grossProfit * (paycheckPct / 100)
        const authorityPayments = authorityRes.data ?? []
        const authorityTotal = authorityPayments.reduce((s, r) => s + r.amount, 0)

        const TYPE_LABELS: Record<string, string> = {
          income_tax: 'מס הכנסה',
          social_security: 'ביטוח לאומי',
          vat: 'מע"מ',
        }

        const authorityRows = authorityPayments.map(p =>
          `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${TYPE_LABELS[p.type] ?? p.type}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:left">${ils(p.amount)}</td></tr>`
        ).join('')

        const label = `${MONTH_NAMES_HE[month - 1]} ${year}`

        const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"><style>
  body{font-family:Arial,sans-serif;direction:rtl;color:#111;padding:24px;max-width:600px;margin:0 auto}
  h1{color:#1e40af;margin-bottom:4px}
  .subtitle{color:#6b7280;margin-top:0}
  h2{color:#374151;border-bottom:2px solid #e5e7eb;padding-bottom:6px;margin-top:28px}
  table{width:100%;border-collapse:collapse;margin-bottom:16px}
  th{background:#f3f4f6;padding:8px;text-align:right;font-weight:600}
  td{padding:6px 8px}
  .summary-table td:first-child{color:#6b7280}
  .summary-table td:last-child{font-weight:600;text-align:left}
  .total-row td{font-weight:700;font-size:1.05em;border-top:2px solid #d1d5db;padding-top:10px}
  .positive{color:#059669}
  .muted{color:#6b7280;font-size:0.9em}
</style></head>
<body>
  <h1>סיכום חודשי — ${label}${businessName ? ` | ${businessName}` : ''}</h1>
  <p class="subtitle">החודש נסגר ואושר</p>

  <h2>תזרים מזומנים</h2>
  <table class="summary-table">
    <tr><td>יתרה פתיחה</td><td>${ils(openingBalance)}</td></tr>
    <tr><td>סה"כ הכנסות</td><td class="positive">${ils(totalIncome)}</td></tr>
    <tr><td>סה"כ הוצאות עסקיות</td><td>${ils(totalExpenses)}</td></tr>
    <tr><td>רווח גולמי</td><td>${ils(grossProfit)}</td></tr>
    <tr><td>משכורת (${paycheckPct}%)</td><td>${ils(salary)}</td></tr>
    ${authorityTotal > 0 ? `<tr><td>תשלומי רשויות</td><td>${ils(authorityTotal)}</td></tr>` : ''}
    <tr class="total-row"><td>יתרה סגירה</td><td>${ils(closingBalance)}</td></tr>
  </table>

  ${authorityPayments.length > 0 ? `
  <h2>תשלומי רשויות</h2>
  <table>
    <thead><tr><th>סוג</th><th>סכום</th></tr></thead>
    <tbody>${authorityRows}</tbody>
  </table>` : ''}

  <p class="muted">נשלח אוטומטית בעת סגירת חודש ${label}.</p>
</body>
</html>`

        await sendSummaryEmail({
          to: accountantEmail,
          subject: `סיכום חודשי — ${label}${businessName ? ` | ${businessName}` : ''}`,
          html,
        })
      }
    }
  } catch (err) {
    emailWarning = err instanceof Error ? err.message : 'שגיאה בשליחת המייל'
  }

  return { success: true, emailWarning }
}

export async function updatePaycheckPercent(percent: number) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'לא מחובר' }

  const { error } = await supabase
    .from('settings')
    .upsert({ user_id: user.id, paycheck_percent: percent }, { onConflict: 'user_id' })
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}
