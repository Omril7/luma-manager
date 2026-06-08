import { DataTable, type DataTableColumn } from '@/components/ui/data-table'

type IncomeRow = {
  product_name: string
  final_price: number
  discount_amount: number
  delivery_amount: number
}

type ProductStat = {
  name: string
  units: number
  revenue: number
  discountLoss: number
}

type Props = {
  rows: IncomeRow[]
}

function fmt(n: number) {
  return n.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 })
}

const columns: DataTableColumn<ProductStat>[] = [
  {
    key: 'name',
    header: 'מוצר',
    sortValue: r => r.name,
    cell: r => <span className="font-medium">{r.name}</span>,
  },
  {
    key: 'units',
    header: 'יחידות',
    sortValue: r => r.units,
    cell: r => <span className="text-gray-600">{r.units}</span>,
  },
  {
    key: 'revenue',
    header: 'סה"כ הכנסה',
    sortValue: r => r.revenue,
    cell: r => <span className="text-green-700 font-medium">{fmt(r.revenue)}</span>,
  },
  {
    key: 'discountLoss',
    header: 'אובדן הנחות',
    sortValue: r => r.discountLoss,
    cell: r => <span className="text-orange-600">{r.discountLoss > 0 ? fmt(r.discountLoss) : '—'}</span>,
  },
]

export default function ProductBreakdownTable({ rows }: Props) {
  const byProduct = rows.reduce<Record<string, ProductStat>>((acc, r) => {
    if (!acc[r.product_name]) acc[r.product_name] = { name: r.product_name, units: 0, revenue: 0, discountLoss: 0 }
    acc[r.product_name].units += 1
    acc[r.product_name].revenue += r.final_price - r.delivery_amount
    acc[r.product_name].discountLoss += r.discount_amount
    return acc
  }, {})

  const data = Object.values(byProduct).sort((a, b) => b.revenue - a.revenue)
  if (data.length === 0) return null

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">פירוט לפי מוצר</h3>
      <DataTable
        columns={columns}
        data={data}
        rowKey={r => r.name}
        emptyMessage="אין נתונים"
      />
    </div>
  )
}
