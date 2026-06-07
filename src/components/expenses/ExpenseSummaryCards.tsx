type Props = {
  installments: {
    amount: number
    vat_amount: number
    expenses: { is_personal: boolean; expense_categories: { is_vat_recognized: boolean } | null } | null
  }[]
  vatRate: number
}

export default function ExpenseSummaryCards({ installments }: Props) {
  const business = installments.filter(i => !i.expenses?.is_personal)
  const total = business.reduce((s, i) => s + i.amount, 0)
  const vatOnly = business.reduce((s, i) => s + i.vat_amount, 0)
  const netOfVat = total - vatOnly

  function fmt(n: number) {
    return n.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-card rounded-xl border border-border p-5">
        <p className="text-sm text-muted-foreground mb-1">סה&quot;כ הוצאות</p>
        <p className="text-2xl font-bold text-foreground">{fmt(total)}</p>
      </div>
      <div className="bg-card rounded-xl border border-border p-5">
        <p className="text-sm text-muted-foreground mb-1">ללא מע&quot;מ</p>
        <p className="text-2xl font-bold text-foreground">{fmt(netOfVat)}</p>
      </div>
      <div className="bg-card rounded-xl border border-border p-5">
        <p className="text-sm text-muted-foreground mb-1">מע&quot;מ בלבד</p>
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{fmt(vatOnly)}</p>
      </div>
    </div>
  )
}
