'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import {
  format, parse, isValid, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, isSameDay, isSameMonth,
  addMonths, subMonths, isToday,
  setMonth, setYear, getMonth, getYear,
} from 'date-fns'
import { he } from 'date-fns/locale'
import { CalendarDays, ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

const WEEKDAY_LABELS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]
const HOURS   = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)

function pad(n: number) { return String(n).padStart(2, '0') }

function formatDisplay(dateStr: string, timeStr: string): string {
  if (!dateStr) return ''
  const d = parse(dateStr, 'yyyy-MM-dd', new Date())
  if (!isValid(d)) return ''
  return `${format(d, 'd MMMM yyyy', { locale: he })}, ${timeStr}`
}

export interface DateTimePickerProps {
  value?: string
  onChange: (value: string) => void
  name?: string
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function DateTimePicker({
  value,
  onChange,
  name,
  disabled,
  placeholder = 'בחר תאריך ושעה',
  className,
}: DateTimePickerProps) {
  const normalized  = value ? value.replace(' ', 'T').slice(0, 16) : ''
  const [localDate, setLocalDate] = React.useState(normalized.slice(0, 10))
  const initTime    = normalized.slice(11, 16) || '09:00'
  const [selHour,   setSelHour]   = React.useState(() => parseInt(initTime.slice(0, 2), 10))
  const [selMinute, setSelMinute] = React.useState(() => {
    const m = parseInt(initTime.slice(3, 5), 10)
    return MINUTES.includes(m) ? m : 0
  })
  const [open, setOpen] = React.useState(false)
  const [panelView, setPanelView] = React.useState<'days' | 'months' | 'years'>('days')

  const today = new Date()
  const initDate = localDate && isValid(parse(localDate, 'yyyy-MM-dd', new Date()))
    ? parse(localDate, 'yyyy-MM-dd', new Date()) : today

  const [viewDate,      setViewDate]      = React.useState<Date>(startOfMonth(initDate))
  const [yearRangeStart, setYearRangeStart] = React.useState(Math.floor(getYear(initDate) / 12) * 12)

  const hourRef   = React.useRef<HTMLDivElement>(null)
  const minuteRef = React.useRef<HTMLDivElement>(null)

  // Sync from external value
  React.useEffect(() => {
    if (value) {
      const n = value.replace(' ', 'T').slice(0, 16)
      setLocalDate(n.slice(0, 10))
      const h = parseInt(n.slice(11, 13), 10)
      const m = parseInt(n.slice(14, 16), 10)
      if (!isNaN(h)) setSelHour(h)
      if (!isNaN(m)) setSelMinute(MINUTES.includes(m) ? m : 0)
    }
  }, [value])

  // Scroll time lists to selected on open
  React.useEffect(() => {
    if (!open) { setPanelView('days'); return }
    requestAnimationFrame(() => {
      if (hourRef.current) {
        const el = hourRef.current.querySelector<HTMLElement>('[data-selected="true"]')
        el?.scrollIntoView({ block: 'center' })
      }
      if (minuteRef.current) {
        const el = minuteRef.current.querySelector<HTMLElement>('[data-selected="true"]')
        el?.scrollIntoView({ block: 'center' })
      }
    })
  }, [open])

  const selectedDate = localDate && isValid(parse(localDate, 'yyyy-MM-dd', new Date()))
    ? parse(localDate, 'yyyy-MM-dd', new Date()) : null

  const timeStr  = `${pad(selHour)}:${pad(selMinute)}`
  const fullValue = localDate ? `${localDate}T${timeStr}` : ''

  function emit(date: string, h: number, m: number) {
    if (date) onChange(`${date}T${pad(h)}:${pad(m)}`)
  }

  function handleDaySelect(d: Date) {
    const ds = format(d, 'yyyy-MM-dd')
    setLocalDate(ds)
    emit(ds, selHour, selMinute)
  }

  function handleHour(h: number) {
    setSelHour(h)
    emit(localDate, h, selMinute)
  }

  function handleMinute(m: number) {
    setSelMinute(m)
    emit(localDate, selHour, m)
  }

  const monthStart    = startOfMonth(viewDate)
  const days          = eachDayOfInterval({ start: monthStart, end: endOfMonth(viewDate) })
  const leadingBlanks = getDay(monthStart)
  const total         = leadingBlanks + days.length
  const trailingBlanks = total % 7 === 0 ? 0 : 7 - (total % 7)
  const viewYear  = getYear(viewDate)
  const viewMonth = getMonth(viewDate)
  const monthLabel = format(viewDate, 'MMMM yyyy', { locale: he })

  const scrollBtn = 'p-1.5 rounded-lg hover:bg-accent/15 transition-colors text-muted-foreground hover:text-foreground'
  const timeItemCls = (active: boolean) => cn(
    'w-full text-center py-1.5 rounded-md text-sm font-medium cursor-pointer transition-all duration-100 select-none',
    active
      ? 'bg-primary text-primary-foreground'
      : 'hover:bg-accent/15 text-foreground',
  )

  return (
    <>
      {name && <input type="hidden" name={name} value={fullValue} />}
      <PopoverPrimitive.Root open={open} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm',
              'focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/40',
              'disabled:cursor-not-allowed disabled:opacity-50 field-skeu',
              !localDate && 'text-muted-foreground',
              className,
            )}
          >
            <span>{localDate ? formatDisplay(localDate, timeStr) : placeholder}</span>
            <CalendarDays className="h-4 w-4 opacity-50 shrink-0 mr-1" />
          </button>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={6}
            className={cn(
              'z-50 rounded-xl border bg-popover text-popover-foreground card-skeu',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            )}
            dir="rtl"
          >
            <div className="flex" dir="ltr">

              {/* ── Calendar side ── */}
              <div className="p-3 w-64">
                {panelView === 'years' && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <button type="button" onClick={() => setYearRangeStart(y => y - 12)} className={scrollBtn}>
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-semibold select-none">{yearRangeStart} — {yearRangeStart + 11}</span>
                      <button type="button" onClick={() => setYearRangeStart(y => y + 12)} className={scrollBtn}>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map(yr => (
                        <button key={yr} type="button"
                          onClick={() => { setViewDate(v => startOfMonth(setYear(v, yr))); setPanelView('months') }}
                          className={cn('h-9 rounded-lg text-sm font-medium transition-all',
                            yr === viewYear ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/15 text-foreground')}>
                          {yr}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {panelView === 'months' && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <button type="button" onClick={() => setViewDate(v => startOfMonth(setYear(v, getYear(v) - 1)))} className={scrollBtn}>
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button type="button"
                        onClick={() => { setYearRangeStart(Math.floor(viewYear / 12) * 12); setPanelView('years') }}
                        className="text-sm font-semibold px-2 py-0.5 rounded-lg hover:bg-accent/15 transition-colors">
                        {viewYear}
                      </button>
                      <button type="button" onClick={() => setViewDate(v => startOfMonth(setYear(v, getYear(v) + 1)))} className={scrollBtn}>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {MONTH_NAMES.map((n, idx) => (
                        <button key={idx} type="button"
                          onClick={() => { setViewDate(v => startOfMonth(setMonth(v, idx))); setPanelView('days') }}
                          className={cn('h-9 rounded-lg text-sm font-medium transition-all',
                            idx === viewMonth ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/15 text-foreground')}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {panelView === 'days' && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <button type="button" onClick={() => setViewDate(v => subMonths(v, 1))} className={scrollBtn}>
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setPanelView('months')}
                        className="text-sm font-semibold px-2 py-0.5 rounded-lg hover:bg-accent/15 transition-colors">
                        {monthLabel}
                      </button>
                      <button type="button" onClick={() => setViewDate(v => addMonths(v, 1))} className={scrollBtn}>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 mb-1" dir="rtl">
                      {WEEKDAY_LABELS.map(d => (
                        <div key={d} className="h-7 flex items-center justify-center text-xs font-medium text-muted-foreground select-none">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-px" dir="rtl">
                      {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`pre-${i}`} />)}
                      {days.map(d => {
                        const sel     = selectedDate ? isSameDay(d, selectedDate) : false
                        const today_  = isToday(d)
                        const outside = !isSameMonth(d, viewDate)
                        return (
                          <button key={d.toISOString()} type="button" onClick={() => handleDaySelect(d)}
                            className={cn(
                              'h-7 w-full rounded-md text-sm font-medium transition-all',
                              outside && 'opacity-30',
                              sel && 'bg-primary text-primary-foreground',
                              !sel && today_ && 'bg-accent/20 font-bold ring-1 ring-accent/50',
                              !sel && 'hover:bg-accent/15',
                              !sel && !today_ && 'text-foreground',
                            )}>
                            {format(d, 'd')}
                          </button>
                        )
                      })}
                      {Array.from({ length: trailingBlanks }).map((_, i) => <div key={`post-${i}`} />)}
                    </div>
                    <div className="mt-2 pt-2 border-t border-border">
                      <button type="button"
                        onClick={() => { handleDaySelect(today); setViewDate(startOfMonth(today)) }}
                        className="w-full text-center text-xs font-medium text-primary hover:text-primary/80 transition-colors py-0.5">
                        היום
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* ── Divider ── */}
              <div className="w-px bg-border my-3" />

              {/* ── Time side ── */}
              <div className="p-3 flex flex-col gap-2 w-28">
                <p className="text-xs font-medium text-muted-foreground text-center pb-1 border-b border-border">
                  {pad(selHour)}:{pad(selMinute)}
                </p>
                <div className="flex gap-1 flex-1">
                  {/* Hours */}
                  <div ref={hourRef} className="flex-1 overflow-y-auto h-48 space-y-0.5 scrollbar-thin">
                    {HOURS.map(h => (
                      <div key={h} data-selected={h === selHour} onClick={() => handleHour(h)}
                        className={timeItemCls(h === selHour)}>
                        {pad(h)}
                      </div>
                    ))}
                  </div>
                  <div className="w-px bg-border self-stretch" />
                  {/* Minutes */}
                  <div ref={minuteRef} className="flex-1 overflow-y-auto h-48 space-y-0.5 scrollbar-thin">
                    {MINUTES.map(m => (
                      <div key={m} data-selected={m === selMinute} onClick={() => handleMinute(m)}
                        className={timeItemCls(m === selMinute)}>
                        {pad(m)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Confirm ── */}
            <div className="px-3 pb-3">
              <Button type="button" size="sm" className="w-full" onClick={() => setOpen(false)}>
                אישור
              </Button>
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </>
  )
}
