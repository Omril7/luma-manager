'use client'

import { useRef, useState, useTransition } from 'react'
import { createIncome, updateIncome } from '@/app/(dashboard)/income/actions'

type Product = {
  id: string
  name: string
}

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
}

type Props = {
  products: Product[]
  income?: IncomeRow
  onClose: () => void
}

export default function IncomeModal({ products, income, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [hasDiscount, setHasDiscount] = useState(income ? income.discount_amount > 0 : false)
  const [originalPrice, setOriginalPrice] = useState(income?.original_price ?? 0)
  const [discountAmount, setDiscountAmount] = useState(income?.discount_amount ?? 0)
  const [useProduct, setUseProduct] = useState(!!income?.product_id)
  const formRef = useRef<HTMLFormElement>(null)

  const finalPrice = originalPrice - (hasDiscount ? discountAmount : 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formData = new FormData(formRef.current!)
    formData.set('has_discount', hasDiscount ? 'true' : 'false')
    if (!hasDiscount) formData.set('discount_amount', '0')

    startTransition(async () => {
      const action = income ? updateIncome : createIncome
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
          <h2 className="text-lg font-bold">{income ? 'עריכת הכנסה' : 'הוספת הכנסה'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
          {income && <input type="hidden" name="income_id" value={income.id} />}

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          {/* Product selection or free text */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <label className="text-sm font-medium text-gray-700">שם מוצר *</label>
              {products.length > 0 && (
                <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useProduct}
                    onChange={e => setUseProduct(e.target.checked)}
                    className="accent-blue-600"
                  />
                  בחר ממוצרים קיימים
                </label>
              )}
            </div>
            {useProduct && products.length > 0 ? (
              <select
                name="product_id"
                defaultValue={income?.product_id ?? ''}
                onChange={e => {
                  const product = products.find(p => p.id === e.target.value)
                  const nameInput = formRef.current?.querySelector<HTMLInputElement>('[name="product_name"]')
                  if (nameInput && product) nameInput.value = product.name
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">בחר מוצר...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            ) : (
              <input type="hidden" name="product_id" value="" />
            )}
            <input
              name="product_name"
              defaultValue={income?.product_name}
              required
              placeholder="שם מוצר"
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${useProduct ? 'mt-2' : ''}`}
            />
          </div>

          {/* Order ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">מספר הזמנה</label>
            <input
              name="order_id"
              defaultValue={income?.order_id ?? ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Original price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">מחיר מקורי (₪) *</label>
            <input
              name="original_price"
              type="number"
              step="0.01"
              min="0"
              value={originalPrice}
              onChange={e => setOriginalPrice(Number(e.target.value))}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Discount */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasDiscount}
                onChange={e => setHasDiscount(e.target.checked)}
                className="accent-blue-600"
              />
              <span className="text-sm">יש הנחה</span>
            </label>
            {hasDiscount && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">סכום הנחה (₪)</label>
                <input
                  name="discount_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountAmount}
                  onChange={e => setDiscountAmount(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Final price (read-only) */}
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="text-xs text-green-700 mb-0.5">מחיר סופי</p>
            <p className="text-xl font-bold text-green-800">
              {finalPrice.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Checkboxes */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="payment_on_delivery"
              value="true"
              defaultChecked={income?.payment_on_delivery}
              className="accent-blue-600"
            />
            <span className="text-sm">תשלום במסירה</span>
          </label>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תאריך *</label>
            <input
              name="income_date"
              type="date"
              defaultValue={income?.income_date ?? today}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
            <textarea
              name="notes"
              defaultValue={income?.notes ?? ''}
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
              {isPending ? 'שומר...' : income ? 'שמור שינויים' : 'הוסף הכנסה'}
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
