'use client'

import { useState, useTransition } from 'react'
import { deleteIncome } from '@/app/(dashboard)/income/actions'

type IncomeRow = {
  id: string
  product_name: string
  product_id: string | null
  order_id: string | null
  original_price: number
  discount_amount: number
  final_price: number
  payment_on_delivery: boolean
  income_date: string
  notes: string | null
  source: string
}

type Props = {
  rows: IncomeRow[]
  filterMonth: string
  onEdit: (row: IncomeRow) => void
}

function fmt(n: number) {
  return n.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 })
}

export default function IncomeTable({ rows, filterMonth, onEdit }: Props) {
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = rows.filter(r => r.income_date.slice(0, 7) === filterMonth)

  function handleDelete(id: string) {
    if (!confirm('למחוק הכנסה זו?')) return
    setDeletingId(id)
    startTransition(async () => {
      await deleteIncome(id)
      setDeletingId(null)
    })
  }

  if (filtered.length === 0) {
    return <p className="text-center text-gray-400 py-12">אין הכנסות לחודש זה</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 border-b border-gray-100 text-right">
            <th className="pb-3 pr-2 font-medium">תאריך</th>
            <th className="pb-3 pr-2 font-medium">מוצר</th>
            <th className="pb-3 pr-2 font-medium">מספר הזמנה</th>
            <th className="pb-3 pr-2 font-medium">מחיר מקורי</th>
            <th className="pb-3 pr-2 font-medium">הנחה</th>
            <th className="pb-3 pr-2 font-medium">מחיר סופי</th>
            <th className="pb-3 pr-2 font-medium">מסירה</th>
            <th className="pb-3 pr-2 font-medium">מקור</th>
            <th className="pb-3 font-medium">פעולות</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {filtered.map(row => (
            <tr key={row.id} className="hover:bg-gray-50">
              <td className="py-3 pr-2 text-gray-600">{new Date(row.income_date).toLocaleDateString('he-IL')}</td>
              <td className="py-3 pr-2 font-medium">{row.product_name}</td>
              <td className="py-3 pr-2 text-gray-500 text-xs">{row.order_id ?? '—'}</td>
              <td className="py-3 pr-2">{fmt(row.original_price)}</td>
              <td className="py-3 pr-2 text-orange-600">{row.discount_amount > 0 ? fmt(row.discount_amount) : '—'}</td>
              <td className="py-3 pr-2 font-medium text-green-700">{fmt(row.final_price)}</td>
              <td className="py-3 pr-2">
                {row.payment_on_delivery
                  ? <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">במסירה</span>
                  : '—'}
              </td>
              <td className="py-3 pr-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${row.source === 'store' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                  {row.source === 'store' ? 'חנות' : 'ידני'}
                </span>
              </td>
              <td className="py-3">
                <div className="flex gap-2">
                  <button onClick={() => onEdit(row)} className="text-gray-400 hover:text-blue-600 text-xs">ערוך</button>
                  <button
                    onClick={() => handleDelete(row.id)}
                    disabled={isPending && deletingId === row.id}
                    className="text-gray-400 hover:text-red-600 text-xs disabled:opacity-50"
                  >
                    מחק
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
