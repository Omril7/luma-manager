'use client'

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

type Installment = {
  amount: number
  due_month: string
  expenses: {
    is_personal: boolean
    expense_categories: { name: string } | null
  } | null
}

type Props = {
  installments: Installment[]
  isAnnual: boolean
  year: number
  month: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

function fmt(n: number) {
  return `₪${n.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`
}

export default function ExpensesCharts({ installments, isAnnual, year, month }: Props) {
  const business = installments.filter(i => !i.expenses?.is_personal)

  if (isAnnual) {
    const monthlyTotals = Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0')
      const key = `${year}-${m}`
      const total = business
        .filter(i => i.due_month.slice(0, 7) === key)
        .reduce((sum, i) => sum + i.amount, 0)
      return { name: MONTH_NAMES[i], total }
    })

    return (
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">הוצאות לפי חודש — {year}</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyTotals} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₪${v.toLocaleString()}`} />
            <Tooltip formatter={(v) => fmt(Number(v))} />
            <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name="סה״כ" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Monthly pie chart — by category
  const monthKey = `${year}-${String(month).padStart(2, '0')}`
  const monthInstallments = business.filter(i => i.due_month.slice(0, 7) === monthKey)

  const byCategory = monthInstallments.reduce<Record<string, number>>((acc, i) => {
    const name = i.expenses?.expense_categories?.name ?? 'ללא קטגוריה'
    acc[name] = (acc[name] ?? 0) + i.amount
    return acc
  }, {})

  const pieData = Object.entries(byCategory).map(([name, value]) => ({ name, value }))

  if (pieData.length === 0) {
    return null
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">הוצאות לפי קטגוריה</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            outerRadius={90}
            dataKey="value"
            label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {pieData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => fmt(Number(v))} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
