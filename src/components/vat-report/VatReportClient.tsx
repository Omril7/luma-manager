'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { extractVat } from '@/lib/vat'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'

export type IncomeRow = {
  id: string
  product_name: string
  final_price: number
  income_date: string
}

export type InstallmentRow = {
  id: string
  due_month: string
  amount: number
  vat_amount: number
  expenses: {
    description: string
    is_personal: boolean
    expense_categories: { name: string; is_vat_recognized: boolean } | null
  } | null
}

export type VatPaymentRow = {
  id: string
  amount: number
  payment_month: string
}

interface Props {
  vatRate: number
  vatReportFrequency: 'monthly' | 'bimonthly'
  incomeRows: IncomeRow[]
  installments: InstallmentRow[]
  vatPayments: VatPaymentRow[]
}

const BIMONTHLY_LABELS = [
  'ינואר - פברואר',
  'מרץ - אפריל',
  'מאי - יוני',
  'יולי - אוגוסט',
  'ספטמבר - אוקטובר',
  'נובמבר - דצמבר',
]

const MONTH_LABELS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

function ils(n: number) {
  return n.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 })
}

export default function VatReportClient({ vatRate, vatReportFrequency, incomeRows, installments, vatPayments }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [periodIdx, setPeriodIdx] = useState(() =>
    vatReportFrequency === 'monthly' ? now.getMonth() : Math.floor(now.getMonth() / 2)
  )

  const periodLabels = vatReportFrequency === 'monthly' ? MONTH_LABELS : BIMONTHLY_LABELS
  const numPeriods   = vatReportFrequency === 'monthly' ? 12 : 6

  function monthInPeriod(dateStr: string) {
    const [y, m] = dateStr.slice(0, 7).split('-').map(Number)
    if (y !== year) return false
    if (vatReportFrequency === 'monthly') {
      return m === periodIdx + 1
    }
    const startMonth = periodIdx * 2 + 1
    return m >= startMonth && m <= startMonth + 1
  }

  const currentPeriodLabel = periodLabels[periodIdx]

  const periodIncome = incomeRows.filter(r => monthInPeriod(r.income_date))
  const periodInstallments = installments.filter(
    r => monthInPeriod(r.due_month) && r.expenses?.expense_categories?.is_vat_recognized === true
  )
  const periodVatPaid = vatPayments.filter(r => monthInPeriod(r.payment_month))

  const outputVat = periodIncome.reduce((sum, r) => sum + extractVat(r.final_price, vatRate), 0)
  const inputVat = periodInstallments.reduce((sum, r) => sum + r.vat_amount, 0)
  const netVat = outputVat - inputVat
  const alreadyPaid = periodVatPaid.reduce((sum, r) => sum + r.amount, 0)
  const remaining = netVat - alreadyPaid

  const netVatSublabel = netVat > 0 ? 'לתשלום' : netVat < 0 ? 'להחזר מהרשויות' : 'מאוזן'
  const netVatColor = netVat > 0 ? 'red' as const : 'green' as const

  const remainingSublabel = remaining > 0 ? 'עדיין לתשלום' : remaining < 0 ? 'זכות - שולם יתר' : 'שולם במלואו'
  const remainingColor = remaining > 0 ? 'red' as const : 'green' as const

  const incomeColumns: DataTableColumn<IncomeRow>[] = [
    {
      key: 'date',
      header: 'תאריך',
      cell: r => {
        const d = r.income_date.slice(0, 10)
        return new Date(d + 'T00:00:00').toLocaleDateString('he-IL')
      },
    },
    {
      key: 'product',
      header: 'מוצר / שירות',
      cell: r => r.product_name,
    },
    {
      key: 'amount',
      header: 'סכום כולל מע"מ',
      cell: r => ils(r.final_price),
    },
    {
      key: 'vat',
      header: 'מע"מ עסקאות',
      className: 'text-amber-600 dark:text-amber-400 font-medium',
      cell: r => ils(extractVat(r.final_price, vatRate)),
    },
  ]

  const installmentColumns: DataTableColumn<InstallmentRow>[] = [
    {
      key: 'month',
      header: 'חודש',
      cell: r => {
        const d = new Date(r.due_month.slice(0, 10) + 'T00:00:00')
        return `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`
      },
    },
    {
      key: 'desc',
      header: 'תיאור',
      cell: r => r.expenses?.description ?? '—',
    },
    {
      key: 'cat',
      header: 'קטגוריה',
      cell: r => r.expenses?.expense_categories?.name ?? '—',
    },
    {
      key: 'amount',
      header: 'סכום',
      cell: r => ils(r.amount),
    },
    {
      key: 'vat',
      header: 'מע"מ תשומות',
      className: 'text-green-700 dark:text-green-400 font-medium',
      cell: r => ils(r.vat_amount),
    },
  ]

  const incomeFooter = periodIncome.length > 0 ? (
    <tr className="font-semibold bg-muted/50">
      <td className="py-2.5" colSpan={2}>סה&quot;כ</td>
      <td className="py-2.5">{ils(periodIncome.reduce((s, r) => s + r.final_price, 0))}</td>
      <td className="py-2.5 text-amber-600 dark:text-amber-400">{ils(outputVat)}</td>
    </tr>
  ) : undefined

  const installmentFooter = periodInstallments.length > 0 ? (
    <tr className="font-semibold bg-muted/50">
      <td className="py-2.5" colSpan={3}>סה&quot;כ</td>
      <td className="py-2.5">{ils(periodInstallments.reduce((s, r) => s + r.amount, 0))}</td>
      <td className="py-2.5 text-green-700 dark:text-green-400">{ils(inputVat)}</td>
    </tr>
  ) : undefined

  return (
    <div className="space-y-8">
      {/* Header + Period Picker */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">דוח מע&quot;מ</h1>
          <p className="text-sm text-muted-foreground mt-1">שיעור מע&quot;מ: {vatRate}%</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Year selector */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setYear(y => y - 1)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="שנה קודמת"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold tabular-nums w-12 text-center">{year}</span>
            <button
              onClick={() => setYear(y => y + 1)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="שנה הבאה"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Period selector (monthly = 12 pills / bimonthly = 6 pills) */}
          <div className={`flex flex-wrap gap-1.5 justify-end ${vatReportFrequency === 'monthly' ? 'max-w-xs' : ''}`}>
            {Array.from({ length: numPeriods }, (_, idx) => (
              <button
                key={idx}
                onClick={() => setPeriodIdx(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  idx === periodIdx
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
              >
                {periodLabels[idx]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        <SummaryCard
          label='מע"מ עסקאות'
          sublabel="על הכנסות"
          value={ils(outputVat)}
          color="amber"
        />
        <SummaryCard
          label='מע"מ תשומות'
          sublabel="על הוצאות מוכרות"
          value={ils(inputVat)}
          color="green"
        />
        <SummaryCard
          label='מע"מ לתשלום'
          sublabel={netVatSublabel}
          value={ils(Math.abs(netVat))}
          color={netVatColor}
          highlight
        />
        <SummaryCard
          label="שולם לרשויות"
          sublabel='תשלומי מע"מ שדווחו'
          value={ils(alreadyPaid)}
          color="neutral"
        />
        <SummaryCard
          label="יתרה לתשלום"
          sublabel={remainingSublabel}
          value={ils(Math.abs(remaining))}
          color={remainingColor}
          highlight
        />
      </div>

      {/* Income table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            הכנסות — {currentPeriodLabel} {year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={incomeColumns}
            data={periodIncome}
            rowKey={r => r.id}
            footerRow={incomeFooter}
            emptyMessage="אין הכנסות בתקופה זו"
          />
        </CardContent>
      </Card>

      {/* Recognized expenses table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            הוצאות מוכרות מע&quot;מ — {currentPeriodLabel} {year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={installmentColumns}
            data={periodInstallments}
            rowKey={r => r.id}
            footerRow={installmentFooter}
            emptyMessage='אין הוצאות מוכרות מע"מ בתקופה זו'
          />
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({
  label,
  sublabel,
  value,
  color,
  highlight,
}: {
  label: string
  sublabel?: string
  value: string
  color: 'amber' | 'green' | 'red' | 'neutral'
  highlight?: boolean
}) {
  const colorClass = {
    amber: 'text-amber-600 dark:text-amber-400',
    green: 'text-green-700 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    neutral: 'text-foreground',
  }[color]

  return (
    <Card className={highlight ? 'border-primary/30' : ''}>
      <CardContent className="p-4 space-y-0.5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground/60">{sublabel}</p>}
        <p className={`text-xl font-bold pt-0.5 ${colorClass}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
