'use client'

import { useTransition } from 'react'
import { deleteIncome } from '@/app/(dashboard)/income/actions'
import { toast } from 'sonner'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'

type IncomeRow = {
  id: string
  product_name: string
  product_id: string | null
  order_id: string | null
  original_price: number
  discount_amount: number
  final_price: number
  delivery_amount: number
  income_date: string
  notes: string | null
  source: string
}

type Props = {
  rows: IncomeRow[]
  filterMonth: string
  onEdit: (row: IncomeRow) => void
}

function fmt(n: number) {
  return n.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 })
}

export default function IncomeTable({ rows, filterMonth, onEdit }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!confirm('למחוק הכנסה זו?')) return
    startTransition(async () => {
      const res = await deleteIncome(id)
      if (res && 'error' in res && res.error) toast.error(res.error)
      else toast.success('הכנסה נמחקה')
    })
  }

  const filtered = rows.filter(r => r.income_date.slice(0, 7) === filterMonth)

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
      cell: r => <span className="font-medium">{r.product_name}</span>,
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
      cell: r => fmt(r.original_price),
    },
    {
      key: 'discount_amount',
      header: 'הנחה',
      sortValue: r => r.discount_amount,
      cell: r => <span className="text-orange-600">{r.discount_amount > 0 ? fmt(r.discount_amount) : '—'}</span>,
    },
    {
      key: 'final_price',
      header: 'מחיר סופי',
      sortValue: r => r.final_price,
      cell: r => <span className="font-medium text-green-700">{fmt(r.final_price)}</span>,
    },
    {
      key: 'delivery_amount',
      header: 'משלוח',
      sortValue: r => r.delivery_amount,
      cell: r => r.delivery_amount > 0
        ? <span className="text-blue-600 dark:text-blue-400">{fmt(r.delivery_amount)}</span>
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
          <Button variant="ghost" size="sm" onClick={() => onEdit(r)} className="h-7 px-2 text-xs text-muted-foreground hover:text-primary">ערוך</Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} disabled={isPending} className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive">מחק</Button>
        </div>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={filtered}
      rowKey={r => r.id}
      emptyMessage="אין הכנסות לחודש זה"
    />
  )
}
