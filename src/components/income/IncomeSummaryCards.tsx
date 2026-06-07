type IncomeRow = {
  final_price: number
  discount_amount: number
}

type Props = {
  rows: IncomeRow[]
}

function fmt(n: number) {
  return n.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })
}

export default function IncomeSummaryCards({ rows }: Props) {
  const total = rows.reduce((s, r) => s + r.final_price, 0)
  const totalDiscounts = rows.reduce((s, r) => s + r.discount_amount, 0)
  const count = rows.length
  const net = total

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm text-gray-500 mb-1">סה&quot;כ הכנסות</p>
        <p className="text-2xl font-bold text-gray-900">{fmt(total)}</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm text-gray-500 mb-1">מספר הזמנות</p>
        <p className="text-2xl font-bold text-gray-900">{count}</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm text-gray-500 mb-1">סה&quot;כ הנחות</p>
        <p className="text-2xl font-bold text-orange-500">{fmt(totalDiscounts)}</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm text-gray-500 mb-1">הכנסה נטו</p>
        <p className="text-2xl font-bold text-green-600">{fmt(net)}</p>
      </div>
    </div>
  )
}
