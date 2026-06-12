'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import {
  format, parse, isValid, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, isSameDay, isSameMonth,
  addMonths, subMonths, isToday, isBefore, isAfter,
  setMonth, setYear, getMonth, getYear,
} from 'date-fns'
import { he } from 'date-fns/locale'
import { CalendarDays, ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const WEEKDAY_LABELS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'] // Sun–Sat

const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

function formatHebrewDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = parse(dateStr, 'yyyy-MM-dd', new Date())
  if (!isValid(d)) return dateStr
  return format(d, 'd MMMM yyyy', { locale: he })
}

export interface DatePickerProps {
  value?: string          // YYYY-MM-DD
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  min?: string            // YYYY-MM-DD
  max?: string            // YYYY-MM-DD
  className?: string
  /** If provided, a hidden <input> with this name is rendered so the value is submitted via FormData */
  name?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'בחר תאריך',
  disabled = false,
  min,
  max,
  className,
  name,
}: DatePickerProps) {
  const today = new Date()
  const initialDate = value && isValid(parse(value, 'yyyy-MM-dd', new Date()))
    ? parse(value, 'yyyy-MM-dd', new Date())
    : today

  const [open, setOpen] = React.useState(false)
  const [panelView, setPanelView] = React.useState<'days' | 'months' | 'years'>('days')
  const [viewDate, setViewDate] = React.useState<Date>(startOfMonth(initialDate))
  const [yearRangeStart, setYearRangeStart] = React.useState<number>(() =>
    Math.floor(getYear(initialDate) / 12) * 12
  )

  // Reset to day view when popover closes
  React.useEffect(() => {
    if (!open) setPanelView('days')
  }, [open])

  // Keep viewDate in sync when value changes externally
  React.useEffect(() => {
    if (value && isValid(parse(value, 'yyyy-MM-dd', new Date()))) {
      setViewDate(startOfMonth(parse(value, 'yyyy-MM-dd', new Date())))
    }
  }, [value])

  const selectedDate = value && isValid(parse(value, 'yyyy-MM-dd', new Date()))
    ? parse(value, 'yyyy-MM-dd', new Date())
    : null

  const minDate = min ? parse(min, 'yyyy-MM-dd', new Date()) : null
  const maxDate = max ? parse(max, 'yyyy-MM-dd', new Date()) : null

  // Build calendar grid: days of the current view month
  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const leadingBlanks = getDay(monthStart)
  const totalCells = leadingBlanks + days.length
  const trailingBlanks = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)

  function selectDay(d: Date) {
    if (minDate && isBefore(d, minDate)) return
    if (maxDate && isAfter(d, maxDate)) return
    onChange(format(d, 'yyyy-MM-dd'))
    setOpen(false)
  }

  function isDayDisabled(d: Date) {
    if (minDate && isBefore(d, minDate)) return true
    if (maxDate && isAfter(d, maxDate)) return true
    return false
  }

  function selectMonth(monthIndex: number) {
    setViewDate(v => startOfMonth(setMonth(v, monthIndex)))
    setPanelView('days')
  }

  function openYears() {
    setYearRangeStart(Math.floor(getYear(viewDate) / 12) * 12)
    setPanelView('years')
  }

  function selectYear(year: number) {
    setViewDate(v => startOfMonth(setYear(v, year)))
    setPanelView('months')
  }

  const viewYear = getYear(viewDate)
  const viewMonth = getMonth(viewDate)
  const monthLabel = format(viewDate, 'MMMM yyyy', { locale: he })

  return (
    <>
    {name && <input type="hidden" name={name} value={value ?? ''} />}
    <PopoverPrimitive.Root open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={placeholder}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm',
            'focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/40',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'field-skeu',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <span>{value ? formatHebrewDate(value) : placeholder}</span>
          <CalendarDays className="h-4 w-4 opacity-50 shrink-0 mr-1" />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className={cn(
            'z-50 w-72 rounded-xl border bg-popover p-3 text-popover-foreground',
            'card-skeu',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}
          dir="rtl"
        >
          {panelView === 'years' ? (
            /* ── Year picker ── */
            <>
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setYearRangeStart(y => y - 12)}
                  className="p-1.5 rounded-lg hover:bg-accent/15 transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="טווח קודם"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <span className="text-sm font-semibold text-foreground select-none">
                  {yearRangeStart} — {yearRangeStart + 11}
                </span>

                <button
                  type="button"
                  onClick={() => setYearRangeStart(y => y + 12)}
                  className="p-1.5 rounded-lg hover:bg-accent/15 transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="טווח הבא"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map(year => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => selectYear(year)}
                    className={cn(
                      'h-9 rounded-lg text-sm font-medium transition-all duration-100',
                      'focus:outline-none focus:ring-1 focus:ring-ring/40',
                      year === viewYear
                        ? 'bg-primary text-primary-foreground shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_2px_4px_rgba(0,0,0,0.2)]'
                        : 'hover:bg-accent/15 text-foreground',
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </>
          ) : panelView === 'months' ? (
            /* ── Month picker ── */
            <>
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setViewDate(v => startOfMonth(setYear(v, getYear(v) - 1)))}
                  className="p-1.5 rounded-lg hover:bg-accent/15 transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="שנה קודמת"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={openYears}
                  className="text-sm font-semibold text-foreground px-2 py-0.5 rounded-lg hover:bg-accent/15 transition-colors"
                  aria-label="בחר שנה"
                >
                  {viewYear}
                </button>

                <button
                  type="button"
                  onClick={() => setViewDate(v => startOfMonth(setYear(v, getYear(v) + 1)))}
                  className="p-1.5 rounded-lg hover:bg-accent/15 transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="שנה הבאה"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {MONTH_NAMES.map((name_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectMonth(idx)}
                    className={cn(
                      'h-9 rounded-lg text-sm font-medium transition-all duration-100',
                      'focus:outline-none focus:ring-1 focus:ring-ring/40',
                      idx === viewMonth && viewYear === getYear(viewDate)
                        ? 'bg-primary text-primary-foreground shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_2px_4px_rgba(0,0,0,0.2)]'
                        : 'hover:bg-accent/15 text-foreground',
                    )}
                  >
                    {name_}
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* ── Day picker ── */
            <>
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setViewDate(v => subMonths(v, 1))}
                  className="p-1.5 rounded-lg hover:bg-accent/15 transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="חודש קודם"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setPanelView('months')}
                  className="text-sm font-semibold text-foreground px-2 py-0.5 rounded-lg hover:bg-accent/15 transition-colors"
                  aria-label="בחר חודש ושנה"
                >
                  {monthLabel}
                </button>

                <button
                  type="button"
                  onClick={() => setViewDate(v => addMonths(v, 1))}
                  className="p-1.5 rounded-lg hover:bg-accent/15 transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="חודש הבא"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAY_LABELS.map(d => (
                  <div key={d} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground select-none">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-px">
                {Array.from({ length: leadingBlanks }).map((_, i) => (
                  <div key={`pre-${i}`} />
                ))}

                {days.map(d => {
                  const selected = selectedDate ? isSameDay(d, selectedDate) : false
                  const today_ = isToday(d)
                  const outside = !isSameMonth(d, viewDate)
                  const disabled_ = isDayDisabled(d)

                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      disabled={disabled_}
                      onClick={() => selectDay(d)}
                      className={cn(
                        'h-8 w-full rounded-lg text-sm font-medium transition-all duration-100',
                        'focus:outline-none focus:ring-1 focus:ring-ring/40',
                        outside && 'opacity-30',
                        disabled_ && 'cursor-not-allowed opacity-30',
                        selected && 'bg-primary text-primary-foreground shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_2px_4px_rgba(0,0,0,0.2)]',
                        !selected && today_ && 'bg-accent/20 text-accent-foreground font-bold ring-1 ring-accent/50',
                        !selected && !disabled_ && 'hover:bg-accent/15 hover:text-foreground',
                        !selected && !today_ && 'text-foreground',
                      )}
                    >
                      {format(d, 'd')}
                    </button>
                  )
                })}

                {Array.from({ length: trailingBlanks }).map((_, i) => (
                  <div key={`post-${i}`} />
                ))}
              </div>

              {/* Today shortcut */}
              <div className="mt-3 pt-2.5 border-t border-border">
                <button
                  type="button"
                  onClick={() => { selectDay(today); setViewDate(startOfMonth(today)) }}
                  className="w-full text-center text-xs font-medium text-primary hover:text-primary/80 transition-colors py-0.5"
                >
                  היום
                </button>
              </div>
            </>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
    </>
  )
}
