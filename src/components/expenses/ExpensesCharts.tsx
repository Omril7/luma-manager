'use client'

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { formatILS } from '@/lib/utils'

type Installment = {
  amount: number
  due_month: string
  expenses: {
    is_personal: boolean
    expense_categories: { name: string } | null
    expense_category_splits: { category_id: string | null; amount: number; expense_categories: { name: string } | null }[]
  } | null
}

type Props = {
  installments: Installment[]
  isAnnual: boolean
  year: number
  month: number
}

const COLORS = [
  '#3d6ba3', '#e8953a', '#2a9d8f', '#c0505a',
  '#7b68b5', '#5d8a4e', '#c4893e', '#8b7ec4',
]

const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

const tooltipStyle: React.CSSProperties = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '10px',
  fontSize: 12,
  direction: 'rtl',
  color: 'hsl(var(--foreground))',
  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
  padding: '8px 12px',
}

export default function ExpensesCharts({ installments, isAnnual, year, month }: Props) {
  const business = installments.filter(i => !i.expenses?.is_personal)

  if (isAnnual) {
    const data = Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0')
      const key = `${year}-${m}`
      const total = business
        .filter(inst => inst.due_month.slice(0, 7) === key)
        .reduce((sum, inst) => sum + inst.amount, 0)
      return { name: MONTH_NAMES[i], total }
    }).reverse()

    return (
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">הוצאות לפי חודש — {year}</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 22, right: 8, left: 4, bottom: 28 }} style={{ overflow: 'visible' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', textAnchor: 'start' }}
              axisLine={false}
              tickLine={false}
              angle={-45}
              height={60}
              tickMargin={8}
            />
            <YAxis
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', dx: 30 }}
              tickFormatter={v => formatILS(Number(v))}
              width={62}
            />
            <Tooltip
              formatter={(v) => [formatILS(Number(v)), 'הוצאות']}
              contentStyle={tooltipStyle}
              labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: 2, fontWeight: 500 }}
              itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 700 }}
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            />
            <Bar dataKey="total" fill="#3d6ba3" radius={[6, 6, 0, 0]} name="הוצאות" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Monthly pie — by category
  const monthKey = `${year}-${String(month).padStart(2, '0')}`
  const monthInstallments = business.filter(i => i.due_month.slice(0, 7) === monthKey)

  const byCategory = monthInstallments.reduce<Record<string, number>>((acc, i) => {
    const splits = i.expenses?.expense_category_splits ?? []
    if (splits.length > 0) {
      // Split expense: attribute each split's amount to its own category
      for (const s of splits) {
        const name = s.expense_categories?.name ?? 'ללא קטגוריה'
        acc[name] = (acc[name] ?? 0) + s.amount
      }
    } else {
      const name = i.expenses?.expense_categories?.name ?? 'ללא קטגוריה'
      acc[name] = (acc[name] ?? 0) + i.amount
    }
    return acc
  }, {})

  const pieData = Object.entries(byCategory).map(([name, value]) => ({ name, value }))

  if (pieData.length === 0) return null

  const total = pieData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">הוצאות לפי קטגוריה</h3>
      <div className="flex flex-col sm:flex-row-reverse gap-6 items-center">
        {/* Legend — right side in RTL */}
        <div className="w-full sm:w-52 flex-shrink-0 space-y-2" dir="rtl">
          {pieData.map((entry, i) => (
            <div key={entry.name} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="text-foreground truncate">{entry.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {((entry.value / total) * 100).toFixed(0)}%
                </span>
                <span className="font-semibold text-foreground tabular-nums">{formatILS(entry.value)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Donut chart */}
        <div className="flex-1 min-w-0 w-full">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                dataKey="value"
                strokeWidth={2}
                stroke="hsl(var(--card))"
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [formatILS(Number(v))]}
                contentStyle={tooltipStyle}
                itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 700 }}
                labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
