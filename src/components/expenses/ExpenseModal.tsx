'use client'

import { useRef, useState, useTransition } from 'react'
import { createExpense, updateExpense } from '@/app/(dashboard)/expenses/actions'

type Category = {
  id: string
  name: string
  is_vat_recognized: boolean
}

type Receipt = {
  id: string
  cloudinary_url: string
  file_type: string | null
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
  receipts: Receipt[]
}

type Props = {
  categories: Category[]
  expense?: Expense
  onClose: () => void
  onCategoryModalOpen: () => void
}

export default function ExpenseModal({ categories, expense, onClose, onCategoryModalOpen }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [hasInstallments, setHasInstallments] = useState(
    expense ? expense.installments_total > 1 : false
  )
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formData = new FormData(formRef.current!)
    formData.set('has_installments', hasInstallments ? 'true' : 'false')
    if (!hasInstallments) formData.set('installments_total', '1')

    startTransition(async () => {
      const action = expense ? updateExpense : createExpense
      const result = await action(null, formData)
      if (result.error) {
        setError(result.error)
      } else {
        onClose()
      }
    })
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <div className="sticky top-0 bg-white border-b border-gray-100 flex items-center justify-between px-6 py-4">
          <h2 className="text-lg font-bold">{expense ? 'עריכת הוצאה' : 'הוספת הוצאה'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
          {expense && <input type="hidden" name="expense_id" value={expense.id} />}

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תיאור *</label>
            <input
              name="description"
              defaultValue={expense?.description}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
            <div className="flex gap-2">
              <select
                name="category_id"
                defaultValue={expense?.category_id ?? ''}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">ללא קטגוריה</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={onCategoryModalOpen}
                className="text-blue-600 text-sm hover:underline whitespace-nowrap"
              >
                + נהל קטגוריות
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סכום כולל מע&quot;מ (₪) *</label>
            <input
              name="total_amount"
              type="number"
              step="0.01"
              min="0"
              defaultValue={expense?.total_amount}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תאריך עסקה *</label>
            <input
              name="transaction_date"
              type="date"
              defaultValue={expense?.transaction_date ?? today}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 border border-gray-100 rounded-lg p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_recurring"
                value="true"
                defaultChecked={expense?.is_recurring}
                className="accent-blue-600"
              />
              <span className="text-sm">הוצאה קבועה (חוזרת כל חודש)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasInstallments}
                onChange={e => setHasInstallments(e.target.checked)}
                className="accent-blue-600"
              />
              <span className="text-sm">תשלומים</span>
            </label>

            {hasInstallments && (
              <div className="mr-6">
                <label className="block text-xs text-gray-600 mb-1">מספר תשלומים</label>
                <input
                  name="installments_total"
                  type="number"
                  min="2"
                  max="36"
                  defaultValue={expense && expense.installments_total > 1 ? expense.installments_total : 2}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_personal"
                value="true"
                defaultChecked={expense?.is_personal}
                className="accent-blue-600"
              />
              <span className="text-sm">הוצאה אישית</span>
            </label>
          </div>

          {/* Receipts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">קבלות</label>
            {expense?.receipts && expense.receipts.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {expense.receipts.map(r => (
                  <a
                    key={r.id}
                    href={r.cloudinary_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline border border-blue-200 rounded px-2 py-1"
                  >
                    {r.file_type === 'pdf' ? '📄 PDF' : '🖼 תמונה'}
                  </a>
                ))}
              </div>
            )}
            <input
              name="receipts"
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="w-full text-sm text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 file:text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
            <textarea
              name="notes"
              defaultValue={expense?.notes ?? ''}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {isPending ? 'שומר...' : expense ? 'שמור שינויים' : 'הוסף הוצאה'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
