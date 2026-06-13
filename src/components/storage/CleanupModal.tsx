'use client'

import { useState, useTransition } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cleanupMonth } from '@/app/(dashboard)/storage/actions'
import { toast } from 'sonner'
import { CheckCircle2 } from 'lucide-react'

const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

type Step = 'idle' | 'downloading' | 'confirm-delete' | 'done'

type Props = {
  month: string    // YYYY-MM
  activeCount: number
  onClose: () => void
}

export default function CleanupModal({ month, activeCount, onClose }: Props) {
  const [year, mm] = month.split('-')
  const monthName = MONTH_NAMES[parseInt(mm, 10) - 1]
  const monthLabel = `${monthName} ${year}`

  const [step, setStep] = useState<Step>('idle')
  const [progress, setProgress] = useState(0)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleDownload() {
    setStep('downloading')
    setProgress(0)
    setDownloadError(null)

    try {
      const res = await fetch(`/api/storage/download?year=${year}&month=${parseInt(mm, 10)}`)
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'שגיאה בהורדה')
      }

      const contentLength = res.headers.get('Content-Length')
      const total = contentLength ? parseInt(contentLength, 10) : 0
      const reader = res.body!.getReader()
      const chunks: Uint8Array[] = []
      let received = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        received += value.length
        if (total > 0) setProgress(Math.round((received / total) * 100))
      }

      // Trigger browser save-dialog
      const blob = new Blob(chunks as unknown as BlobPart[], { type: 'application/zip' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipts-${year}-${mm}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setProgress(100)
      setStep('confirm-delete')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שגיאה בהורדה'
      setDownloadError(message)
      setStep('idle')
    }
  }

  function handleCleanup() {
    startTransition(async () => {
      const res = await cleanupMonth(parseInt(year, 10), parseInt(mm, 10))
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`${res.count} קבצים נמחקו מ-Cloudinary`)
        setStep('done')
      }
    })
  }

  return (
    <Dialog open onOpenChange={open => { if (!open && step !== 'downloading') onClose() }}>
      <DialogContent className="max-w-md">

        {/* ── Step 1: idle ── */}
        {step === 'idle' && (
          <>
            <DialogHeader>
              <DialogTitle>ניקוי אחסון — {monthLabel}</DialogTitle>
              <DialogDescription>
                נמצאו <span className="font-medium text-foreground">{activeCount} קבצים</span> לחודש {monthLabel}.
                שלב ראשון: הורד את כל הקבצים כ-ZIP לפני המחיקה.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground space-y-1">
              <p>• ההורדה תתחיל מיד לאחר לחיצה.</p>
              <p>• לאחר השלמת ההורדה תוכל לאשר מחיקה מ-Cloudinary.</p>
              <p>• הרשומות יסומנו כ״בארכיון״ ולא ניתן לשחזר את הקבצים.</p>
            </div>

            {downloadError && (
              <p className="text-sm text-destructive">{downloadError}</p>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>ביטול</Button>
              <Button onClick={handleDownload}>
                הורד ZIP ({activeCount} קבצים)
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── Step 1b: downloading ── */}
        {step === 'downloading' && (
          <>
            <DialogHeader>
              <DialogTitle>מוריד קבצים...</DialogTitle>
              <DialogDescription>
                אנא המתן בזמן הורדת {activeCount} קבצים לחודש {monthLabel}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>מוריד...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                {progress > 0 ? (
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                ) : (
                  <div className="h-full bg-primary/60 rounded-full animate-[indeterminate_1.4s_ease-in-out_infinite]" />
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" disabled>מוריד...</Button>
            </DialogFooter>
          </>
        )}

        {/* ── Step 2: confirm delete ── */}
        {step === 'confirm-delete' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                ההורדה הושלמה
              </DialogTitle>
              <DialogDescription>
                ה-ZIP נשמר בהצלחה. כעת ניתן למחוק את הקבצים מ-Cloudinary.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive/80 space-y-1">
              <p>• פעולה זו אינה הפיכה.</p>
              <p>• {activeCount} קבצים יימחקו לצמיתות מ-Cloudinary.</p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>ביטול</Button>
              <Button variant="destructive" onClick={handleCleanup} disabled={isPending}>
                {isPending ? 'מוחק...' : `מחק ${activeCount} קבצים`}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── Done ── */}
        {step === 'done' && (
          <>
            <DialogHeader>
              <DialogTitle>הניקוי הושלם</DialogTitle>
              <DialogDescription>
                הקבצים של {monthLabel} נמחקו מ-Cloudinary וסומנו כארכיון.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={onClose}>סגור</Button>
            </DialogFooter>
          </>
        )}

      </DialogContent>
    </Dialog>
  )
}
