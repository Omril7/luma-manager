'use client'

import { useRef, useState, useTransition } from 'react'
import { createExpense, updateExpense } from '@/app/(dashboard)/expenses/actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatILS } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { UploadCloud, FileText, X, ExternalLink, Plus } from 'lucide-react'

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

type SplitData = {
  id: string
  category_id: string | null
  amount: number
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
  expense_category_splits: SplitData[]
}

type SplitRow = { key: string; category_id: string; amount: string }

type Props = {
  categories: Category[]
  expense?: Expense
  closedMonths: string[]
  onClose: () => void
  onCategoryModalOpen: () => void
}

export default function ExpenseModal({ categories, expense, closedMonths, onClose, onCategoryModalOpen }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [hasInstallments, setHasInstallments] = useState(expense ? expense.installments_total > 1 : false)
  const [transactionDate, setTransactionDate] = useState(expense?.transaction_date ?? new Date().toISOString().slice(0, 10))
  const [categoryId, setCategoryId] = useState<string>(expense?.category_id ?? 'none')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [totalAmount, setTotalAmount] = useState(expense?.total_amount ?? 0)

  const existingSplits = expense?.expense_category_splits ?? []
  const [isSplit, setIsSplit] = useState(() => existingSplits.length > 0)
  const [splits, setSplits] = useState<SplitRow[]>(() =>
    existingSplits.length > 0
      ? existingSplits.map(s => ({ key: crypto.randomUUID(), category_id: s.category_id ?? 'none', amount: String(s.amount) }))
      : [{ key: crypto.randomUUID(), category_id: 'none', amount: '' }]
  )

  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const splitTotal = splits.reduce((s, sp) => s + (parseFloat(sp.amount) || 0), 0)
  const splitRemaining = totalAmount - splitTotal
  const splitBalanced = Math.abs(splitRemaining) < 0.01

  function addSplit() {
    setSplits(prev => [...prev, { key: crypto.randomUUID(), category_id: 'none', amount: '' }])
  }

  function removeSplit(index: number) {
    setSplits(prev => prev.filter((_, i) => i !== index))
  }

  function updateSplitField(index: number, field: 'category_id' | 'amount', value: string) {
    setSplits(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  function toggleSplit(on: boolean) {
    setIsSplit(on)
    if (on) setHasInstallments(false)
  }

  function toggleInstallments(on: boolean) {
    setHasInstallments(on)
    if (on) setIsSplit(false)
  }

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
    if (closedMonths.includes(transactionDate.slice(0, 7))) {
      const msg = 'לא ניתן לשמור הוצאה לחודש סגור'
      setError(msg)
      toast.error(msg)
      return
    }
    if (isSplit && !splitBalanced) {
      const msg = `סכום הפיצולים (${formatILS(splitTotal)}) חייב להיות שווה לסכום הכולל (${formatILS(totalAmount)})`
      setError(msg)
      toast.error(msg)
      return
    }
    if (isSplit && splits.length < 2) {
      const msg = 'פיצול לקטגוריות דורש לפחות שתי שורות'
      setError(msg)
      toast.error(msg)
      return
    }

    const formData = new FormData(formRef.current!)
    formData.set('has_installments', hasInstallments && !isSplit ? 'true' : 'false')
    if (!hasInstallments || isSplit) formData.set('installments_total', '1')

    if (isSplit) {
      formData.set('splits', JSON.stringify(
        splits.map(s => ({
          category_id: s.category_id === 'none' ? null : s.category_id,
          amount: parseFloat(s.amount) || 0,
        }))
      ))
    } else {
      formData.set('splits', '')
    }

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
          {/* category_id is empty when split mode is active */}
          <input type="hidden" name="category_id" value={isSplit ? '' : (categoryId === 'none' ? '' : categoryId)} />

          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

          <div className="space-y-1.5">
            <Label>תיאור *</Label>
            <Input name="description" defaultValue={expense?.description} required />
          </div>

          {/* Category — single or split */}
          {!isSplit && (
            <div className="space-y-1.5">
              <Label>קטגוריה</Label>
              <div className="flex gap-2">
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
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>סכום כולל מע&quot;מ *</Label>
              <div className="relative">
                <Input
                  name="total_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={expense?.total_amount}
                  required
                  className="pl-8"
                  onChange={e => setTotalAmount(parseFloat(e.target.value) || 0)}
                />
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

            {/* Installments */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="has_installments"
                checked={hasInstallments}
                disabled={isSplit}
                onCheckedChange={v => toggleInstallments(!!v)}
              />
              <Label htmlFor="has_installments" className={cn('font-normal cursor-pointer', isSplit && 'opacity-40 cursor-not-allowed')}>תשלומים</Label>
            </div>

            {hasInstallments && !isSplit && (
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

            {/* Split toggle */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_split"
                checked={isSplit}
                disabled={hasInstallments}
                onCheckedChange={v => toggleSplit(!!v)}
              />
              <Label htmlFor="is_split" className={cn('font-normal cursor-pointer', hasInstallments && 'opacity-40 cursor-not-allowed')}>פיצול לקטגוריות</Label>
            </div>

            {/* Split rows */}
            {isSplit && (
              <div className="mr-6 space-y-2.5">
                {splits.map((split, index) => (
                  <div key={split.key} className="flex gap-2 items-center">
                    <Select value={split.category_id} onValueChange={v => updateSplitField(index, 'category_id', v)}>
                      <SelectTrigger className="flex-1 min-w-0">
                        <SelectValue placeholder="ללא קטגוריה" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">ללא קטגוריה</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <span className="flex items-center gap-2">
                              {cat.name}
                              {cat.is_vat_recognized && (
                                <span className="text-[10px] bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/30 rounded px-1 py-0.5">מוכר</span>
                              )}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="relative w-28 shrink-0">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={split.amount}
                        onChange={e => updateSplitField(index, 'amount', e.target.value)}
                        className="pl-7 text-sm"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">₪</span>
                    </div>
                    {splits.length > 1 && (
                      <button type="button" onClick={() => removeSplit(index)} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-between">
                  <button type="button" onClick={addSplit}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                    <Plus className="h-3 w-3" />
                    הוסף פיצול
                  </button>
                  <span className={cn('text-xs tabular-nums', splitBalanced ? 'text-green-600 dark:text-green-400' : 'text-destructive')}>
                    {splitBalanced
                      ? '✓ מאוזן'
                      : splitRemaining > 0
                        ? `נותר: ${formatILS(splitRemaining)}`
                        : `חריגה: ${formatILS(-splitRemaining)}`}
                  </span>
                </div>
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
