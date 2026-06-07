'use client'

import { useRef, useState, useTransition } from 'react'
import { createEvent, updateEvent } from '@/app/(dashboard)/calendar/actions'
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
  event?: CalendarEvent
  defaultStart?: string  // ISO datetime string pre-filled when clicking a slot
  onClose: () => void
}

const RECURRENCE_OPTIONS = [
  { value: '', label: 'ללא חזרה' },
  { value: 'FREQ=DAILY', label: 'יומי' },
  { value: 'FREQ=WEEKLY', label: 'שבועי' },
  { value: 'FREQ=MONTHLY', label: 'חודשי' },
  { value: 'custom', label: 'מותאם אישית (RRULE)' },
]

function toDatetimeLocal(iso: string | null | undefined) {
  if (!iso) return ''
  // slice to 'YYYY-MM-DDTHH:mm'
  return iso.slice(0, 16)
}

function toDateLocal(iso: string | null | undefined) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

export default function EventModal({ event, defaultStart, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [isAllDay, setIsAllDay] = useState(event?.is_all_day ?? false)
  const [recurrence, setRecurrence] = useState(() => {
    const r = event?.recurrence_rule ?? ''
    if (!r) return ''
    const known = RECURRENCE_OPTIONS.find(o => o.value === r && o.value !== '' && o.value !== 'custom')
    return known ? r : 'custom'
  })
  const [customRrule, setCustomRrule] = useState(() => {
    const r = event?.recurrence_rule ?? ''
    const known = RECURRENCE_OPTIONS.find(o => o.value === r && o.value !== '' && o.value !== 'custom')
    return known ? '' : r
  })
  const formRef = useRef<HTMLFormElement>(null)

  const defaultStartVal = defaultStart
    ? toDatetimeLocal(defaultStart)
    : toDatetimeLocal(event?.start_time)

  const defaultEndVal = toDatetimeLocal(event?.end_time)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formData = new FormData(formRef.current!)
    formData.set('is_all_day', isAllDay ? 'true' : 'false')

    // Resolve recurrence_rule
    if (recurrence === 'custom') {
      formData.set('recurrence_rule', customRrule.trim())
    } else {
      formData.set('recurrence_rule', recurrence)
    }

    startTransition(async () => {
      const action = event ? updateEvent : createEvent
      const result = await action(null, formData)
      if (result.error) { setError(result.error); toast.error(result.error) }
      else { toast.success(event ? 'אירוע עודכן' : 'אירוע נוסף'); onClose() }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <div className="sticky top-0 bg-white border-b border-gray-100 flex items-center justify-between px-6 py-4">
          <h2 className="text-lg font-bold">{event ? 'עריכת אירוע' : 'אירוע חדש'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
          {event && <input type="hidden" name="event_id" value={event.id} />}

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">כותרת *</label>
            <input
              name="title"
              defaultValue={event?.title}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
            <textarea
              name="description"
              defaultValue={event?.description ?? ''}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* All day toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAllDay}
              onChange={e => setIsAllDay(e.target.checked)}
              className="accent-blue-600"
            />
            <span className="text-sm">כל היום</span>
          </label>

          {/* Start */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תאריך ושעת התחלה *</label>
            {isAllDay ? (
              <input
                name="start_time"
                type="date"
                defaultValue={defaultStartVal.slice(0, 10) || toDateLocal(event?.start_time)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <input
                name="start_time"
                type="datetime-local"
                defaultValue={defaultStartVal}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* End */}
          {!isAllDay && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תאריך ושעת סיום</label>
              <input
                name="end_time"
                type="datetime-local"
                defaultValue={defaultEndVal}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Recurrence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">חזרה</label>
            <select
              value={recurrence}
              onChange={e => setRecurrence(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {RECURRENCE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {recurrence === 'custom' && (
              <input
                type="text"
                value={customRrule}
                onChange={e => setCustomRrule(e.target.value)}
                placeholder="FREQ=WEEKLY;BYDAY=MO,WE"
                className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {isPending ? 'שומר...' : event ? 'שמור שינויים' : 'צור אירוע'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
