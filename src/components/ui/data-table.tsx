'use client'

import * as React from 'react'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Settings2, GripVertical, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { Button } from './button'

export interface DataTableColumn<T> {
  key: string
  header: string
  headerClassName?: string
  className?: string
  cell: (row: T) => React.ReactNode
  sortValue?: (row: T) => string | number | null | undefined
  defaultHidden?: boolean
}

export interface DataTablePagination {
  /** 0-indexed current page */
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  rowKey: (row: T) => string
  rowClassName?: (row: T) => string
  emptyMessage?: string
  pagination?: DataTablePagination
  /** Optional <tr> element rendered inside <tfoot> (e.g. totals row) */
  footerRow?: React.ReactNode
  /** Show column visibility / reorder / sort panel */
  showColumnFilter?: boolean
}

type SortState = { key: string; dir: 'asc' | 'desc' } | null

function SortableColumnRow({
  id,
  label,
  visible,
  onToggle,
}: {
  id: string
  label: string
  visible: boolean
  onToggle: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing touch-none shrink-0"
        aria-label="גרור לשינוי סדר"
      >
        <GripVertical size={14} />
      </button>
      <label className="flex items-center gap-2 cursor-pointer flex-1 text-sm select-none">
        <input type="checkbox" checked={visible} onChange={onToggle} className="accent-primary" />
        {label}
      </label>
    </div>
  )
}

function SortIcon({ dir }: { dir: 'asc' | 'desc' | null }) {
  if (!dir) return <ArrowUpDown size={12} className="text-muted-foreground/40 inline ml-1" />
  if (dir === 'asc') return <ArrowUp size={12} className="text-primary inline ml-1" />
  return <ArrowDown size={12} className="text-primary inline ml-1" />
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  rowClassName,
  emptyMessage = 'אין נתונים להצגה',
  pagination,
  footerRow,
  showColumnFilter = false,
}: DataTableProps<T>) {
  const [order, setOrder] = useState<string[]>(() => columns.map(c => c.key))
  const [hidden, setHidden] = useState<Set<string>>(
    () => new Set(columns.filter(c => c.defaultHidden).map(c => c.key))
  )
  const [sort, setSort] = useState<SortState>(null)
  const [showSettings, setShowSettings] = useState(false)

  const colMap = Object.fromEntries(columns.map(c => [c.key, c]))
  const visibleKeys = order.filter(k => !hidden.has(k))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setOrder(prev => {
      const from = prev.indexOf(String(active.id))
      const to = prev.indexOf(String(over.id))
      return arrayMove(prev, from, to)
    })
  }

  function toggleHidden(key: string) {
    setHidden(prev => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key) } else { next.add(key) }
      return next
    })
  }

  function handleSortClick(key: string) {
    if (!colMap[key]?.sortValue) return
    setSort(prev => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return null
    })
  }

  const sorted = sort
    ? [...data].sort((a, b) => {
        const col = colMap[sort.key]
        const va = col?.sortValue?.(a) ?? ''
        const vb = col?.sortValue?.(b) ?? ''
        const cmp =
          typeof va === 'number' && typeof vb === 'number'
            ? va - vb
            : String(va).localeCompare(String(vb), 'he')
        return sort.dir === 'asc' ? cmp : -cmp
      })
    : data

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1
  const pageData = pagination
    ? sorted.slice(pagination.page * pagination.pageSize, (pagination.page + 1) * pagination.pageSize)
    : sorted

  return (
    <div className="space-y-3">
      {showColumnFilter && (
        <div className="relative flex justify-start">
          <button
            onClick={() => setShowSettings(v => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-lg px-2.5 py-1.5 hover:bg-muted"
          >
            <Settings2 size={13} />
            עמודות
          </button>

          {showSettings && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowSettings(false)} />
              <div className="absolute top-9 right-0 z-30 bg-card border border-border rounded-xl shadow-lg p-4 w-56">
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                  עמודות
                </p>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={order} strategy={verticalListSortingStrategy}>
                    <div className="space-y-0.5">
                      {order.map(key => {
                        const col = colMap[key]
                        if (!col) return null
                        return (
                          <SortableColumnRow
                            key={key}
                            id={key}
                            label={col.header}
                            visible={!hidden.has(key)}
                            onToggle={() => toggleHidden(key)}
                          />
                        )
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-right border-b border-border">
              {(showColumnFilter ? visibleKeys : columns.map(c => c.key)).map(key => {
                const col = colMap[key]
                if (!col) return null
                const canSort = showColumnFilter && !!col.sortValue
                const isSorted = sort?.key === key
                return (
                  <th
                    key={key}
                    onClick={canSort ? () => handleSortClick(key) : undefined}
                    className={cn(
                      'pb-2.5 font-medium text-muted-foreground text-right',
                      canSort && 'cursor-pointer select-none hover:text-foreground',
                      col.headerClassName
                    )}
                  >
                    {col.header}
                    {canSort && <SortIcon dir={isSorted ? sort!.dir : null} />}
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={showColumnFilter ? visibleKeys.length : columns.length}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageData.map(row => (
                <tr
                  key={rowKey(row)}
                  className={cn(
                    'border-b border-border last:border-0 transition-colors hover:bg-muted/30',
                    rowClassName?.(row)
                  )}
                >
                  {(showColumnFilter ? visibleKeys : columns.map(c => c.key)).map(key => {
                    const col = colMap[key]
                    if (!col) return null
                    return (
                      <td key={key} className={cn('py-2.5', col.className)}>
                        {col.cell(row)}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>

          {footerRow && (
            <tfoot>
              {footerRow}
            </tfoot>
          )}
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground tabular-nums">
            עמוד {pagination.page + 1} מתוך {totalPages}
            <span className="text-muted-foreground/60 mr-1">({pagination.total} שורות)</span>
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 0}
              className="h-7 w-7 p-0"
              aria-label="עמוד קודם"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages - 1}
              className="h-7 w-7 p-0"
              aria-label="עמוד הבא"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
