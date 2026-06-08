'use client'

import { useRef, useState, useTransition } from 'react'
import { createEvent, updateEvent } from '@/app/(dashboard)/calendar/actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type CalendarEvent = {
  id: string; title: string; description: string | null
  start_time: string; end_time: string | null
  is_all_day: boolean; recurrence_rule: string | null
}
type Props = { event?: CalendarEvent; defaultStart?: string; onClose: () => void }

const RECURRENCE_OPTIONS = [
  { value: '', label: 'ללא חזרה' },
  { value: 'FREQ=DAILY', label: 'יומי' },
  { value: 'FREQ=WEEKLY', label: 'שבועי' },
  { value: 'FREQ=MONTHLY', label: 'חודשי' },
  { value: 'custom', label: 'מותאם אישית (RRULE)' },
]

function toDatetimeLocal(iso: string | null | undefined) { return iso ? iso.slice(0, 16) : '' }
function toDateLocal(iso: string | null | undefined) { return iso ? iso.slice(0, 10) : '' }

export default function EventModal({ event, defaultStart, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [isAllDay, setIsAllDay] = useState(event?.is_all_day ?? false)
  const [allDayDate, setAllDayDate] = useState(
    event?.is_all_day ? toDateLocal(event?.start_time) : (defaultStart ? toDateLocal(defaultStart) : toDateLocal(new Date().toISOString()))
  )
  const [startDatetime, setStartDatetime] = useState(
    defaultStart ? toDatetimeLocal(defaultStart) : (toDatetimeLocal(event?.start_time) || '')
  )
  const [endDatetime, setEndDatetime] = useState(toDatetimeLocal(event?.end_time) || '')
  const [recurrence, setRecurrence] = useState(() => {
    const r = event?.recurrence_rule ?? ''
    if (!r) return 'none'
    return RECURRENCE_OPTIONS.find(o => o.value === r && o.value !== '' && o.value !== 'custom') ? r : 'custom'
  })
  const [customRrule, setCustomRrule] = useState(() => {
    const r = event?.recurrence_rule ?? ''
    return RECURRENCE_OPTIONS.find(o => o.value === r && o.value !== '' && o.value !== 'custom') ? '' : r
  })
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formData = new FormData(formRef.current!)
    formData.set('is_all_day', isAllDay ? 'true' : 'false')
    formData.set('recurrence_rule', recurrence === 'custom' ? customRrule.trim() : recurrence === 'none' ? '' : recurrence)
    startTransition(async () => {
      const result = await (event ? updateEvent : createEvent)(null, formData)
      if (result.error) { setError(result.error); toast.error(result.error) }
      else { toast.success(event ? 'אירוע עודכן' : 'אירוע נוסף'); onClose() }
    })
  }

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{event ? 'עריכת אירוע' : 'אירוע חדש'}</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {event && <input type="hidden" name="event_id" value={event.id} />}
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

          <div className="space-y-1.5">
            <Label>כותרת *</Label>
            <Input name="title" defaultValue={event?.title} required />
          </div>

          <div className="space-y-1.5">
            <Label>תיאור</Label>
            <Textarea name="description" defaultValue={event?.description ?? ''} rows={2} />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="is_all_day" checked={isAllDay} onCheckedChange={v => setIsAllDay(!!v)} />
            <Label htmlFor="is_all_day" className="font-normal cursor-pointer">כל היום</Label>
          </div>

          <div className="space-y-1.5">
            <Label>תאריך ושעת התחלה *</Label>
            {isAllDay ? (
              <DatePicker name="start_time" value={allDayDate} onChange={setAllDayDate} />
            ) : (
              <DateTimePicker name="start_time" value={startDatetime} onChange={setStartDatetime} />
            )}
          </div>

          {!isAllDay && (
            <div className="space-y-1.5">
              <Label>תאריך ושעת סיום</Label>
              <DateTimePicker name="end_time" value={endDatetime} onChange={setEndDatetime} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>חזרה</Label>
            <Select value={recurrence} onValueChange={setRecurrence}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCE_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value === '' ? 'none' : o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {recurrence === 'custom' && (
              <Input
                type="text"
                value={customRrule}
                onChange={e => setCustomRrule(e.target.value)}
                placeholder="FREQ=WEEKLY;BYDAY=MO,WE"
                className="font-mono mt-1"
              />
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'שומר...' : event ? 'שמור שינויים' : 'צור אירוע'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
