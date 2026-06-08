'use client'

import { useRef, useState, useTransition } from 'react'
import { createIncome, updateIncome } from '@/app/(dashboard)/income/actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

type Product = { id: string; name: string }
type IncomeRow = {
  id: string; product_name: string; product_id: string | null; order_id: string | null
  original_price: number; discount_amount: number; final_price: number
  payment_on_delivery: boolean; income_date: string; notes: string | null
}
type Props = { products: Product[]; income?: IncomeRow; onClose: () => void }

export default function IncomeModal({ products, income, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [hasDiscount, setHasDiscount] = useState(income ? income.discount_amount > 0 : false)
  const [originalPrice, setOriginalPrice] = useState(income?.original_price ?? 0)
  const [discountAmount, setDiscountAmount] = useState(income?.discount_amount ?? 0)
  const [useProduct, setUseProduct] = useState(!!income?.product_id)
  const [incomeDate, setIncomeDate] = useState(income?.income_date ?? new Date().toISOString().slice(0, 10))
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
      if (result.error) { setError(result.error); toast.error(result.error) }
      else { toast.success(income ? 'הכנסה עודכנה' : 'הכנסה נוספה'); onClose() }
    })
  }

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{income ? 'עריכת הכנסה' : 'הוספת הכנסה'}</DialogTitle>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {income && <input type="hidden" name="income_id" value={income.id} />}
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <Label>שם מוצר *</Label>
              {products.length > 0 && (
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                  <Checkbox checked={useProduct} onCheckedChange={v => setUseProduct(!!v)} />
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
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">בחר מוצר...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            ) : (
              <input type="hidden" name="product_id" value="" />
            )}
            <Input name="product_name" defaultValue={income?.product_name} required placeholder="שם מוצר" className={useProduct ? 'mt-2' : ''} />
          </div>

          <div className="space-y-1.5">
            <Label>מספר הזמנה</Label>
            <Input name="order_id" defaultValue={income?.order_id ?? ''} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>מחיר מקורי *</Label>
              <div className="relative">
                <Input name="original_price" type="number" step="0.01" min="0" value={originalPrice}
                  onChange={e => setOriginalPrice(Number(e.target.value))} required className="pl-8" />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">₪</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>תאריך *</Label>
              <DatePicker name="income_date" value={incomeDate} onChange={setIncomeDate} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox id="has_discount" checked={hasDiscount} onCheckedChange={v => setHasDiscount(!!v)} />
              <Label htmlFor="has_discount" className="font-normal cursor-pointer">יש הנחה</Label>
            </div>
            {hasDiscount && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">סכום הנחה</Label>
                <div className="relative">
                  <Input name="discount_amount" type="number" step="0.01" min="0"
                    value={discountAmount} onChange={e => setDiscountAmount(Number(e.target.value))} className="pl-8" />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">₪</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
            <p className="text-xs text-green-700 dark:text-green-400 mb-0.5">מחיר סופי</p>
            <p className="text-xl font-bold text-green-800 dark:text-green-300">
              {finalPrice.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox name="payment_on_delivery" value="true" defaultChecked={income?.payment_on_delivery} id="payment_on_delivery" />
            <Label htmlFor="payment_on_delivery" className="font-normal cursor-pointer">תשלום במסירה</Label>
          </div>

          <div className="space-y-1.5">
            <Label>הערות</Label>
            <Textarea name="notes" defaultValue={income?.notes ?? ''} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'שומר...' : income ? 'שמור שינויים' : 'הוסף הכנסה'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
