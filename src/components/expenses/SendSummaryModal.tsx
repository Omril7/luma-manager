'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { MonthPicker, type MonthPickerValue } from '@/components/ui/month-picker'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

type Props = { onClose: () => void; hasGmailConfig: boolean }

export default function SendSummaryModal({ onClose, hasGmailConfig }: Props) {
  const now = new Date()
  const [monthValue, setMonthValue] = useState<MonthPickerValue>({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const [stats, setStats] = useState<{ vatRecognizedCount: number; personalCount: number; attachmentCount: number } | null>(null)

  async function handleSend() {
    setStatus('sending'); setError('')
    try {
      const res = await fetch('/api/send-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: monthValue.year, month: monthValue.month }),
      })
      const data = await res.json() as { success?: boolean; error?: string; stats?: typeof stats }
      if (!res.ok || data.error) { setError(data.error ?? 'שגיאה בשליחת המייל'); setStatus('error') }
      else { setStats(data.stats ?? null); setStatus('success') }
    } catch {
      setError('שגיאת רשת — אנא נסה שוב'); setStatus('error')
    }
  }

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>שליחת סיכום חודשי</DialogTitle>
        </DialogHeader>

        {status === 'success' ? (
          <div className="text-center space-y-3 py-4">
            <div className="text-4xl">✅</div>
            <p className="font-medium text-green-700 dark:text-green-400">המייל נשלח בהצלחה!</p>
            {stats && (
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>הוצאות עסקיות מוכרות מע&quot;מ: {stats.vatRecognizedCount}</li>
                <li>הוצאות אישיות: {stats.personalCount}</li>
                <li>קבלות מצורפות: {stats.attachmentCount}</li>
              </ul>
            )}
            <Button onClick={onClose} className="mt-2">סגור</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {!hasGmailConfig && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                לא הוגדר חשבון Gmail — אנא הגדר בעמוד ההגדרות לפני שליחה.
              </div>
            )}

            <div className="space-y-1.5">
              <Label>חודש לדוח</Label>
              <MonthPicker value={monthValue} onChange={setMonthValue} />
            </div>

            <div className="bg-muted rounded-lg px-4 py-3 text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">מה ייכלל בדוח:</p>
              <p>• הוצאות עסקיות מקטגוריות מוכרות מע&quot;מ</p>
              <p>• הוצאות אישיות (לידיעה בלבד)</p>
              <p>• קבלות מצורפות כקבצים</p>
              <p>• הדוח יישלח אל כתובת ה-Gmail שהוגדרה בהגדרות</p>
            </div>

            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
              <Button onClick={handleSend} disabled={status === 'sending' || !hasGmailConfig}>
                {status === 'sending' ? 'שולח...' : 'שלח'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
