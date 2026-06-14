'use client'

import { useState, useTransition, useRef } from 'react'
import { createAuthorityPayment, deleteAuthorityPayment, approveMonthClose, updatePaycheckPercent, deleteSnapshot } from '@/app/(dashboard)/dashboard/actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MonthPicker, type MonthPickerValue } from '@/components/ui/month-picker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type DataTableColumn, type DataTablePagination } from '@/components/ui/data-table'
import { Trash2, Plus, CheckCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface AuthorityPayment {
  id: string
  type: string
  amount: number
  payment_month: string
  notes: string | null
}

interface BalanceSnapshot {
  snapshot_month: string
  opening_balance: number
  closing_balance: number
  approved_at: string | null
}

interface MonthRow {
  month: string          // YYYY-MM
  label: string
  opening: number
  income: number
  expenses: number
  authority: number
  salary: number
  closing: number
  isLive: boolean
  isApproved: boolean
}

interface Props {
  currentMonth: string   // YYYY-MM
  monthIncome: number
  monthExpenses: number
  authorityPayments: AuthorityPayment[]
  paycheckPercent: number
  snapshots: BalanceSnapshot[]
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

export default function DashboardClient({
  currentMonth,
  monthIncome,
  monthExpenses,
  authorityPayments,
  paycheckPercent: initialPaycheckPercent,
  balanceRows,
}: Props) {
  const [paycheckPercent, setPaycheckPercent] = useState(initialPaycheckPercent)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [confirmClose, setConfirmClose] = useState<{ month: string; closing: number; opening: number } | null>(null)
  const [confirmDeleteSnapshot, setConfirmDeleteSnapshot] = useState<{ month: string; hasLaterSnapshots: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [addError, setAddError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const [paymentMonth, setPaymentMonth] = useState<MonthPickerValue>(() => {
    const [yr2, mo2] = currentMonth.split('-')
    return { year: Number(yr2), month: Number(mo2) }
  })
  const [authorityFilterMonth, setAuthorityFilterMonth] = useState<MonthPickerValue>(() => {
    const [yr2, mo2] = currentMonth.split('-')
    return { year: Number(yr2), month: Number(mo2) }
  })
  const [balancePage, setBalancePage] = useState(0)
  const BALANCE_PAGE_SIZE = 6

  const authorityTotal = authorityPayments
    .filter(p => p.payment_month.slice(0, 7) === currentMonth)
    .reduce((s, p) => s + p.amount, 0)
  const grossProfit = monthIncome - monthExpenses
  const salary = grossProfit * (paycheckPercent / 100)
  const monthlyBalance = grossProfit - salary - authorityTotal

  const closedMonthSet = new Set(balanceRows.filter(r => r.isApproved).map(r => r.month))
  const selectedPaymentYM = `${paymentMonth.year}-${String(paymentMonth.month).padStart(2, '0')}`
  const isAddingToClosedMonth = closedMonthSet.has(selectedPaymentYM)

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

  function handlePaycheckBlur() {
    startTransition(async () => {
      await updatePaycheckPercent(paycheckPercent)
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
      }
      setConfirmClose(null)
    })
  }

  function handleDeleteSnapshot() {
    if (!confirmDeleteSnapshot) return
    startTransition(async () => {
      const res = await deleteSnapshot(confirmDeleteSnapshot.month)
      if (res && 'error' in res && res.error) toast.error(res.error)
      else toast.success('החודש נפתח מחדש')
      setConfirmDeleteSnapshot(null)
    })
  }

  // Authority payments table columns
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

  const authorityFilterYM = `${authorityFilterMonth.year}-${String(authorityFilterMonth.month).padStart(2, '0')}`
  const filteredAuthorityPayments = authorityPayments.filter(p => p.payment_month.slice(0, 7) === authorityFilterYM)
  const filteredAuthorityTotal = filteredAuthorityPayments.reduce((s, p) => s + p.amount, 0)

  // Authority payments totals footer row (filtered month)
  const authorityFooter = (
    <tr className="font-semibold bg-muted/50">
      <td className="py-2.5">סה&quot;כ</td>
      <td className="py-2.5">{ils(filteredAuthorityTotal)}</td>
      <td />
      <td />
    </tr>
  )

  // Months that have approved snapshots (for the "later snapshots" warning)
  const approvedMonths = balanceRows.filter(r => !r.isLive).map(r => r.month)

  // Balance table columns
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
      key: 'authority',
      header: 'רשויות',
      className: 'text-orange-600',
      cell: row => ils(row.authority),
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
      cell: row => row.isLive ? (
        row.month < currentMonth ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConfirmClose({ month: row.month, closing: row.closing, opening: row.opening })}
            className="text-xs h-7 px-2"
          >
            <CheckCircle className="h-3 w-3 ml-1" />
            סגור חודש
          </Button>
        ) : null
      ) : (
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
      ),
    },
  ]

  const balancePagination: DataTablePagination = {
    page: balancePage,
    pageSize: BALANCE_PAGE_SIZE,
    total: balanceRows.length,
    onPageChange: setBalancePage,
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-foreground">תזרים מזומנים</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <SummaryCard label="הכנסות החודש" value={ils(monthIncome)} />
        <SummaryCard label="הוצאות עסקיות" value={ils(monthExpenses)} />
        <SummaryCard label="רווח גולמי" value={ils(grossProfit)} highlight={grossProfit >= 0 ? 'green' : 'red'} />
        <SummaryCard label="משכורת לעצמי" value={ils(salary)} />
        <SummaryCard label="יתרה לעסק" value={ils(monthlyBalance)} highlight={monthlyBalance >= 0 ? 'green' : 'red'} />
      </div>

      {/* Salary Control */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">שכר עצמי</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">אחוז מהרווח:</Label>
            <div className="relative w-20">
              <Input
                type="number"
                min={0}
                max={100}
                inputSize="sm"
                value={paycheckPercent}
                onChange={e => setPaycheckPercent(Number(e.target.value))}
                onBlur={handlePaycheckBlur}
                className="w-full pr-6 text-center"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground/70 pointer-events-none select-none">%</span>
            </div>
            <span className="text-foreground font-medium">
              משכורת חודשית: <strong>{ils(salary)}</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Authority Payments */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base font-semibold">תשלומים לרשויות</CardTitle>
            <div className="flex items-center gap-2">
              <MonthPicker value={authorityFilterMonth} onChange={setAuthorityFilterMonth} className="w-36 h-9 text-sm" />
              <Button size="sm" onClick={() => { setPaymentMonth(authorityFilterMonth); setShowAddPayment(true) }} className="px-6">
                <Plus className="h-4 w-4 ml-1" />
                הוסף תשלום
              </Button>
            </div>
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
            rowClassName={row => row.isLive ? 'bg-primary/5 font-medium' : ''}
            pagination={balancePagination}
            emptyMessage="אין נתוני יתרה להצגה"
          />
        </CardContent>
      </Card>

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
              <p className="text-foreground">
                היתרה הסופית תהיה: <strong className={confirmClose.closing >= 0 ? 'text-green-700' : 'text-red-600'}>{ils(confirmClose.closing)}</strong>
              </p>
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

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: 'green' | 'red' }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold ${highlight === 'green' ? 'text-green-700 dark:text-green-400' : highlight === 'red' ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  )
}
