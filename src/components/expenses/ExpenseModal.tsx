'use client'

import { useRef, useState, useTransition } from 'react'
import { createExpense, updateExpense } from '@/app/(dashboard)/expenses/actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { UploadCloud, FileText, X, ExternalLink } from 'lucide-react'

type Category = {
  id: string
  name: string
  is_vat_recognized: boolean
}

type Receipt = {
  id: string
  cloudinary_url: string | null
  file_type: string | null
  cleaned_up_at: string | null
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
  const [transactionDate, setTransactionDate] = useState(expense?.transaction_date ?? new Date().toISOString().slice(0, 10))
  const [categoryId, setCategoryId] = useState<string>(expense?.category_id ?? 'none')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFiles(Array.from(e.target.files ?? []))
  }

  function removeFile(index: number) {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    if (fileInputRef.current) {
      const dt = new DataTransfer()
      newFiles.forEach(f => dt.items.add(f))
      fileInputRef.current.files = dt.files
    }
  }

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
              <input type="hidden" name="category_id" value={categoryId === 'none' ? '' : categoryId} />
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="ללא קטגוריה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא קטגוריה</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        {cat.name}
                        {cat.is_vat_recognized && (
                          <span className="text-[10px] bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/30 rounded px-1 py-0.5">מוכר מע&quot;מ</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="sm" onClick={onCategoryModalOpen} className="shrink-0">
                נהל
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>סכום כולל מע&quot;מ *</Label>
              <div className="relative">
                <Input name="total_amount" type="number" step="0.01" min="0" defaultValue={expense?.total_amount} required className="pl-8" />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">₪</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>תאריך עסקה *</Label>
              <DatePicker name="transaction_date" value={transactionDate} onChange={setTransactionDate} />
            </div>
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

          <div className="space-y-2">
            <Label>קבלות</Label>

            {expense?.receipts && expense.receipts.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {expense.receipts.map(r =>
                  r.cleaned_up_at ? (
                    <span key={r.id} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted border border-border rounded-lg px-2.5 py-1.5">
                      <FileText className="h-3 w-3" />
                      ארכיון
                    </span>
                  ) : (
                    <a key={r.id} href={r.cloudinary_url ?? '#'} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg px-2.5 py-1.5 transition-colors">
                      <FileText className="h-3 w-3" />
                      {r.file_type === 'pdf' ? 'PDF' : 'תמונה'}
                      <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                    </a>
                  )
                )}
              </div>
            )}

            <label htmlFor="receipts-input"
              className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
              <UploadCloud className="h-7 w-7 text-muted-foreground mb-1" />
              <span className="text-sm font-medium text-muted-foreground">לחץ להוספת קבלות</span>
              <span className="text-xs text-muted-foreground/60">תמונות (JPG/PNG) או PDF</span>
            </label>
            <input
              ref={fileInputRef}
              id="receipts-input"
              name="receipts"
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="sr-only"
              onChange={handleFileChange}
            />

            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-muted border border-border rounded-lg px-2.5 py-1 text-xs text-foreground max-w-[180px]">
                    <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="truncate">{file.name}</span>
                    <button type="button" onClick={() => removeFile(i)} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
