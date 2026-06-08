'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { ChevronRight, ChevronLeft, CalendarRange } from 'lucide-react'
import { cn } from '@/lib/utils'

const MONTH_LABELS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

export interface MonthPickerValue {
  month: number   // 1–12
  year: number
}

export interface MonthPickerProps {
  value?: MonthPickerValue
  onChange: (value: MonthPickerValue) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  /** If provided, a hidden <input> with this name is rendered (value = YYYY-MM) */
  name?: string
}

type PickerView = 'month' | 'year'

export function MonthPicker({
  value,
  onChange,
  placeholder = 'בחר חודש',
  disabled = false,
  className,
  name,
}: MonthPickerProps) {
  const now = new Date()
  const [open, setOpen] = React.useState(false)
  const [view, setView] = React.useState<PickerView>('month')
  const [viewYear, setViewYear] = React.useState(value?.year ?? now.getFullYear())
  // Base of the 12-year grid shown in year view
  const [yearBase, setYearBase] = React.useState(
    () => Math.floor((value?.year ?? now.getFullYear()) / 12) * 12
  )

  React.useEffect(() => {
    if (value?.year) setViewYear(value.year)
  }, [value?.year])

  function handleOpenChange(next: boolean) {
    if (disabled) return
    setOpen(next)
    if (!next) setView('month')   // reset to month view on close
  }

  function selectMonth(month: number) {
    onChange({ month, year: viewYear })
    setOpen(false)
  }

  function openYearView() {
    setYearBase(Math.floor(viewYear / 12) * 12)
    setView('year')
  }

  function selectYear(y: number) {
    setViewYear(y)
    setView('month')
  }

  const isMonthSelected = (m: number) => value?.month === m && value?.year === viewYear
  const isMonthCurrent = (m: number) => m === now.getMonth() + 1 && viewYear === now.getFullYear()

  const displayLabel = value
    ? `${MONTH_LABELS[value.month - 1]} ${value.year}`
    : placeholder

  const hiddenValue = value
    ? `${value.year}-${String(value.month).padStart(2, '0')}`
    : ''

  const yearRange = Array.from({ length: 12 }, (_, i) => yearBase + i)

  const popoverContent = view === 'month' ? (
    <>
      {/* Year row — clicking the year number switches to year picker */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setViewYear(y => y - 1)}
          className="p-1.5 rounded-lg hover:bg-accent/15 transition-colors text-muted-foreground hover:text-foreground"
          aria-label="שנה קודמת"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={openYearView}
          className="text-sm font-semibold text-foreground hover:text-primary hover:bg-accent/15 transition-colors select-none tabular-nums px-2 py-1 rounded-md"
          aria-label="בחר שנה"
        >
          {viewYear}
        </button>

        <button
          type="button"
          onClick={() => setViewYear(y => y + 1)}
          className="p-1.5 rounded-lg hover:bg-accent/15 transition-colors text-muted-foreground hover:text-foreground"
          aria-label="שנה הבאה"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* 3 × 4 month grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {MONTH_LABELS.map((label, i) => {
          const m = i + 1
          const selected = isMonthSelected(m)
          const current = isMonthCurrent(m)
          return (
            <button
              key={m}
              type="button"
              onClick={() => selectMonth(m)}
              className={cn(
                'h-9 rounded-lg text-sm font-medium transition-all duration-100',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                selected && 'bg-primary text-primary-foreground shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_2px_4px_rgba(0,0,0,0.2)]',
                !selected && current && 'bg-accent/20 text-accent-foreground font-bold ring-1 ring-accent/50',
                !selected && 'hover:bg-accent/15 hover:text-foreground text-foreground',
              )}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* This month shortcut */}
      <div className="mt-3 pt-2.5 border-t border-border">
        <button
          type="button"
          onClick={() => {
            setViewYear(now.getFullYear())
            selectMonth(now.getMonth() + 1)
          }}
          className="w-full text-center text-xs font-medium text-primary hover:text-primary/80 transition-colors py-0.5"
        >
          החודש הנוכחי
        </button>
      </div>
    </>
  ) : (
    <>
      {/* Year range navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setYearBase(b => b - 12)}
          className="p-1.5 rounded-lg hover:bg-accent/15 transition-colors text-muted-foreground hover:text-foreground"
          aria-label="טווח שנים קודם"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <span className="text-xs font-semibold text-muted-foreground select-none tabular-nums">
          {yearBase} — {yearBase + 11}
        </span>

        <button
          type="button"
          onClick={() => setYearBase(b => b + 12)}
          className="p-1.5 rounded-lg hover:bg-accent/15 transition-colors text-muted-foreground hover:text-foreground"
          aria-label="טווח שנים הבא"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* 3 × 4 year grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {yearRange.map(y => {
          const isSelected = y === viewYear
          const isCurrent = y === now.getFullYear()
          return (
            <button
              key={y}
              type="button"
              onClick={() => selectYear(y)}
              className={cn(
                'h-9 rounded-lg text-sm font-medium transition-all duration-100',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                isSelected && 'bg-primary text-primary-foreground shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_2px_4px_rgba(0,0,0,0.2)]',
                !isSelected && isCurrent && 'bg-accent/20 text-accent-foreground font-bold ring-1 ring-accent/50',
                !isSelected && 'hover:bg-accent/15 hover:text-foreground text-foreground',
              )}
            >
              {y}
            </button>
          )
        })}
      </div>

      {/* Back to current year shortcut */}
      <div className="mt-3 pt-2.5 border-t border-border">
        <button
          type="button"
          onClick={() => {
            const thisYear = now.getFullYear()
            setYearBase(Math.floor(thisYear / 12) * 12)
          }}
          className="w-full text-center text-xs font-medium text-primary hover:text-primary/80 transition-colors py-0.5"
        >
          השנה הנוכחית
        </button>
      </div>
    </>
  )

  return (
    <>
      {name && <input type="hidden" name={name} value={hiddenValue} />}
      <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label={placeholder}
            className={cn(
              'flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'field-skeu',
              !value && 'text-muted-foreground',
              className
            )}
          >
            <span>{displayLabel}</span>
            <CalendarRange className="h-4 w-4 opacity-50 shrink-0 mr-1" />
          </button>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={6}
            className={cn(
              'z-50 w-64 rounded-xl border bg-popover p-3 text-popover-foreground',
              'card-skeu',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            )}
            dir="rtl"
          >
            {popoverContent}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </>
  )
}
