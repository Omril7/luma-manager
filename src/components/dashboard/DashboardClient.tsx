'use client'

import { useState, useTransition, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createAuthorityPayment, deleteAuthorityPayment, approveMonthClose, deleteSnapshot } from '@/app/(dashboard)/dashboard/actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MonthPicker, type MonthPickerValue } from '@/components/ui/month-picker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type DataTableColumn, type DataTablePagination } from '@/components/ui/data-table'
import { Trash2, Plus, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface AuthorityPayment {
  id: string
  type: string
  amount: number
  payment_month: string
  notes: string | null
}

interface MonthRow {
  month: string
  label: string
  opening: number
  income: number
  expenses: number
  authority: number
  income_tax: number
  social_security: number
  vat: number
  salary: number
  closing: number
  isLive: boolean
  isApproved: boolean
}

interface Props {
  currentMonth: string
  authorityPayments: AuthorityPayment[]
  paycheckPercent: number
  balanceRows: MonthRow[]
}

const MONTH_LABELS: Record<string, string> = {
  '01': 'ינואר', '02': 'פברואר', '03': 'מרץ', '04': 'אפריל',
  '05': 'מאי', '06': 'יוני', '07': 'יולי', '08': 'אוגוסט',
  '09': 'ספטמבר', '10': 'אוקטובר', '11': 'נובמבר', '12': 'דצמבר',
}

const TYPE_LABELS: Record<string, string> = {
  income_tax: 'מס הכנסה',
  social_security: 'ביטוח לאומי',
  vat: 'מע"מ',
}

function ils(n: number) {
  return n.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })
}

function monthLabel(ym: string) {
  const [year, month] = ym.split('-')
  return `${MONTH_LABELS[month] ?? month} ${year}`
}

function toMonthPickerValue(ym: string): MonthPickerValue {
  const [yr, mo] = ym.split('-')
  return { year: Number(yr), month: Number(mo) }
}

export default function DashboardClient({
  currentMonth,
  authorityPayments,
  paycheckPercent,
  balanceRows,
}: Props) {
  const router = useRouter()
  const [selectedMonthValue, setSelectedMonthValue] = useState<MonthPickerValue>(
    () => toMonthPickerValue(currentMonth)
  )
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [confirmClose, setConfirmClose] = useState<{ month: string; closing: number; opening: number } | null>(null)
  const [confirmDeleteSnapshot, setConfirmDeleteSnapshot] = useState<{ month: string; hasLaterSnapshots: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [addError, setAddError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const [paymentMonth, setPaymentMonth] = useState<MonthPickerValue>(
    () => toMonthPickerValue(currentMonth)
  )
  const [balancePage, setBalancePage] = useState(0)
  const BALANCE_PAGE_SIZE = 6
  const currentYear = new Date().getFullYear()
  const [chartYear, setChartYear] = useState(currentYear)

  const selectedMonth = `${selectedMonthValue.year}-${String(selectedMonthValue.month).padStart(2, '0')}`
  const selectedRow = balanceRows.find(r => r.month === selectedMonth)

  const displayIncome = selectedRow?.income ?? 0
  const displayExpenses = selectedRow?.expenses ?? 0
  const displayGrossProfit = displayIncome - displayExpenses
  const displaySalary = selectedRow?.salary ?? 0
  const displayAuthority = selectedRow?.authority ?? 0
  const displayMonthlyBalance = displayGrossProfit - displaySalary - displayAuthority

  const latestClosing = balanceRows[balanceRows.length - 1]?.closing ?? 0

  const closedMonthSet = new Set(balanceRows.filter(r => r.isApproved).map(r => r.month))
  const selectedPaymentYM = `${paymentMonth.year}-${String(paymentMonth.month).padStart(2, '0')}`
  const isAddingToClosedMonth = closedMonthSet.has(selectedPaymentYM)

  const filteredAuthorityPayments = authorityPayments.filter(
    p => p.payment_month.slice(0, 7) === selectedMonth
  )
  const filteredAuthorityTotal = filteredAuthorityPayments.reduce((s, p) => s + p.amount, 0)

  const availableYears = Array.from(new Set(balanceRows.map(r => Number(r.month.slice(0, 4))))).sort()
  const minYear = availableYears[0] ?? currentYear
  const maxYear = availableYears[availableYears.length - 1] ?? currentYear

  const chartData = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0')
    const key = `${chartYear}-${m}`
    const row = balanceRows.find(r => r.month === key)
    const income = row?.income ?? null
    const expenses = row?.expenses ?? null
    const profit = income !== null && expenses !== null ? income - expenses : null
    return { name: MONTH_LABELS[m], income, expenses, profit }
  })

  function handleDeletePayment(id: string) {
    startTransition(async () => {
      const res = await deleteAuthorityPayment(id)
      if (res && 'error' in res && res.error) toast.error(res.error)
      else toast.success('תשלום נמחק')
    })
  }

  function handleAddPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setAddError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createAuthorityPayment(null, fd)
      if (res && 'error' in res && res.error) {
        setAddError(res.error)
        toast.error(res.error)
      } else {
        toast.success('תשלום נוסף')
        setShowAddPayment(false)
        formRef.current?.reset()
      }
    })
  }

  function handleApprove() {
    if (!confirmClose) return
    startTransition(async () => {
      const res = await approveMonthClose(confirmClose.month, confirmClose.opening, confirmClose.closing)
      if (res && 'error' in res && res.error) {
        toast.error(res.error)
      } else {
        toast.success('החודש נסגר בהצלחה')
        router.refresh()
      }
      setConfirmClose(null)
    })
  }

  function handleDeleteSnapshot() {
    if (!confirmDeleteSnapshot) return
    startTransition(async () => {
      const res = await deleteSnapshot(confirmDeleteSnapshot.month)
      if (res && 'error' in res && res.error) toast.error(res.error)
      else {
        toast.success('החודש נפתח מחדש')
        router.refresh()
      }
      setConfirmDeleteSnapshot(null)
    })
  }

  const authorityColumns: DataTableColumn<AuthorityPayment>[] = [
    {
      key: 'type',
      header: 'סוג',
      cell: row => TYPE_LABELS[row.type] ?? row.type,
    },
    {
      key: 'amount',
      header: 'סכום',
      cell: row => ils(row.amount),
    },
    {
      key: 'notes',
      header: 'הערות',
      className: 'text-muted-foreground',
      cell: row => row.notes ?? '—',
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-10',
      cell: row => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDeletePayment(row.id)}
          disabled={isPending}
          className="text-red-500 hover:text-red-700 h-7 w-7 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  const authorityFooter = (
    <tr className="font-semibold bg-muted/50">
      <td className="py-2.5">סה&quot;כ</td>
      <td className="py-2.5">{ils(filteredAuthorityTotal)}</td>
      <td />
      <td />
    </tr>
  )

  const approvedMonths = balanceRows.filter(r => r.isApproved).map(r => r.month)

  const balanceColumns: DataTableColumn<MonthRow>[] = [
    {
      key: 'month',
      header: 'חודש',
      cell: row => (
        <span className="flex items-center gap-1">
          {monthLabel(row.month)}
          {row.isLive && <span className="text-xs text-primary">(שוטף)</span>}
        </span>
      ),
    },
    {
      key: 'opening',
      header: 'יתרה פתיחה',
      cell: row => ils(row.opening),
    },
    {
      key: 'income',
      header: 'הכנסות',
      className: 'text-green-700',
      cell: row => ils(row.income),
    },
    {
      key: 'expenses',
      header: 'הוצאות',
      className: 'text-red-600',
      cell: row => ils(row.expenses),
    },
    {
      key: 'income_tax',
      header: 'מס הכנסה',
      className: 'text-orange-600',
      cell: row => ils(row.income_tax),
    },
    {
      key: 'social_security',
      header: 'ביטוח לאומי',
      className: 'text-orange-600',
      cell: row => ils(row.social_security),
    },
    {
      key: 'vat',
      header: 'מע"מ',
      className: 'text-orange-600',
      cell: row => ils(row.vat),
    },
    {
      key: 'salary',
      header: 'משכורת',
      className: 'text-purple-600',
      cell: row => ils(row.salary),
    },
    {
      key: 'closing',
      header: 'יתרה סגירה',
      cell: row => (
        <span className={`font-semibold ${row.closing >= 0 ? 'text-green-700' : 'text-red-600'}`}>
          {ils(row.closing)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-24',
      cell: row => {
        if (row.isApproved) {
          return (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmDeleteSnapshot({
                month: row.month,
                hasLaterSnapshots: approvedMonths.some(m => m > row.month),
              })}
              className="text-xs h-7 px-2 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 ml-1" />
              פתח מחדש
            </Button>
          )
        }
        if (row.month < currentMonth) {
          return (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmClose({ month: row.month, closing: row.closing, opening: row.opening })}
              className="text-xs h-7 px-2"
            >
              <CheckCircle className="h-3 w-3 ml-1" />
              סגור חודש
            </Button>
          )
        }
        return null
      },
    },
  ]

  const balancePagination: DataTablePagination = {
    page: balancePage,
    pageSize: BALANCE_PAGE_SIZE,
    total: balanceRows.length,
    onPageChange: setBalancePage,
  }

  const FORECAST_SOURCE_MONTHS = 12
  const forecastSourceCount = Math.min(FORECAST_SOURCE_MONTHS, balanceRows.length)

  const forecastRows = useMemo(() => {
    const source = balanceRows.slice(-forecastSourceCount)
    if (source.length === 0) return []

    // ---- helpers -------------------------------------------------------

    /** Simple linear regression (least squares) over y-values indexed 0..n-1.
     *  Returns a function that evaluates the fitted line at an arbitrary x. */
    function linearTrend(values: number[]): (x: number) => number {
      const n = values.length
      if (n < 2) return () => values[0] ?? 0
      const xMean = (n - 1) / 2
      const yMean = values.reduce((s, v) => s + v, 0) / n
      let num = 0, den = 0
      for (let i = 0; i < n; i++) {
        num += (i - xMean) * (values[i] - yMean)
        den += (i - xMean) * (i - xMean)
      }
      const slope = den === 0 ? 0 : num / den
      const intercept = yMean - slope * xMean
      return (x: number) => intercept + slope * x
    }

    /** Recency-weighted average — later months count more (linear ramp). */
    function weightedAvg(values: number[]): number {
      const n = values.length
      if (n === 0) return 0
      let wSum = 0, vSum = 0
      for (let i = 0; i < n; i++) {
        const w = i + 1 // 1, 2, 3, ... n — most recent gets highest weight
        wSum += w
        vSum += w * values[i]
      }
      return vSum / wSum
    }

    /** Plain mean. */
    function mean(values: number[]): number {
      return values.length === 0 ? 0 : values.reduce((s, v) => s + v, 0) / values.length
    }

    /** Pearson correlation between values[i] and values[i - lag], for detecting cycles. */
    function autocorrelation(values: number[], lag: number): number {
      const n = values.length
      if (n <= lag + 1) return 0
      const a = values.slice(lag)
      const b = values.slice(0, n - lag)
      const aMean = mean(a), bMean = mean(b)
      let num = 0, denA = 0, denB = 0
      for (let i = 0; i < a.length; i++) {
        num += (a[i] - aMean) * (b[i] - bMean)
        denA += (a[i] - aMean) ** 2
        denB += (b[i] - bMean) ** 2
      }
      const den = Math.sqrt(denA * denB)
      return den === 0 ? 0 : num / den
    }

    /**
     * Forecast a single future point (`stepsAhead` months past the source window)
     * for a "smooth" series like income/expenses, by blending:
     *  - a linear trend fit over the whole source window (captures drift)
     *  - a recency-weighted average (captures recent level shifts)
     *  - a seasonal anchor: same calendar month last year, if enough history exists
     */
    function forecastSmooth(values: number[], stepsAhead: number, seasonalValue: number | null): number {
      const n = values.length
      const trendFn = linearTrend(values)
      const trendEstimate = trendFn(n - 1 + stepsAhead)
      const recencyEstimate = weightedAvg(values)

      // Blend trend + recency. Scale trend weight up with data length:
      // 2 pts → 0 (pure recency), 10+ pts → 0.5 (equal blend).
      const trendWeight = Math.min(0.5, (n - 2) / 8)
      let estimate = trendEstimate * trendWeight + recencyEstimate * (1 - trendWeight)

      // If we have a same-month-last-year data point, nudge the estimate toward it.
      // Modest weight: one seasonal data point shouldn't dominate a 12-month trend.
      if (seasonalValue !== null) {
        estimate = estimate * 0.7 + seasonalValue * 0.3
      }
      return estimate
    }

    /**
     * Forecast a single future point for a "lumpy/cyclical" series (taxes, VAT, social security),
     * which often arrive on a 2 or 3 month cycle rather than smoothly every month.
     * Detects the dominant cycle via autocorrelation; if found, projects from the matching
     * position in the cycle. Otherwise falls back to a recency-weighted average.
     */
    function forecastCyclical(values: number[], stepsAhead: number): number {
      const n = values.length
      if (n < 4) return weightedAvg(values)

      const candidateLags = [2, 3]
      let bestLag = 0
      let bestScore = 0.35 // minimum correlation to trust a cycle over a plain average
      for (const lag of candidateLags) {
        const score = autocorrelation(values, lag)
        if (score > bestScore) {
          bestScore = score
          bestLag = lag
        }
      }

      if (bestLag > 0) {
        // Index of the future point within the full series (source + forecast horizon)
        const targetIndex = n - 1 + stepsAhead
        // Walk back by the cycle length until we land on an observed value
        let refIndex = targetIndex
        while (refIndex >= n) refIndex -= bestLag
        if (refIndex >= 0 && refIndex < n) {
          // Blend the cyclical reference value with a light recency average,
          // so a single old spike doesn't get repeated forever unmoderated.
          return values[refIndex] * 0.7 + weightedAvg(values) * 0.3
        }
      }
      return weightedAvg(values)
    }

    const incomeVals = source.map(r => r.income)
    const expenseVals = source.map(r => r.expenses)
    const incomeTaxVals = source.map(r => r.income_tax)
    const socialSecurityVals = source.map(r => r.social_security)
    const vatVals = source.map(r => r.vat)

    // Salary is a step function (percentage-of-profit policy, or a fixed figure) —
    // carry forward the most recent actual value rather than averaging/trending it.
    const lastSalary = source[source.length - 1]?.salary ?? 0

    // Seasonal anchors: same calendar month one year back, if it exists in balanceRows
    // (not just the trimmed `source` window) — look it up by month key directly.
    function seasonalLookup(fn: (r: MonthRow) => number, targetMonth: string): number | null {
      const [yr, mo] = targetMonth.split('-').map(Number)
      const lastYearKey = `${yr - 1}-${String(mo).padStart(2, '0')}`
      const match = balanceRows.find(r => r.month === lastYearKey)
      return match ? fn(match) : null
    }

    const lastMonth = balanceRows[balanceRows.length - 1]?.month ?? currentMonth
    let opening = balanceRows[balanceRows.length - 1]?.closing ?? 0

    return Array.from({ length: 3 }, (_, i) => {
      const stepsAhead = i + 1
      const [yr, mo] = lastMonth.split('-').map(Number)
      const d = new Date(yr, mo - 1 + stepsAhead)
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

      const incomeSeasonal = seasonalLookup(r => r.income, month)
      const expensesSeasonal = seasonalLookup(r => r.expenses, month)

      const income = Math.max(0, forecastSmooth(incomeVals, stepsAhead, incomeSeasonal))
      const expenses = Math.max(0, forecastSmooth(expenseVals, stepsAhead, expensesSeasonal))
      const incomeTax = Math.max(0, forecastCyclical(incomeTaxVals, stepsAhead))
      const socialSecurity = Math.max(0, forecastCyclical(socialSecurityVals, stepsAhead))
      const vat = Math.max(0, forecastCyclical(vatVals, stepsAhead))
      const authority = incomeTax + socialSecurity + vat

      const grossP = income - expenses
      const salary = lastSalary
      const closing = opening + grossP - salary - authority

      const row: MonthRow = {
        month, label: month, opening,
        income, expenses,
        authority, income_tax: incomeTax, social_security: socialSecurity, vat,
        salary, closing, isLive: false, isApproved: false,
      }
      opening = closing
      return row
    })
  }, [balanceRows, forecastSourceCount, currentMonth])

  const forecastColumns: DataTableColumn<MonthRow>[] = [
    {
      key: 'month',
      header: 'חודש',
      cell: row => (
        <span className="flex items-center gap-1">
          {monthLabel(row.month)}
          <span className="text-xs text-muted-foreground">(תחזית)</span>
        </span>
      ),
    },
    { key: 'opening', header: 'יתרה פתיחה', cell: row => ils(row.opening) },
    { key: 'income', header: 'הכנסות', className: 'text-green-700', cell: row => ils(row.income) },
    { key: 'expenses', header: 'הוצאות', className: 'text-red-600', cell: row => ils(row.expenses) },
    { key: 'income_tax', header: 'מס הכנסה', className: 'text-orange-600', cell: row => ils(row.income_tax) },
    { key: 'social_security', header: 'ביטוח לאומי', className: 'text-orange-600', cell: row => ils(row.social_security) },
    { key: 'vat', header: 'מע"מ', className: 'text-orange-600', cell: row => ils(row.vat) },
    { key: 'salary', header: 'משכורת', className: 'text-purple-600', cell: row => ils(row.salary) },
    {
      key: 'closing',
      header: 'יתרה סגירה',
      cell: row => (
        <span className={`font-semibold ${row.closing >= 0 ? 'text-green-700' : 'text-red-600'}`}>
          {ils(row.closing)}
        </span>
      ),
    },
  ]

  const closingRow = confirmClose ? balanceRows.find(r => r.month === confirmClose.month) : null

  return (
    <div className="space-y-8">
      {/* Header with global month picker */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-foreground">תזרים מזומנים</h1>
        <MonthPicker
          value={selectedMonthValue}
          onChange={setSelectedMonthValue}
          className="w-44"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        <SummaryCard label="יתרה שוטפת" value={ils(latestClosing)} highlight={latestClosing >= 0 ? 'green' : 'red'} pinned />
        <SummaryCard label="הכנסות" month={monthLabel(selectedMonth)} value={ils(displayIncome)} />
        <SummaryCard label="הוצאות" month={monthLabel(selectedMonth)} value={ils(displayExpenses)} />
        <SummaryCard label="רווח" month={monthLabel(selectedMonth)} value={ils(displayGrossProfit)} highlight={displayGrossProfit >= 0 ? 'green' : 'red'} />
        <SummaryCard label="משכורת לעצמי" month={monthLabel(selectedMonth)} value={ils(displaySalary)} />
        <SummaryCard label="יתרה לעסק" month={monthLabel(selectedMonth)} value={ils(displayMonthlyBalance)} highlight={displayMonthlyBalance >= 0 ? 'green' : 'red'} />
      </div>

      {/* Authority Payments */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base font-semibold">
              תשלומים לרשויות — {monthLabel(selectedMonth)}
            </CardTitle>
            <Button
              size="sm"
              onClick={() => { setPaymentMonth(selectedMonthValue); setShowAddPayment(true) }}
              className="px-6"
            >
              <Plus className="h-4 w-4 ml-1" />
              הוסף תשלום
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAuthorityPayments.length === 0 ? (
            <p className="text-muted-foreground text-sm">אין תשלומים לרשויות בחודש זה</p>
          ) : (
            <DataTable
              columns={authorityColumns}
              data={filteredAuthorityPayments}
              rowKey={row => row.id}
              footerRow={authorityFooter}
              emptyMessage="אין תשלומים לרשויות בחודש זה"
            />
          )}
        </CardContent>
      </Card>

      {/* Add Authority Payment Modal */}
      <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>הוסף תשלום לרשויות</DialogTitle>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleAddPayment} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>סוג</Label>
                <Select name="type" defaultValue="income_tax">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income_tax">מס הכנסה</SelectItem>
                    <SelectItem value="social_security">ביטוח לאומי</SelectItem>
                    <SelectItem value="vat">מע&quot;מ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>סכום</Label>
                <div className="relative">
                  <Input name="amount" type="number" min={0} step="0.01" required placeholder="0.00" className="pl-8" />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">₪</span>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label>חודש</Label>
              <MonthPicker name="payment_month" value={paymentMonth} onChange={setPaymentMonth} />
            </div>
            <div className="space-y-1">
              <Label>הערות (אופציונלי)</Label>
              <Textarea name="notes" rows={2} placeholder="הערה..." />
            </div>
            {isAddingToClosedMonth && (
              <p className="text-amber-600 text-sm bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                חודש זה סגור — לא ניתן להוסיף תשלום. יש לפתוח את החודש מחדש בטבלת העובר ושב.
              </p>
            )}
            {addError && <p className="text-red-500 text-sm">{addError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddPayment(false)}>ביטול</Button>
              <Button type="submit" disabled={isPending || isAddingToClosedMonth}>שמור</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Yearly Cash Flow Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base font-semibold">תזרים שנתי</CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setChartYear(y => Math.max(minYear, y - 1))}
                disabled={chartYear <= minYear}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-12 text-center">{chartYear}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setChartYear(y => Math.min(maxYear, y + 1))}
                disabled={chartYear >= maxYear}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div dir="ltr">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', textAnchor: 'start' }}
                  axisLine={false}
                  tickLine={false}
                  reversed
                  angle={-45}
                  height={72}
                  tickMargin={25}
                />
                <YAxis
                  orientation="right"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `₪${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '10px',
                    fontSize: 12,
                    direction: 'rtl',
                    color: 'hsl(var(--foreground))',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    padding: '8px 12px',
                  }}
                  formatter={(value, name) => {
                    const labels: Record<string, string> = { income: 'הכנסות', expenses: 'הוצאות', profit: 'רווח' }
                    const n = typeof value === 'number' ? value : null
                    return [n !== null ? ils(n) : '—', labels[String(name)] ?? String(name)]
                  }}
                  labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                />
                <Legend
                  formatter={(value: string) => {
                    const labels: Record<string, string> = { income: 'הכנסות', expenses: 'הוצאות', profit: 'רווח' }
                    return <span style={{ fontSize: 12, color: 'hsl(var(--foreground))' }}>{labels[value] ?? value}</span>
                  }}
                />
                <Line
                  type="linear"
                  dataKey="income"
                  stroke="#15803d"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#15803d', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
                <Line
                  type="linear"
                  dataKey="expenses"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#dc2626', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
                <Line
                  type="linear"
                  dataKey="profit"
                  stroke="#3d6ba3"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={{ r: 3, fill: '#3d6ba3', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Running Balance Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">עובר ושב</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={balanceColumns}
            data={balanceRows}
            rowKey={row => row.month}
            rowClassName={row => row.month === selectedMonth ? 'bg-primary/5 font-medium' : ''}
            pagination={balancePagination}
            emptyMessage="אין נתוני יתרה להצגה"
          />
        </CardContent>
      </Card>

      {/* 3-Month Forecast */}
      {forecastRows.length > 0 && (
        <Card className="border-dashed border-muted-foreground/30">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between flex-wrap gap-1">
              <CardTitle className="text-base font-semibold">תחזית 3 חודשים קדימה</CardTitle>
              <span className="text-xs text-muted-foreground">
                מבוסס על {forecastSourceCount} חודשים אחרונים
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              הערכה בלבד — מחושבת לפי מגמה ממוצעת משוקללת של ההכנסות, ההוצאות והתשלומים לרשויות בחודשים האחרונים. ככל שיש יותר היסטוריה, הדיוק משתפר.
            </p>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={forecastColumns}
              data={forecastRows}
              rowKey={row => row.month}
              rowClassName={() => 'opacity-75 italic'}
              emptyMessage=""
            />
          </CardContent>
        </Card>
      )}

      {/* Confirm Delete Snapshot Dialog */}
      <Dialog open={!!confirmDeleteSnapshot} onOpenChange={() => setConfirmDeleteSnapshot(null)}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>פתיחת חודש מחדש</DialogTitle>
          </DialogHeader>
          {confirmDeleteSnapshot && (
            <div className="space-y-3">
              <p className="text-foreground">
                האם לפתוח מחדש את חודש <strong>{monthLabel(confirmDeleteSnapshot.month)}</strong>?
              </p>
              <p className="text-sm text-muted-foreground">
                החודש יחזור למצב שוטף ויחושב מחדש לפי ההוצאות, ההכנסות והתשלומים הקיימים.
              </p>
              {confirmDeleteSnapshot.hasLaterSnapshots && (
                <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                  שים לב: קיימים חודשים סגורים מאוחרים יותר. יתרת הפתיחה שלהם לא תתעדכן אוטומטית — מומלץ לפתוח גם אותם מחדש (מהחדש לישן).
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteSnapshot(null)}>ביטול</Button>
            <Button variant="destructive" onClick={handleDeleteSnapshot} disabled={isPending}>פתח מחדש</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Month Close Dialog */}
      <Dialog open={!!confirmClose} onOpenChange={() => setConfirmClose(null)}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>סגירת חודש</DialogTitle>
          </DialogHeader>
          {confirmClose && (
            <div className="space-y-3">
              <p className="text-foreground">
                האם לסגור את חודש <strong>{monthLabel(confirmClose.month)}</strong>?
              </p>
              <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2.5 space-y-1">
                <div className="flex justify-between">
                  <span>משכורת ({paycheckPercent}% מהרווח הגולמי)</span>
                  <span className="font-medium text-foreground">{ils(closingRow?.salary ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>יתרה סופית</span>
                  <span className={`font-semibold ${confirmClose.closing >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {ils(confirmClose.closing)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">פעולה זו תנעל את נתוני החודש.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClose(null)}>ביטול</Button>
            <Button onClick={handleApprove} disabled={isPending}>אשר וסגור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryCard({ label, month, value, highlight, pinned }: { label: string; month?: string; value: string; highlight?: 'green' | 'red'; pinned?: boolean }) {
  return (
    <Card className={pinned ? 'border-primary/40 bg-primary/5' : ''}>
      <CardContent className="p-4 space-y-0.5">
        <p className="text-xs text-muted-foreground">{label}</p>
        {month && <p className="text-xs text-muted-foreground/60">{month}</p>}
        <p className={`text-xl font-bold pt-0.5 ${highlight === 'green' ? 'text-green-700 dark:text-green-400' : highlight === 'red' ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  )
}
