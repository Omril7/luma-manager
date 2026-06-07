'use client'

import { useState, useTransition, useRef } from 'react'
import { createAuthorityPayment, deleteAuthorityPayment, approveMonthClose, updatePaycheckPercent } from '@/app/(dashboard)/dashboard/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  const [isPending, startTransition] = useTransition()
  const [addError, setAddError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const authorityTotal = authorityPayments.reduce((s, p) => s + p.amount, 0)
  const grossProfit = monthIncome - monthExpenses
  const salary = grossProfit * (paycheckPercent / 100)
  const monthlyBalance = grossProfit - salary - authorityTotal

  const [yr, mo] = currentMonth.split('-')
  const currentMonthLabel = `${MONTH_LABELS[mo] ?? mo} ${yr}`

  function handleDeletePayment(id: string) {
    startTransition(async () => {
      await deleteAuthorityPayment(id)
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
      } else {
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
      await approveMonthClose(confirmClose.month, confirmClose.opening, confirmClose.closing)
      setConfirmClose(null)
    })
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">תזרים מזומנים</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card label="הכנסות החודש" value={ils(monthIncome)} />
        <Card label="הוצאות עסקיות" value={ils(monthExpenses)} />
        <Card label="רווח גולמי" value={ils(grossProfit)} highlight={grossProfit >= 0 ? 'green' : 'red'} />
        <Card label="משכורת לעצמי" value={ils(salary)} />
        <Card label="יתרה לעסק" value={ils(monthlyBalance)} highlight={monthlyBalance >= 0 ? 'green' : 'red'} />
      </div>

      {/* Salary Control */}
      <section className="bg-white rounded-lg border p-5 space-y-3">
        <h2 className="font-semibold text-gray-800">שכר עצמי</h2>
        <div className="flex items-center gap-4">
          <Label className="text-sm text-gray-600 whitespace-nowrap">אחוז מהרווח:</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={paycheckPercent}
            onChange={e => setPaycheckPercent(Number(e.target.value))}
            onBlur={handlePaycheckBlur}
            className="w-24 text-center"
          />
          <span className="text-gray-500 text-sm">%</span>
          <span className="text-gray-700 font-medium">
            משכורת חודשית: <strong>{ils(salary)}</strong>
          </span>
        </div>
      </section>

      {/* Authority Payments */}
      <section className="bg-white rounded-lg border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">תשלומים לרשויות — {currentMonthLabel}</h2>
          <Button size="sm" onClick={() => setShowAddPayment(true)}>
            <Plus className="h-4 w-4 ml-1" />
            הוסף תשלום
          </Button>
        </div>

        {authorityPayments.length === 0 ? (
          <p className="text-gray-400 text-sm">אין תשלומים לרשויות החודש</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right border-b text-gray-500">
                <th className="pb-2 font-medium">סוג</th>
                <th className="pb-2 font-medium">סכום</th>
                <th className="pb-2 font-medium">הערות</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {authorityPayments.map(p => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-2">{TYPE_LABELS[p.type] ?? p.type}</td>
                  <td className="py-2">{ils(p.amount)}</td>
                  <td className="py-2 text-gray-500">{p.notes ?? '—'}</td>
                  <td className="py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePayment(p.id)}
                      disabled={isPending}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              <tr className="font-semibold bg-gray-50">
                <td className="py-2">סה&quot;כ</td>
                <td className="py-2">{ils(authorityTotal)}</td>
                <td />
                <td />
              </tr>
            </tbody>
          </table>
        )}
      </section>

      {/* Add Authority Payment Modal */}
      <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>הוסף תשלום לרשויות</DialogTitle>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleAddPayment} className="space-y-4">
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
              <Label>סכום (₪)</Label>
              <Input name="amount" type="number" min={0} step="0.01" required placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <Label>חודש</Label>
              <Input name="payment_month" type="month" defaultValue={currentMonth} required />
            </div>
            <div className="space-y-1">
              <Label>הערות (אופציונלי)</Label>
              <Input name="notes" type="text" />
            </div>
            {addError && <p className="text-red-500 text-sm">{addError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddPayment(false)}>ביטול</Button>
              <Button type="submit" disabled={isPending}>שמור</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Running Balance Table */}
      <section className="bg-white rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">עובר ושב</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right border-b text-gray-500">
                <th className="pb-2 font-medium">חודש</th>
                <th className="pb-2 font-medium">יתרה פתיחה</th>
                <th className="pb-2 font-medium">הכנסות</th>
                <th className="pb-2 font-medium">הוצאות</th>
                <th className="pb-2 font-medium">רשויות</th>
                <th className="pb-2 font-medium">משכורת</th>
                <th className="pb-2 font-medium">יתרה סגירה</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {balanceRows.map(row => (
                <tr
                  key={row.month}
                  className={`border-b last:border-0 ${row.isLive ? 'bg-blue-50 font-medium' : ''}`}
                >
                  <td className="py-2">
                    {monthLabel(row.month)}
                    {row.isLive && <span className="mr-1 text-xs text-blue-600">(שוטף)</span>}
                  </td>
                  <td className="py-2">{ils(row.opening)}</td>
                  <td className="py-2 text-green-700">{ils(row.income)}</td>
                  <td className="py-2 text-red-600">{ils(row.expenses)}</td>
                  <td className="py-2 text-orange-600">{ils(row.authority)}</td>
                  <td className="py-2 text-purple-600">{ils(row.salary)}</td>
                  <td className={`py-2 font-semibold ${row.closing >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {ils(row.closing)}
                  </td>
                  <td className="py-2">
                    {row.isLive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmClose({ month: row.month, closing: row.closing, opening: row.opening })}
                        className="text-xs"
                      >
                        <CheckCircle className="h-3 w-3 ml-1" />
                        סגור חודש
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Confirm Month Close Dialog */}
      <Dialog open={!!confirmClose} onOpenChange={() => setConfirmClose(null)}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>סגירת חודש</DialogTitle>
          </DialogHeader>
          {confirmClose && (
            <div className="space-y-3">
              <p className="text-gray-700">
                האם לסגור את חודש <strong>{monthLabel(confirmClose.month)}</strong>?
              </p>
              <p className="text-gray-700">
                היתרה הסופית תהיה: <strong className={confirmClose.closing >= 0 ? 'text-green-700' : 'text-red-600'}>{ils(confirmClose.closing)}</strong>
              </p>
              <p className="text-xs text-gray-500">פעולה זו תנעל את נתוני החודש.</p>
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

function Card({ label, value, highlight }: { label: string; value: string; highlight?: 'green' | 'red' }) {
  return (
    <div className="bg-white rounded-lg border p-4 space-y-1">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-bold ${highlight === 'green' ? 'text-green-700' : highlight === 'red' ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  )
}
