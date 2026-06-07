'use client'

import { useTransition } from 'react'
import { deleteEvent } from '@/app/(dashboard)/calendar/actions'
import { toast } from 'sonner'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm" dir="rtl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold truncate">{event.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none shrink-0">×</button>
        </div>

        <div className="px-5 py-4 space-y-3 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">התחלה</p>
            <p className="text-gray-800">{formatDT(event.start_time, event.is_all_day)}</p>
          </div>
          {event.end_time && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">סיום</p>
              <p className="text-gray-800">{formatDT(event.end_time, event.is_all_day)}</p>
            </div>
          )}
          {event.is_all_day && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">כל היום</span>
          )}
          {recurrenceLabel && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">חזרה</p>
              <p className="text-gray-800">{recurrenceLabel}</p>
            </div>
          )}
          {event.description && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">תיאור</p>
              <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onEdit}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            ערוך
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1 border border-red-200 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
          >
            {isPending ? 'מוחק...' : 'מחק'}
          </button>
        </div>
      </div>
    </div>
  )
}
