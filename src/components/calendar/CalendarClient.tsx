'use client'

import { useState, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, type View, type SlotInfo, type ToolbarProps } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { he } from 'date-fns/locale'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
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

type Props = { events: DBEvent[] }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: he }),
  getDay,
  locales: { he },
})

const VIEW_LABELS: Record<string, string> = { month: 'חודש', week: 'שבוע', day: 'יום' }

function CalendarToolbar({ label, onNavigate, onView, view }: ToolbarProps<RBCEvent>) {
  const pillBtn = (active: boolean) => cn(
    'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 select-none',
    active
      ? 'bg-primary text-primary-foreground shadow-sm'
      : 'text-muted-foreground hover:text-foreground',
  )

  const viewSwitcher = (
    <div className="inline-flex rounded-lg border border-border bg-muted p-0.5 gap-0.5">
      {(['month', 'week', 'day'] as const).map(v => (
        <button key={v} type="button" onClick={() => onView(v)} className={pillBtn(view === v)}>
          {VIEW_LABELS[v]}
        </button>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col gap-2 mb-3" dir="rtl">
      {/* Row 1: today + view switcher */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => onNavigate('TODAY')} className={pillBtn(false)}>
          היום
        </button>
        {viewSwitcher}
      </div>
      {/* Row 2 (mobile) / inline (desktop): nav */}
      <div className="flex items-center justify-center gap-1">
        <button type="button" onClick={() => onNavigate('PREV')} className={pillBtn(false)} aria-label="הקודם">
          <ChevronRight className="h-4 w-4" />
        </button>
        <span className="text-base font-semibold text-foreground w-40 sm:w-48 text-center">{label}</span>
        <button type="button" onClick={() => onNavigate('NEXT')} className={pillBtn(false)} aria-label="הבא">
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function dbToRbc(ev: DBEvent): RBCEvent {
  const start = new Date(ev.start_time)
  const end = ev.end_time ? new Date(ev.end_time) : new Date(start.getTime() + 60 * 60 * 1000)
  return { id: ev.id, title: ev.title, start, end, allDay: ev.is_all_day, resource: ev }
}

export default function CalendarClient({ events }: Props) {
  const [view, setView]               = useState<View>('month')
  const [date, setDate]               = useState(new Date())
  const [showEventModal, setShowEventModal] = useState(false)
  const [showEventPopup, setShowEventPopup] = useState(false)
  const [editingEvent,   setEditingEvent]   = useState<DBEvent | undefined>()
  const [selectedEvent,  setSelectedEvent]  = useState<DBEvent | undefined>()
  const [slotStart,      setSlotStart]      = useState<string | undefined>()

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
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-foreground">יומן</h1>
        <button
          onClick={openAdd}
          className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-lg hover:opacity-90"
        >
          + אירוע חדש
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 h-[480px] sm:h-[560px] md:h-[680px]">
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
          messages={{ showMore: (n: number) => `+ ${n} נוספים`, noEventsInRange: 'אין אירועים בטווח זה' }}
          style={{ height: '100%' }}
          rtl
          components={{ toolbar: CalendarToolbar as React.ComponentType<ToolbarProps<RBCEvent>> }}
          eventPropGetter={() => ({ style: { backgroundColor: 'hsl(var(--primary))', border: 'none', borderRadius: 5 } })}
          dayPropGetter={d => {
            const t = new Date()
            const isToday = d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()
            return isToday ? { style: { backgroundColor: 'hsl(var(--primary) / 0.08)' } } : {}
          }}
        />
      </div>

      {showEventModal && (
        <EventModal event={editingEvent} defaultStart={slotStart} onClose={() => setShowEventModal(false)} />
      )}
      {showEventPopup && selectedEvent && (
        <EventPopup event={selectedEvent} onEdit={openEditFromPopup} onClose={() => setShowEventPopup(false)} />
      )}
    </div>
  )
}
