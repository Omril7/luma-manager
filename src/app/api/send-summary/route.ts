import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSummaryEmail } from '@/lib/email'
import { formatILS } from '@/lib/utils'

const MONTH_NAMES_HE = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

function monthLabel(year: number, month: number) {
  return `${MONTH_NAMES_HE[month - 1]} ${year}`
}

type InstallmentRow = {
  id: string
  amount: number
  vat_amount: number
  due_month: string
  installment_number: number
  expenses: {
    id: string
    description: string
    is_personal: boolean
    is_recurring: boolean
    transaction_date: string
    expense_categories: { name: string; is_vat_recognized: boolean } | null
  }
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const body = await req.json() as { year: number; month: number }
  const { year, month } = body
  if (!year || !month) return NextResponse.json({ error: 'חסרים שדות year ו-month' }, { status: 400 })

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return NextResponse.json({ error: 'הגדרות SMTP חסרות בשרת — פנה למנהל המערכת' }, { status: 500 })
  }

  const { data: settings } = await supabase
    .from('settings')
    .select('accountant_email, business_name, vat_rate')
    .eq('user_id', user.id)
    .single()

  if (!settings?.accountant_email) {
    return NextResponse.json({ error: 'לא הוגדרה כתובת מייל של רואה החשבון — אנא הגדר בעמוד ההגדרות' }, { status: 400 })
  }

  const mm = String(month).padStart(2, '0')
  const startOfMonth = `${year}-${mm}-01`
  const nextYear = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const startOfNextMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

  const { data: raw, error: queryError } = await supabase
    .from('expense_installments')
    .select(`
      id, amount, vat_amount, due_month, installment_number,
      expenses!inner(
        id, description, is_personal, is_recurring, transaction_date,
        expense_categories(name, is_vat_recognized)
      )
    `)
    .eq('user_id', user.id)
    .gte('due_month', startOfMonth)
    .lt('due_month', startOfNextMonth)

  if (queryError || !raw) {
    return NextResponse.json({ error: queryError?.message ?? 'שגיאה בטעינת נתונים' }, { status: 500 })
  }

  const rows = raw as unknown as InstallmentRow[]

  // Query receipts separately — nested joins through !inner are unreliable
  const expenseIds = Array.from(new Set(rows.map(r => r.expenses.id)))
  const { data: receiptsData } = expenseIds.length > 0
    ? await supabase
        .from('receipts')
        .select('id, expense_id, cloudinary_url, file_type, installment_id')
        .in('expense_id', expenseIds)
        .eq('user_id', user.id)
    : { data: [] }

  // Determine which receipts belong to this specific month:
  // - Recurring: only if receipt.installment_id matches the installment for this month
  // - Non-recurring: only on installment #1 (the purchase month), unlinked receipts only
  const qualifyingReceiptIds = new Set<string>()
  for (const row of rows) {
    for (const receipt of receiptsData ?? []) {
      if (receipt.expense_id !== row.expenses.id) continue
      if (row.expenses.is_recurring) {
        if (receipt.installment_id === row.id) qualifyingReceiptIds.add(receipt.id)
      } else {
        if (row.installment_number === 1 && receipt.installment_id === null) qualifyingReceiptIds.add(receipt.id)
      }
    }
  }

  const vatRecognizedRows = rows.filter(
    r => !r.expenses.is_personal && r.expenses.expense_categories?.is_vat_recognized
  )
  const personalRows = rows.filter(r => r.expenses.is_personal)

  const totalVatRecognized = vatRecognizedRows.reduce((s, r) => s + r.amount, 0)
  const totalVat = vatRecognizedRows.reduce((s, r) => s + r.vat_amount, 0)
  // Personal expenses are informational — show what was actually paid (gross)
  const totalPersonal = personalRows.reduce((s, r) => s + r.amount + r.vat_amount, 0)

  // Inline style constants — Gmail strips <style> blocks, everything must be inline
  const FONT = 'font-family:Arial,Helvetica,sans-serif;'
  const TH = `${FONT}padding:10px 14px;text-align:right;direction:rtl;font-size:12px;font-weight:700;color:#6b7280;background:#f9fafb;border-bottom:2px solid #e5e7eb;`
  const TD = `${FONT}padding:10px 14px;text-align:right;direction:rtl;font-size:14px;color:#374151;border-bottom:1px solid #e5e7eb;`
  const TD_NUM = `${TD}white-space:nowrap;`
  const TD_FOOT = `${FONT}padding:10px 14px;text-align:right;direction:rtl;font-size:14px;font-weight:700;background:#eff6ff;color:#1e40af;white-space:nowrap;`
  const TD_FOOT_PERSONAL = `${FONT}padding:10px 14px;text-align:right;direction:rtl;font-size:14px;font-weight:700;background:#f9fafb;color:#374151;white-space:nowrap;`

  const label = monthLabel(year, month)
  const businessName = settings.business_name ?? ''

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <style>
    /* Clients that support <style>: iOS Mail, Apple Mail, Gmail mobile app */
    @media only screen and (max-width:600px) {
      .mobile-stack td,
      .mobile-stack th { display:block !important; width:100% !important; box-sizing:border-box !important; }
      .mobile-stack thead { display:none !important; }
      .mobile-stack tr { display:block !important; margin-bottom:12px !important; border:1px solid #e5e7eb !important; border-radius:8px !important; }
      .mobile-stack td:before { font-weight:700; color:#6b7280; font-size:11px; display:block; }
      .outer-pad { padding:12px 8px !important; }
      .card-pad { padding:20px 16px !important; }
    }
  </style>
</head>
<body dir="rtl" style="${FONT}margin:0;padding:0;background:#f3f4f6;direction:rtl;">
<table dir="rtl" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;">
  <tr dir="rtl"><td dir="rtl" align="right" class="outer-pad" style="padding:24px 16px;">
  <table dir="rtl" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;">

    <!-- Header -->
    <tr dir="rtl"><td dir="rtl" style="background:#1e40af;border-radius:12px 12px 0 0;padding:28px 32px;">
      <h1 dir="rtl" style="${FONT}margin:0;font-size:22px;color:#ffffff;font-weight:700;direction:rtl;text-align:right;">סיכום הוצאות &mdash; ${label}</h1>
      ${businessName ? `<p dir="rtl" style="${FONT}margin:6px 0 0;color:#bfdbfe;font-size:14px;direction:rtl;text-align:right;">${businessName}</p>` : ''}
    </td></tr>

    <!-- Card -->
    <tr dir="rtl"><td dir="rtl" class="card-pad" style="background:#ffffff;border-radius:0 0 12px 12px;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;">

      <!-- Section: business expenses -->
      <h2 dir="rtl" style="${FONT}margin:0 0 16px;font-size:16px;font-weight:700;color:#111827;border-bottom:2px solid #e5e7eb;padding-bottom:10px;direction:rtl;text-align:right;">הוצאות עסקיות מוכרות מע&quot;מ</h2>

      ${vatRecognizedRows.length > 0 ? `
      <table dir="rtl" width="100%" cellpadding="0" cellspacing="0" class="mobile-stack" style="border-collapse:collapse;margin-bottom:8px;">
        <thead>
          <tr dir="rtl">
            <th dir="rtl" style="${TH}">תאריך</th>
            <th dir="rtl" style="${TH}">תיאור</th>
            <th dir="rtl" style="${TH}">קטגוריה</th>
            <th dir="rtl" style="${TH}">סכום ללא מע&quot;מ</th>
            <th dir="rtl" style="${TH}">מע&quot;מ</th>
          </tr>
        </thead>
        <tbody>
          ${vatRecognizedRows.map(r => `
          <tr dir="rtl">
            <td dir="rtl" style="${TD}">${new Date(r.expenses.transaction_date).toLocaleDateString('he-IL')}</td>
            <td dir="rtl" style="${TD}">${r.expenses.description}</td>
            <td dir="rtl" style="${TD}">${r.expenses.expense_categories?.name ?? '—'}</td>
            <td dir="rtl" style="${TD_NUM}">${formatILS(r.amount, 2)}</td>
            <td dir="rtl" style="${TD_NUM}">${r.vat_amount > 0 ? formatILS(r.vat_amount, 2) : '—'}</td>
          </tr>`).join('')}
          <tr dir="rtl">
            <td dir="rtl" colspan="3" style="${TD_FOOT}">סה&quot;כ</td>
            <td dir="rtl" style="${TD_FOOT}">${formatILS(totalVatRecognized, 2)}</td>
            <td dir="rtl" style="${TD_FOOT}">מע&quot;מ מוכר: ${formatILS(totalVat, 2)}</td>
          </tr>
        </tbody>
      </table>` : `<p dir="rtl" style="${FONT}color:#6b7280;font-size:14px;margin:0 0 24px;direction:rtl;text-align:right;">אין הוצאות עסקיות מוכרות מע&quot;מ לחודש זה.</p>`}

      <!-- Section: personal expenses -->
      <h2 dir="rtl" style="${FONT}margin:32px 0 16px;font-size:16px;font-weight:700;color:#111827;border-bottom:2px solid #e5e7eb;padding-bottom:10px;direction:rtl;text-align:right;">הוצאות אישיות <span style="font-weight:400;color:#6b7280;">(לידיעה בלבד)</span></h2>

      ${personalRows.length > 0 ? `
      <table dir="rtl" width="100%" cellpadding="0" cellspacing="0" class="mobile-stack" style="border-collapse:collapse;">
        <thead>
          <tr dir="rtl">
            <th dir="rtl" style="${TH}">תאריך</th>
            <th dir="rtl" style="${TH}">תיאור</th>
            <th dir="rtl" style="${TH}">סכום</th>
          </tr>
        </thead>
        <tbody>
          ${personalRows.map(r => `
          <tr dir="rtl">
            <td dir="rtl" style="${TD}">${new Date(r.expenses.transaction_date).toLocaleDateString('he-IL')}</td>
            <td dir="rtl" style="${TD}">${r.expenses.description}</td>
            <td dir="rtl" style="${TD_NUM}">${formatILS(r.amount + r.vat_amount, 2)}</td>
          </tr>`).join('')}
          <tr dir="rtl">
            <td dir="rtl" colspan="2" style="${TD_FOOT_PERSONAL}">סה&quot;כ</td>
            <td dir="rtl" style="${TD_FOOT_PERSONAL}">${formatILS(totalPersonal, 2)}</td>
          </tr>
        </tbody>
      </table>` : `<p dir="rtl" style="${FONT}color:#6b7280;font-size:14px;margin:0;direction:rtl;text-align:right;">אין הוצאות אישיות לחודש זה.</p>`}

    </td></tr><!-- /card -->

    <!-- Footer -->
    <tr dir="rtl"><td dir="rtl" style="padding:16px 0 0;" align="center">
      <p style="${FONT}font-size:12px;color:#9ca3af;margin:0;text-align:center;">נשלח אוטומטית ממערכת לומה</p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`

  // Download receipt files and attach
  const qualifyingReceipts = (receiptsData ?? []).filter(r => qualifyingReceiptIds.has(r.id))
  const attachments: { filename: string; content: Buffer; contentType: string }[] = []

  for (const receipt of qualifyingReceipts) {
    if (!receipt.cloudinary_url) continue
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
      // skip failed downloads
    }
  }

  try {
    await sendSummaryEmail({
      to: settings.accountant_email,
      subject: `סיכום הוצאות ${label}${businessName ? ` — ${businessName}` : ''}`,
      html,
      attachments,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'שגיאה בשליחת המייל'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
