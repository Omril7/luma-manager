'use client'

import { useState, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, type View, type SlotInfo } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { he } from 'date-fns/locale'
import EventModal from './EventModal'
import EventPopup from './EventPopup'

type DBEvent = {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string | null
  is_all_day: boolean
  recurrence_rule: string | null
}

type RBCEvent = {
  id: string
  title: string
  start: Date
  end: Date
  allDay: boolean
  resource: DBEvent
}

type Props = {
  events: DBEvent[]
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: he }),
  getDay,
  locales: { he },
})

const MESSAGES = {
  today: 'היום',
  previous: 'הקודם',
  next: 'הבא',
  month: 'חודש',
  week: 'שבוע',
  day: 'יום',
  showMore: (count: number) => `+ ${count} נוספים`,
  noEventsInRange: 'אין אירועים בטווח זה',
}

function dbToRbc(ev: DBEvent): RBCEvent {
  const start = new Date(ev.start_time)
  const end = ev.end_time ? new Date(ev.end_time) : new Date(start.getTime() + 60 * 60 * 1000)
  return { id: ev.id, title: ev.title, start, end, allDay: ev.is_all_day, resource: ev }
}

export default function CalendarClient({ events }: Props) {
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())
  const [showEventModal, setShowEventModal] = useState(false)
  const [showEventPopup, setShowEventPopup] = useState(false)
  const [editingEvent, setEditingEvent] = useState<DBEvent | undefined>(undefined)
  const [selectedEvent, setSelectedEvent] = useState<DBEvent | undefined>(undefined)
  const [slotStart, setSlotStart] = useState<string | undefined>(undefined)

  const rbcEvents = events.map(dbToRbc)

  const handleSelectSlot = useCallback((slot: SlotInfo) => {
    setEditingEvent(undefined)
    setSlotStart(slot.start.toISOString())
    setShowEventModal(true)
  }, [])

  const handleSelectEvent = useCallback((event: RBCEvent) => {
    setSelectedEvent(event.resource)
    setShowEventPopup(true)
  }, [])

  function openEditFromPopup() {
    setEditingEvent(selectedEvent)
    setShowEventPopup(false)
    setSlotStart(undefined)
    setShowEventModal(true)
  }

  function openAdd() {
    setEditingEvent(undefined)
    setSlotStart(undefined)
    setShowEventModal(true)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-foreground">יומן</h1>
        <button
          onClick={openAdd}
          className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-lg hover:opacity-90"
        >
          + אירוע חדש
        </button>
      </div>

      {/* Calendar */}
      <div
        className="bg-card rounded-xl border border-border p-4"
        style={{ height: 680 }}
        dir="ltr"   // react-big-calendar is LTR internally; we flip labels via messages
      >
        <Calendar
          localizer={localizer}
          culture="he"
          events={rbcEvents}
          view={view}
          date={date}
          onView={v => setView(v)}
          onNavigate={d => setDate(d)}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          views={['month', 'week', 'day']}
          messages={MESSAGES}
          style={{ height: '100%' }}
          rtl={false}
          eventPropGetter={() => ({
            style: { backgroundColor: 'hsl(var(--primary))', border: 'none', borderRadius: 6 },
          })}
          dayPropGetter={d => {
            const today = new Date()
            const isToday =
              d.getDate() === today.getDate() &&
              d.getMonth() === today.getMonth() &&
              d.getFullYear() === today.getFullYear()
            return isToday ? { style: { backgroundColor: 'hsl(var(--primary) / 0.08)' } } : {}
          }}
        />
      </div>

      {/* Modals */}
      {showEventModal && (
        <EventModal
          event={editingEvent}
          defaultStart={slotStart}
          onClose={() => setShowEventModal(false)}
        />
      )}

      {showEventPopup && selectedEvent && (
        <EventPopup
          event={selectedEvent}
          onEdit={openEditFromPopup}
          onClose={() => setShowEventPopup(false)}
        />
      )}
    </div>
  )
}
