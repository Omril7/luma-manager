type Props = {
  installments: {
    amount: number
    vat_amount: number
    expenses: {
      is_personal: boolean
      expense_categories: { is_vat_recognized: boolean } | null
    } | null
  }[]
  vatRate: number
}

export default function ExpenseSummaryCards({ installments }: Props) {
  const business = installments.filter(i => !i.expenses?.is_personal)

  const total = business.reduce((sum, i) => sum + i.amount, 0)
  const vatOnly = business.reduce((sum, i) => sum + i.vat_amount, 0)
  const netOfVat = total - vatOnly

  function fmt(n: number) {
    return n.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm text-gray-500 mb-1">סה&quot;כ הוצאות</p>
        <p className="text-2xl font-bold text-gray-900">{fmt(total)}</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm text-gray-500 mb-1">ללא מע&quot;מ</p>
        <p className="text-2xl font-bold text-gray-900">{fmt(netOfVat)}</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm text-gray-500 mb-1">מע&quot;מ בלבד</p>
        <p className="text-2xl font-bold text-blue-600">{fmt(vatOnly)}</p>
      </div>
    </div>
  )
}
