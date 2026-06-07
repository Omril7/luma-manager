import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSummaryEmail } from '@/lib/email'

const MONTH_NAMES_HE = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

function fmt(n: number) {
  return n.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 })
}

function monthLabel(year: number, month: number) {
  return `${MONTH_NAMES_HE[month - 1]} ${year}`
}

type Receipt = {
  id: string
  cloudinary_url: string
  file_type: string | null
}

type InstallmentRow = {
  id: string
  amount: number
  vat_amount: number
  due_month: string
  expenses: {
    id: string
    description: string
    is_personal: boolean
    transaction_date: string
    expense_categories: { name: string; is_vat_recognized: boolean } | null
    receipts: Receipt[]
  }
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const body = await req.json() as { year: number; month: number }
  const { year, month } = body
  if (!year || !month) return NextResponse.json({ error: 'חסרים שדות year ו-month' }, { status: 400 })

  const { data: settings } = await supabase
    .from('settings')
    .select('gmail_user, gmail_app_password, business_name, vat_rate')
    .eq('user_id', user.id)
    .single()

  if (!settings?.gmail_user || !settings?.gmail_app_password) {
    return NextResponse.json({ error: 'הגדרות Gmail חסרות — אנא הגדר בעמוד ההגדרות' }, { status: 400 })
  }

  const monthKey = `${year}-${String(month).padStart(2, '0')}`

  const { data: raw } = await supabase
    .from('expense_installments')
    .select(`
      id, amount, vat_amount, due_month,
      expenses!inner(
        id, description, is_personal, transaction_date,
        expense_categories(name, is_vat_recognized),
        receipts(id, cloudinary_url, file_type)
      )
    `)
    .eq('user_id', user.id)
    .like('due_month', `${monthKey}%`)

  if (!raw) return NextResponse.json({ error: 'שגיאה בטעינת נתונים' }, { status: 500 })

  const rows = raw as unknown as InstallmentRow[]

  const vatRecognizedRows = rows.filter(
    r => !r.expenses.is_personal && r.expenses.expense_categories?.is_vat_recognized
  )
  const personalRows = rows.filter(r => r.expenses.is_personal)

  const totalVatRecognized = vatRecognizedRows.reduce((s, r) => s + r.amount, 0)
  const totalVat = vatRecognizedRows.reduce((s, r) => s + r.vat_amount, 0)
  const totalPersonal = personalRows.reduce((s, r) => s + r.amount, 0)

  const businessTableRows = vatRecognizedRows.map(r => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #eee">${new Date(r.expenses.transaction_date).toLocaleDateString('he-IL')}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee">${r.expenses.description}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee">${r.expenses.expense_categories?.name ?? '—'}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:left">${fmt(r.amount)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:left">${r.vat_amount > 0 ? fmt(r.vat_amount) : '—'}</td>
    </tr>`).join('')

  const personalTableRows = personalRows.map(r => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #eee">${new Date(r.expenses.transaction_date).toLocaleDateString('he-IL')}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee">${r.expenses.description}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:left">${fmt(r.amount)}</td>
    </tr>`).join('')

  const label = monthLabel(year, month)
  const businessName = settings.business_name ?? ''

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"><style>
  body{font-family:Arial,sans-serif;direction:rtl;color:#111;padding:24px}
  h1{color:#1e40af}
  h2{color:#374151;border-bottom:2px solid #e5e7eb;padding-bottom:6px;margin-top:32px}
  table{width:100%;border-collapse:collapse;margin-bottom:16px}
  th{background:#f3f4f6;padding:8px;text-align:right;font-weight:600}
  .footer-row td{font-weight:bold;background:#f9fafb}
  p{color:#6b7280}
</style></head>
<body>
  <h1>סיכום הוצאות — ${label}${businessName ? ` | ${businessName}` : ''}</h1>

  <h2>הוצאות עסקיות מוכרות מע"מ</h2>
  ${vatRecognizedRows.length > 0 ? `
  <table>
    <thead><tr>
      <th>תאריך</th><th>תיאור</th><th>קטגוריה</th><th>סכום</th><th>מע"מ</th>
    </tr></thead>
    <tbody>
      ${businessTableRows}
      <tr class="footer-row">
        <td colspan="3">סה"כ:</td>
        <td>${fmt(totalVatRecognized)}</td>
        <td>מע"מ מוכר: ${fmt(totalVat)}</td>
      </tr>
    </tbody>
  </table>` : '<p>אין הוצאות עסקיות מוכרות מע"מ לחודש זה.</p>'}

  <h2>הוצאות אישיות (לידיעה בלבד)</h2>
  ${personalRows.length > 0 ? `
  <table>
    <thead><tr>
      <th>תאריך</th><th>תיאור</th><th>סכום</th>
    </tr></thead>
    <tbody>
      ${personalTableRows}
      <tr class="footer-row">
        <td colspan="2">סה"כ:</td>
        <td>${fmt(totalPersonal)}</td>
      </tr>
    </tbody>
  </table>` : '<p>אין הוצאות אישיות לחודש זה.</p>'}
</body>
</html>`

  // Download receipt files and attach
  const allReceipts = rows.flatMap(r => r.expenses.receipts)
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
    } catch {
      // Skip failed downloads silently
    }
  }

  try {
    await sendSummaryEmail({
      to: settings.gmail_user,
      subject: `סיכום הוצאות ${label}${businessName ? ` — ${businessName}` : ''}`,
      html,
      attachments,
      gmailUser: settings.gmail_user,
      gmailAppPassword: settings.gmail_app_password,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'שגיאה בשליחת המייל'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    stats: {
      vatRecognizedCount: vatRecognizedRows.length,
      personalCount: personalRows.length,
      attachmentCount: attachments.length,
    },
  })
}
