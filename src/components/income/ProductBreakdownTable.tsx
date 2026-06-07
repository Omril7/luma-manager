type IncomeRow = {
  product_name: string
  final_price: number
  discount_amount: number
}

type Props = {
  rows: IncomeRow[]
}

function fmt(n: number) {
  return n.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 })
}

export default function ProductBreakdownTable({ rows }: Props) {
  const byProduct = rows.reduce<Record<string, { units: number; revenue: number; discountLoss: number }>>((acc, r) => {
    if (!acc[r.product_name]) acc[r.product_name] = { units: 0, revenue: 0, discountLoss: 0 }
    acc[r.product_name].units += 1
    acc[r.product_name].revenue += r.final_price
    acc[r.product_name].discountLoss += r.discount_amount
    return acc
  }, {})

  const entries = Object.entries(byProduct).sort((a, b) => b[1].revenue - a[1].revenue)

  if (entries.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-medium text-gray-700 mb-4">פירוט לפי מוצר</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 border-b border-gray-100 text-right">
              <th className="pb-3 pr-2 font-medium">מוצר</th>
              <th className="pb-3 pr-2 font-medium">יחידות</th>
              <th className="pb-3 pr-2 font-medium">סה&quot;כ הכנסה</th>
              <th className="pb-3 font-medium">אובדן הנחות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {entries.map(([name, stats]) => (
              <tr key={name} className="hover:bg-gray-50">
                <td className="py-3 pr-2 font-medium">{name}</td>
                <td className="py-3 pr-2 text-gray-600">{stats.units}</td>
                <td className="py-3 pr-2 text-green-700 font-medium">{fmt(stats.revenue)}</td>
                <td className="py-3 text-orange-600">{stats.discountLoss > 0 ? fmt(stats.discountLoss) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
