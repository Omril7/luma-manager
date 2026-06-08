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
        supabase.from('expense_installments')
          .select('amount, expense_id')
          .eq('user_id', user.id)
          .like('due_month', `${monthKey}%`),
        supabase.from('authority_payments').select('type, amount').eq('user_id', user.id).like('payment_month', `${monthKey}%`),
      ])

      const accountantEmail = settingsRes.data?.accountant_email
      if (accountantEmail) {
        const businessName = settingsRes.data?.business_name ?? ''
        const paycheckPct = settingsRes.data?.paycheck_percent ?? 30

        const totalIncome = (incomeRes.data ?? []).reduce((s, r) => s + r.final_price, 0)

        const installments = installmentsRes.data ?? []
        const totalExpenses = installments.reduce((s, r) => s + r.amount, 0)
        const grossProfit = totalIncome - totalExpenses
        const salary = grossProfit * (paycheckPct / 100)
        const authorityPayments = authorityRes.data ?? []
        const authorityTotal = authorityPayments.reduce((s, r) => s + r.amount, 0)

        // Fetch receipts directly by expense IDs — avoids fragile nested join
        const expenseIds = installments.map(r => r.expense_id).filter(Boolean)
        const receiptsRes = expenseIds.length > 0
          ? await supabase.from('receipts').select('id, cloudinary_url, file_type').eq('user_id', user.id).in('expense_id', expenseIds)
          : { data: [] }
        const allReceipts = receiptsRes.data ?? []
        const attachments: { filename: string; content: Buffer; contentType: string }[] = []
        for (const receipt of allReceipts) {
          try {
            const res = await fetch(receipt.cloudinary_url)
            if (!res.ok) continue
            const buf = Buffer.from(await res.arrayBuffer())
            const ext = receipt.file_type === 'pdf' ? 'pdf' : 'jpg'
            attachments.push({
              filename: `receipt-${receipt.id}.${ext}`,
              content: buf,
              contentType: receipt.file_type === 'pdf' ? 'application/pdf' : 'image/jpeg',
            })
          } catch { /* skip failed downloads */ }
        }

        const TYPE_LABELS: Record<string, string> = {
          income_tax: 'מס הכנסה',
          social_security: 'ביטוח לאומי',
          vat: 'מע"מ',
        }

        const TD = 'padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:15px;direction:rtl'
        const TH = 'padding:10px 14px;background:#f3f4f6;font-weight:600;text-align:right;font-size:14px;color:#374151'

        const authorityRows = authorityPayments.map(p =>
          `<tr>
            <td style="${TD}">${TYPE_LABELS[p.type] ?? p.type}</td>
            <td style="${TD};font-weight:600;color:#111">${ils(p.amount)}</td>
          </tr>`
        ).join('')

        const label = `${MONTH_NAMES_HE[month - 1]} ${year}`

        const row = (label: string, value: string, highlight = false) =>
          `<tr>
            <td style="padding:11px 16px;color:#6b7280;font-size:15px;direction:rtl;border-bottom:1px solid #f0f0f0">${label}</td>
            <td style="padding:11px 16px;font-weight:600;font-size:15px;direction:rtl;border-bottom:1px solid #f0f0f0;${highlight ? 'color:#059669' : 'color:#111'}">${value}</td>
          </tr>`

        const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>סיכום חודשי — ${label}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;direction:rtl">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">

        <!-- Header -->
        <tr><td style="background:#1e3a5f;padding:28px 32px;direction:rtl">
          <p style="margin:0;font-size:13px;color:#93c5fd;font-weight:500;letter-spacing:0.5px">סיכום חודשי</p>
          <h1 style="margin:6px 0 2px;font-size:22px;color:#ffffff;font-weight:700">${label}${businessName ? ` — ${businessName}` : ''}</h1>
          <p style="margin:0;font-size:13px;color:#93c5fd">החודש נסגר ואושר ✓</p>
        </td></tr>

        <!-- Cash flow -->
        <tr><td style="padding:24px 32px 8px;direction:rtl">
          <h2 style="margin:0 0 12px;font-size:15px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.4px;border-bottom:2px solid #e5e7eb;padding-bottom:8px">תזרים מזומנים</h2>
        </td></tr>
        <tr><td style="padding:0 16px 8px;direction:rtl">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
            ${row('יתרה פתיחה', ils(openingBalance))}
            ${row('סה"כ הכנסות', ils(totalIncome), true)}
            ${row('סה"כ הוצאות עסקיות', ils(totalExpenses))}
            ${row('רווח גולמי', ils(grossProfit))}
            ${row(`משכורת (${paycheckPct}%)`, ils(salary))}
            ${authorityTotal > 0 ? row('תשלומי רשויות', ils(authorityTotal)) : ''}
            <tr>
              <td style="padding:14px 16px;color:#111;font-size:16px;font-weight:700;direction:rtl;background:#f9fafb">יתרה סגירה</td>
              <td style="padding:14px 16px;font-size:16px;font-weight:700;color:#1e3a5f;direction:rtl;background:#f9fafb">${ils(closingBalance)}</td>
            </tr>
          </table>
        </td></tr>

        <!-- Authority payments -->
        ${authorityPayments.length > 0 ? `
        <tr><td style="padding:24px 32px 8px;direction:rtl">
          <h2 style="margin:0 0 12px;font-size:15px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.4px;border-bottom:2px solid #e5e7eb;padding-bottom:8px">תשלומי רשויות</h2>
        </td></tr>
        <tr><td style="padding:0 16px 8px;direction:rtl">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
            <thead><tr>
              <th style="${TH}">סוג</th>
              <th style="${TH}">סכום</th>
            </tr></thead>
            <tbody>${authorityRows}</tbody>
          </table>
        </td></tr>` : ''}

        <!-- Receipts note -->
        ${attachments.length > 0 ? `
        <tr><td style="padding:16px 32px 8px;direction:rtl">
          <p style="margin:0;font-size:13px;color:#6b7280;background:#f9fafb;border-radius:8px;padding:12px 16px;border:1px solid #e5e7eb">
            📎 מצורפות ${attachments.length} קבלות לחודש ${label}
          </p>
        </td></tr>` : ''}

        <!-- Footer -->
        <tr><td style="padding:20px 32px 28px;direction:rtl">
          <p style="margin:0;font-size:12px;color:#9ca3af">נשלח אוטומטית בעת סגירת חודש ${label}.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

        await sendSummaryEmail({
          to: accountantEmail,
          subject: `סיכום חודשי — ${label}${businessName ? ` | ${businessName}` : ''}`,
          html,
          attachments,
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
