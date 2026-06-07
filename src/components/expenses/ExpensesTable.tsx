'use client'

import { useState, useTransition } from 'react'
import { deleteExpense } from '@/app/(dashboard)/expenses/actions'

type Receipt = {
  id: string
  cloudinary_url: string
  file_type: string | null
}

type Installment = {
  id: string
  installment_number: number
  due_month: string
  amount: number
  vat_amount: number
}

type Expense = {
  id: string
  description: string
  category_id: string | null
  total_amount: number
  transaction_date: string
  is_recurring: boolean
  installments_total: number
  is_personal: boolean
  notes: string | null
  expense_categories: { id: string; name: string; is_vat_recognized: boolean } | null
  receipts: Receipt[]
  expense_installments: Installment[]
}

type Props = {
  expenses: Expense[]
  filterMonth: string
  onEdit: (expense: Expense) => void
}

function fmt(n: number) {
  return n.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 })
}

export default function ExpensesTable({ expenses, filterMonth, onEdit }: Props) {
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleDelete(id: string) {
    if (!confirm('למחוק הוצאה זו?')) return
    setDeletingId(id)
    startTransition(async () => {
      await deleteExpense(id)
      setDeletingId(null)
    })
  }

  // Filter: show expenses that have an installment in the filter month
  const filtered = expenses.filter(exp => {
    const hasInstallmentInMonth = exp.expense_installments.some(i => i.due_month.slice(0, 7) === filterMonth)
    return hasInstallmentInMonth
  })

  if (filtered.length === 0) {
    return <p className="text-center text-gray-400 py-12">אין הוצאות לחודש זה</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 border-b border-gray-100 text-right">
            <th className="pb-3 pr-2 font-medium">תאריך</th>
            <th className="pb-3 pr-2 font-medium">תיאור</th>
            <th className="pb-3 pr-2 font-medium">קטגוריה</th>
            <th className="pb-3 pr-2 font-medium">סכום</th>
            <th className="pb-3 pr-2 font-medium">מע&quot;מ</th>
            <th className="pb-3 pr-2 font-medium">תשלומים</th>
            <th className="pb-3 pr-2 font-medium">סוג</th>
            <th className="pb-3 pr-2 font-medium">קבלה</th>
            <th className="pb-3 font-medium">פעולות</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {filtered.map(exp => {
            const monthInstallment = exp.expense_installments.find(i => i.due_month.slice(0, 7) === filterMonth)
            const installmentNum = monthInstallment?.installment_number ?? 1
            const installmentAmt = monthInstallment?.amount ?? exp.total_amount
            const vatAmt = monthInstallment?.vat_amount ?? 0

            return (
              <tr key={exp.id} className="hover:bg-gray-50">
                <td className="py-3 pr-2 text-gray-600">
                  {new Date(exp.transaction_date).toLocaleDateString('he-IL')}
                </td>
                <td className="py-3 pr-2">
                  <span className="font-medium">{exp.description}</span>
                  {exp.is_recurring && (
                    <span className="mr-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">קבוע</span>
                  )}
                </td>
                <td className="py-3 pr-2 text-gray-600">{exp.expense_categories?.name ?? '—'}</td>
                <td className="py-3 pr-2 font-medium">{fmt(installmentAmt)}</td>
                <td className="py-3 pr-2 text-gray-600">{vatAmt > 0 ? fmt(vatAmt) : '—'}</td>
                <td className="py-3 pr-2 text-gray-600 whitespace-nowrap">
                  {exp.installments_total > 1
                    ? `${installmentNum} מתוך ${exp.installments_total}`
                    : '—'}
                </td>
                <td className="py-3 pr-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${exp.is_personal ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                    {exp.is_personal ? 'אישי' : 'עסקי'}
                  </span>
                </td>
                <td className="py-3 pr-2">
                  {exp.receipts.length > 0 ? (
                    <div className="flex gap-1">
                      {exp.receipts.map(r => (
                        <a
                          key={r.id}
                          href={r.cloudinary_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          title="פתח קבלה"
                        >
                          {r.file_type === 'pdf' ? '📄' : '🖼'}
                        </a>
                      ))}
                    </div>
                  ) : '—'}
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(exp as Parameters<typeof onEdit>[0])}
                      className="text-gray-400 hover:text-blue-600 text-xs"
                    >
                      ערוך
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      disabled={isPending && deletingId === exp.id}
                      className="text-gray-400 hover:text-red-600 text-xs disabled:opacity-50"
                    >
                      מחק
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
