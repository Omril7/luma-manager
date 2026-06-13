'use client'

import { useRef, useState, useTransition } from 'react'
import { updateInstallment } from '@/app/(dashboard)/expenses/actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { UploadCloud, FileText, Image as ImageIcon, X, ExternalLink } from 'lucide-react'

const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

type Receipt = {
  id: string
  cloudinary_url: string | null
  file_type: string | null
}

type Props = {
  installmentId: string
  installmentNumber: number
  dueMonth: string
  currentAmount: number
  expenseDescription: string
  receipts: Receipt[]
  onClose: () => void
}

export default function InstallmentModal({
  installmentId,
  installmentNumber,
  dueMonth,
  currentAmount,
  expenseDescription,
  receipts,
  onClose,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const monthIndex = parseInt(dueMonth.slice(5, 7)) - 1
  const year = dueMonth.slice(0, 4)
  const monthLabel = `${MONTH_NAMES[monthIndex]} ${year}`

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
    formData.set('installment_id', installmentId)
    selectedFiles.forEach(f => formData.append('receipts', f))
    startTransition(async () => {
      const result = await updateInstallment(null, formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('חודש עודכן')
        onClose()
      }
    })
  }

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>עריכת חודש — {monthLabel}</DialogTitle>
          <p className="text-sm text-muted-foreground pt-1">{expenseDescription} · תשלום {installmentNumber}</p>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>סכום לחודש זה *</Label>
            <div className="relative">
              <Input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={currentAmount}
                required
                className="pl-8"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">₪</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>קבלות לחודש זה</Label>

            {receipts.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {receipts.map(r => (
                  <a
                    key={r.id}
                    href={r.cloudinary_url ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg px-2.5 py-1.5 transition-colors"
                  >
                    {r.file_type === 'pdf' ? <FileText className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                    {r.file_type === 'pdf' ? 'PDF' : 'תמונה'}
                    <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                  </a>
                ))}
              </div>
            )}

            <label
              htmlFor="inst-receipts-input"
              className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <UploadCloud className="h-6 w-6 text-muted-foreground mb-1" />
              <span className="text-sm text-muted-foreground">הוסף קבלה לחודש זה</span>
            </label>
            <input
              ref={fileInputRef}
              id="inst-receipts-input"
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'שומר...' : 'שמור'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
