'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatILS } from '@/lib/utils'

type IncomeRow = {
  income_date: string
  final_price: number
  discount_amount: number
  product_name: string
}

type Props = {
  rows: IncomeRow[]
  isAnnual: boolean
  year: number
  month: number
}

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

export default function IncomeCharts({ rows, isAnnual, year, month }: Props) {
  if (isAnnual) {
    const data = Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0')
      const key = `${year}-${m}`
      const total = rows.filter(r => r.income_date.slice(0, 7) === key).reduce((s, r) => s + r.final_price, 0)
      return { name: MONTH_NAMES[i], total }
    }).reverse()

    return (
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">הכנסות לפי חודש — {year}</h3>
        <ResponsiveContainer width="100%" height={240}>
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
              formatter={(v) => [formatILS(Number(v)), 'הכנסות']}
              contentStyle={tooltipStyle}
              labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: 2, fontWeight: 500 }}
              itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 700 }}
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            />
            <Bar dataKey="total" fill="#2a9d8f" radius={[6, 6, 0, 0]} name="הכנסות" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Monthly: daily income bar chart
  const monthKey = `${year}-${String(month).padStart(2, '0')}`
  const monthRows = rows.filter(r => r.income_date.slice(0, 7) === monthKey)

  const byDay = monthRows.reduce<Record<string, number>>((acc, r) => {
    const day = r.income_date.slice(8, 10)
    acc[day] = (acc[day] ?? 0) + r.final_price
    return acc
  }, {})

  const daysInMonth = new Date(year, month, 0).getDate()
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = String(i + 1).padStart(2, '0')
    return { day: i + 1, total: byDay[day] ?? 0 }
  })

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">הכנסות יומיות — {MONTH_NAMES[month - 1]}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={dailyData} margin={{ top: 22, right: 8, left: 4, bottom: 4 }} style={{ overflow: 'visible' }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="day"
            type="number"
            domain={[0, daysInMonth]}
            ticks={[0, 5, 10, 15, 20, 25, 30].filter(d => d <= daysInMonth)}
            reversed
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            tickMargin={6}
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
            formatter={(v) => [formatILS(Number(v)), 'הכנסה']}
            contentStyle={tooltipStyle}
            labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: 2, fontWeight: 500 }}
            itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 700 }}
            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          />
          <Bar dataKey="total" fill="#2a9d8f" radius={[6, 6, 0, 0]} name="הכנסה" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
