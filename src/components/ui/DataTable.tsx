'use client'

import { useState } from 'react'
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
import { Settings2, GripVertical, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'

// ─── Public types ──────────────────────────────────────────────────────────────

export type ColumnDef<T> = {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  sortValue?: (row: T) => string | number | null | undefined
  defaultHidden?: boolean
  className?: string
}

type Props<T> = {
  columns: ColumnDef<T>[]
  data: T[]
  rowKey: (row: T) => string
  emptyMessage?: string
}

type SortState = { key: string; dir: 'asc' | 'desc' } | null

// ─── Sortable row in settings panel ───────────────────────────────────────────

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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50"
    >
      {/* Drag handle — works on both mouse and touch via @dnd-kit */}
      <button
        {...attributes}
        {...listeners}
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none shrink-0"
        aria-label="גרור לשינוי סדר"
      >
        <GripVertical size={14} />
      </button>
      <label className="flex items-center gap-2 cursor-pointer flex-1 text-sm select-none">
        <input
          type="checkbox"
          checked={visible}
          onChange={onToggle}
          className="accent-blue-600"
        />
        {label}
      </label>
    </div>
  )
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ dir }: { dir: 'asc' | 'desc' | null }) {
  if (!dir) return <ArrowUpDown size={12} className="text-gray-300 inline ml-1" />
  if (dir === 'asc') return <ArrowUp size={12} className="text-blue-500 inline ml-1" />
  return <ArrowDown size={12} className="text-blue-500 inline ml-1" />
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyMessage = 'אין נתונים',
}: Props<T>) {
  const [order, setOrder] = useState<string[]>(() => columns.map(c => c.key))
  const [hidden, setHidden] = useState<Set<string>>(
    () => new Set(columns.filter(c => c.defaultHidden).map(c => c.key))
  )
  const [sort, setSort] = useState<SortState>(null)
  const [showSettings, setShowSettings] = useState(false)

  const colMap = Object.fromEntries(columns.map(c => [c.key, c]))
  const visibleKeys = order.filter(k => !hidden.has(k))

  // dnd-kit sensors — PointerSensor covers mouse + touch on most devices;
  // TouchSensor is added explicitly for better mobile support.
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

  // Apply sort
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

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="flex justify-start mb-3">
        <button
          onClick={() => setShowSettings(v => !v)}
          className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50"
        >
          <Settings2 size={13} />
          עמודות
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <>
          {/* Click-away backdrop */}
          <div
            className="fixed inset-0 z-20"
            onClick={() => setShowSettings(false)}
          />
          <div className="absolute top-9 right-0 z-30 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-56">
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
              עמודות
            </p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
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

      {/* Table */}
      <div className="overflow-x-auto">
        {sorted.length === 0 ? (
          <p className="text-center text-gray-400 py-12">{emptyMessage}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-100 text-right">
                {visibleKeys.map(key => {
                  const col = colMap[key]
                  if (!col) return null
                  const canSort = !!col.sortValue
                  const isSorted = sort?.key === key
                  return (
                    <th
                      key={key}
                      onClick={() => handleSortClick(key)}
                      className={[
                        'pb-3 pr-2 font-medium text-right whitespace-nowrap',
                        canSort ? 'cursor-pointer select-none hover:text-gray-800' : '',
                        col.className ?? '',
                      ].join(' ')}
                    >
                      {col.header}
                      {canSort && <SortIcon dir={isSorted ? sort!.dir : null} />}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map(row => (
                <tr key={rowKey(row)} className="hover:bg-gray-50">
                  {visibleKeys.map(key => {
                    const col = colMap[key]
                    if (!col) return null
                    return (
                      <td key={key} className={`py-3 pr-2 ${col.className ?? ''}`}>
                        {col.render
                          ? col.render(row)
                          : String((row as Record<string, unknown>)[key] ?? '')}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
