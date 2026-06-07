'use client'

import { useTransition } from 'react'
import { deleteEvent } from '@/app/(dashboard)/calendar/actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

type CalendarEvent = {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string | null
  is_all_day: boolean
  recurrence_rule: string | null
}

type Props = {
  event: CalendarEvent
  onEdit: () => void
  onClose: () => void
}

const RRULE_LABELS: Record<string, string> = {
  'FREQ=DAILY': 'יומי',
  'FREQ=WEEKLY': 'שבועי',
  'FREQ=MONTHLY': 'חודשי',
}

function formatDT(iso: string, allDay: boolean) {
  const d = new Date(iso)
  if (allDay) return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
  return d.toLocaleString('he-IL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function EventPopup({ event, onEdit, onClose }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('למחוק אירוע זה?')) return
    startTransition(async () => {
      const res = await deleteEvent(event.id)
      if (res && 'error' in res && res.error) toast.error(res.error)
      else toast.success('אירוע נמחק')
      onClose()
    })
  }

  const recurrenceLabel = event.recurrence_rule
    ? (RRULE_LABELS[event.recurrence_rule] ?? event.recurrence_rule)
    : null

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="truncate">{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">התחלה</p>
            <p className="text-foreground">{formatDT(event.start_time, event.is_all_day)}</p>
          </div>
          {event.end_time && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">סיום</p>
              <p className="text-foreground">{formatDT(event.end_time, event.is_all_day)}</p>
            </div>
          )}
          {event.is_all_day && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">כל היום</span>
          )}
          {recurrenceLabel && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">חזרה</p>
              <p className="text-foreground">{recurrenceLabel}</p>
            </div>
          )}
          {event.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">תיאור</p>
              <p className="text-foreground whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button onClick={onEdit} className="flex-1">ערוך</Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            {isPending ? 'מוחק...' : 'מחק'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
