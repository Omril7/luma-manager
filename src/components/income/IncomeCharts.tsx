'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

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

function fmt(n: number) {
  return `₪${n.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`
}

export default function IncomeCharts({ rows, isAnnual, year, month }: Props) {
  if (isAnnual) {
    const data = Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0')
      const key = `${year}-${m}`
      const total = rows.filter(r => r.income_date.slice(0, 7) === key).reduce((s, r) => s + r.final_price, 0)
      return { name: MONTH_NAMES[i], total }
    })

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-medium text-gray-700 mb-4">הכנסות לפי חודש — {year}</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₪${Number(v).toLocaleString()}`} />
            <Tooltip formatter={(v) => fmt(Number(v))} />
            <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} name="סה״כ" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Monthly: daily income bar chart
  const monthKey = `${year}-${String(month).padStart(2, '0')}`
  const monthRows = rows.filter(r => r.income_date.slice(0, 7) === monthKey)

  // Group by day
  const byDay = monthRows.reduce<Record<string, number>>((acc, r) => {
    const day = r.income_date.slice(8, 10)
    acc[day] = (acc[day] ?? 0) + r.final_price
    return acc
  }, {})

  const daysInMonth = new Date(year, month, 0).getDate()
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = String(i + 1).padStart(2, '0')
    return { name: String(i + 1), total: byDay[day] ?? 0 }
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-medium text-gray-700 mb-4">הכנסות יומיות — {MONTH_NAMES[month - 1]}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={dailyData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₪${Number(v).toLocaleString()}`} />
          <Tooltip formatter={(v) => fmt(Number(v))} />
          <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} name="הכנסה" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
