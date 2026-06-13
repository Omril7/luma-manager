import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import JSZip from 'jszip'

type ReceiptRow = {
  id: string
  cloudinary_url: string | null
  file_type: string | null
}

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') ?? '', 10)
  const month = parseInt(searchParams.get('month') ?? '', 10)
  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json({ error: 'שנה וחודש נדרשים' }, { status: 400 })
  }

  const mm = String(month).padStart(2, '0')
  const startDate = `${year}-${mm}-01`
  const nextYear = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

  const { data: expenses } = await supabase
    .from('expenses')
    .select('id')
    .eq('user_id', user.id)
    .gte('transaction_date', startDate)
    .lt('transaction_date', endDate)

  const expenseIds = (expenses ?? []).map(e => e.id)
  if (expenseIds.length === 0) {
    return NextResponse.json({ error: 'אין הוצאות לחודש זה' }, { status: 404 })
  }

  const { data: raw, error } = await supabase
    .from('receipts')
    .select('id, cloudinary_url, file_type')
    .eq('user_id', user.id)
    .is('cleaned_up_at', null)
    .in('expense_id', expenseIds)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const receipts = (raw ?? []) as ReceiptRow[]
  if (receipts.length === 0) {
    return NextResponse.json({ error: 'אין קבצים לחודש זה' }, { status: 404 })
  }

  const zip = new JSZip()
  for (const receipt of receipts) {
    if (!receipt.cloudinary_url) continue
    try {
      const res = await fetch(receipt.cloudinary_url)
      if (!res.ok) continue
      const buf = await res.arrayBuffer()
      const ext = receipt.file_type === 'pdf' ? 'pdf' : 'jpg'
      zip.file(`receipt-${receipt.id}.${ext}`, buf)
    } catch {
      // skip failed individual downloads
    }
  }

  const content = await zip.generateAsync({ type: 'nodebuffer' })

  return new NextResponse(new Uint8Array(content), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="receipts-${year}-${mm}.zip"`,
      'Content-Length': content.length.toString(),
    },
  })
}
