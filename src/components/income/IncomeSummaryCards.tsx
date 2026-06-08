type IncomeRow = { final_price: number; discount_amount: number; delivery_amount: number }
type Props = { rows: IncomeRow[] }

function fmt(n: number) {
  return n.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })
}

export default function IncomeSummaryCards({ rows }: Props) {
  const total = rows.reduce((s, r) => s + r.final_price, 0)
  const productIncome = rows.reduce((s, r) => s + (r.final_price - r.delivery_amount), 0)
  const deliveryIncome = rows.reduce((s, r) => s + r.delivery_amount, 0)
  const totalDiscounts = rows.reduce((s, r) => s + r.discount_amount, 0)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-card rounded-xl border border-border p-5">
        <p className="text-sm text-muted-foreground mb-1">סה&quot;כ הכנסות</p>
        <p className="text-2xl font-bold text-foreground">{fmt(total)}</p>
      </div>
      <div className="bg-card rounded-xl border border-border p-5">
        <p className="text-sm text-muted-foreground mb-1">הכנסות מוצרים</p>
        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{fmt(productIncome)}</p>
      </div>
      <div className="bg-card rounded-xl border border-border p-5">
        <p className="text-sm text-muted-foreground mb-1">הכנסות משלוחים</p>
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{fmt(deliveryIncome)}</p>
      </div>
      <div className="bg-card rounded-xl border border-border p-5">
        <p className="text-sm text-muted-foreground mb-1">סה&quot;כ הנחות</p>
        <p className="text-2xl font-bold text-orange-500 dark:text-orange-400">{fmt(totalDiscounts)}</p>
      </div>
    </div>
  )
}
