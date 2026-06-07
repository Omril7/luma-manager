'use client'

import { useRef, useState, useTransition } from 'react'
import { createExpense, updateExpense } from '@/app/(dashboard)/expenses/actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

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
  const [hasInstallments, setHasInstallments] = useState(expense ? expense.installments_total > 1 : false)
  const formRef = useRef<HTMLFormElement>(null)

  const today = new Date().toISOString().slice(0, 10)

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
        toast.error(result.error)
      } else {
        toast.success(expense ? 'הוצאה עודכנה' : 'הוצאה נוספה')
        onClose()
      }
    })
  }

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{expense ? 'עריכת הוצאה' : 'הוספת הוצאה'}</DialogTitle>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {expense && <input type="hidden" name="expense_id" value={expense.id} />}

          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

          <div className="space-y-1.5">
            <Label>תיאור *</Label>
            <Input name="description" defaultValue={expense?.description} required />
          </div>

          <div className="space-y-1.5">
            <Label>קטגוריה</Label>
            <div className="flex gap-2">
              <select
                name="category_id"
                defaultValue={expense?.category_id ?? ''}
                className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">ללא קטגוריה</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={onCategoryModalOpen}
                className="text-sm text-primary hover:underline whitespace-nowrap"
              >
                + נהל קטגוריות
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>סכום כולל מע&quot;מ (₪) *</Label>
            <Input name="total_amount" type="number" step="0.01" min="0" defaultValue={expense?.total_amount} required />
          </div>

          <div className="space-y-1.5">
            <Label>תאריך עסקה *</Label>
            <Input name="transaction_date" type="date" defaultValue={expense?.transaction_date ?? today} required />
          </div>

          <div className="space-y-3 border border-border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Checkbox name="is_recurring" value="true" defaultChecked={expense?.is_recurring} id="is_recurring" />
              <Label htmlFor="is_recurring" className="font-normal cursor-pointer">הוצאה קבועה (חוזרת כל חודש)</Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="has_installments"
                checked={hasInstallments}
                onCheckedChange={v => setHasInstallments(!!v)}
              />
              <Label htmlFor="has_installments" className="font-normal cursor-pointer">תשלומים</Label>
            </div>

            {hasInstallments && (
              <div className="mr-6 space-y-1">
                <Label className="text-xs text-muted-foreground">מספר תשלומים</Label>
                <Input
                  name="installments_total"
                  type="number"
                  min="2"
                  max="36"
                  defaultValue={expense && expense.installments_total > 1 ? expense.installments_total : 2}
                  className="w-24"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox name="is_personal" value="true" defaultChecked={expense?.is_personal} id="is_personal" />
              <Label htmlFor="is_personal" className="font-normal cursor-pointer">הוצאה אישית</Label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>קבלות</Label>
            {expense?.receipts && expense.receipts.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {expense.receipts.map(r => (
                  <a key={r.id} href={r.cloudinary_url} target="_blank" rel="noreferrer"
                    className="text-xs text-primary hover:underline border border-border rounded px-2 py-1">
                    {r.file_type === 'pdf' ? '📄 PDF' : '🖼 תמונה'}
                  </a>
                ))}
              </div>
            )}
            <Input name="receipts" type="file" accept="image/*,application/pdf" multiple />
          </div>

          <div className="space-y-1.5">
            <Label>הערות</Label>
            <Textarea name="notes" defaultValue={expense?.notes ?? ''} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'שומר...' : expense ? 'שמור שינויים' : 'הוסף הוצאה'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
