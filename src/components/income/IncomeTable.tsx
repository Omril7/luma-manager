'use client'

import { useState, useTransition } from 'react'
import { deleteIncome } from '@/app/(dashboard)/income/actions'
import { toast } from 'sonner'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { formatILS } from '@/lib/utils'

type IncomeRow = {
  id: string
  product_name: string
  product_id: string | null
  order_id: string | null
  original_price: number
  discount_amount: number
  final_price: number
  delivery_amount: number
  is_advance: boolean
  work_hours: number
  income_date: string
  notes: string | null
  source: string
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

type Props = {
  rows: IncomeRow[]
  filterPeriod: string // 'YYYY' (annual) or 'YYYY-MM'
  closedMonths: string[]
  onEdit: (row: IncomeRow) => void
}

export default function IncomeTable({ rows, filterPeriod, closedMonths, onEdit }: Props) {
  const [isPending, startTransition] = useTransition()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [prevPeriod, setPrevPeriod] = useState(filterPeriod)
  if (prevPeriod !== filterPeriod) {
    setPrevPeriod(filterPeriod)
    setPage(0)
  }

  function handleDelete(id: string) {
    if (!confirm('למחוק הכנסה זו?')) return
    startTransition(async () => {
      const res = await deleteIncome(id)
      if (res && 'error' in res && res.error) toast.error(res.error)
      else toast.success('הכנסה נמחקה')
    })
  }

  const filtered = rows.filter(r => r.income_date.startsWith(filterPeriod))

  const columns: DataTableColumn<IncomeRow>[] = [
    {
      key: 'income_date',
      header: 'תאריך',
      sortValue: r => r.income_date,
      cell: r => <span className="text-muted-foreground">{new Date(r.income_date).toLocaleDateString('he-IL')}</span>,
    },
    {
      key: 'product_name',
      header: 'מוצר',
      sortValue: r => r.product_name,
      cell: r => (
        <span className="font-medium">
          {r.product_name}
          {r.is_advance && <span className="ms-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-normal">מקדמה</span>}
        </span>
      ),
    },
    {
      key: 'order_id',
      header: 'מספר הזמנה',
      cell: r => <span className="text-muted-foreground text-xs">{r.order_id ?? '—'}</span>,
      defaultHidden: true,
    },
    {
      key: 'original_price',
      header: 'מחיר מקורי',
      sortValue: r => r.original_price,
      cell: r => formatILS(r.original_price, 2),
    },
    {
      key: 'discount_amount',
      header: 'הנחה',
      sortValue: r => r.discount_amount,
      cell: r => <span className="text-orange-600">{r.discount_amount > 0 ? formatILS(r.discount_amount, 2) : '—'}</span>,
    },
    {
      key: 'final_price',
      header: 'מחיר סופי',
      sortValue: r => r.final_price,
      cell: r => <span className="font-medium text-green-700">{formatILS(r.final_price, 2)}</span>,
    },
    {
      key: 'work_hours',
      header: 'שעות עבודה',
      sortValue: r => r.work_hours,
      cell: r => r.work_hours > 0
        ? <span className="tabular-nums">{r.work_hours}ש׳</span>
        : <span className="text-muted-foreground/50">—</span>,
    },
    {
      key: 'delivery_amount',
      header: 'משלוח',
      sortValue: r => r.delivery_amount,
      cell: r => r.delivery_amount > 0
        ? <span className="text-blue-600 dark:text-blue-400">{formatILS(r.delivery_amount, 2)}</span>
        : <span className="text-muted-foreground/50">—</span>,
    },
    {
      key: 'source',
      header: 'מקור',
      sortValue: r => r.source,
      cell: r => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${r.source === 'store' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-muted text-muted-foreground'}`}>
          {r.source === 'store' ? 'חנות' : 'ידני'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'פעולות',
      cell: r => (
        <div className="flex gap-1">
          {!closedMonths.includes(r.income_date.slice(0, 7)) && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(r)} className="h-7 px-2 text-xs text-muted-foreground hover:text-primary">ערוך</Button>
          )}
          {!closedMonths.includes(r.income_date.slice(0, 7)) && (
            <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} disabled={isPending} className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive">מחק</Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={filtered}
      rowKey={r => r.id}
      pagination={{ page, pageSize, total: filtered.length, onPageChange: setPage, pageSizeOptions: PAGE_SIZE_OPTIONS, onPageSizeChange: n => { setPageSize(n); setPage(0) } }}
      emptyMessage="אין הכנסות בתקופה זו"
    />
  )
}
