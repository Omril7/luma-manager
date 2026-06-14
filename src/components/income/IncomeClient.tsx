'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import IncomeSummaryCards from './IncomeSummaryCards'
import IncomeCharts from './IncomeCharts'
import ProductBreakdownTable from './ProductBreakdownTable'
import IncomeTable from './IncomeTable'
import IncomeModal from './IncomeModal'
import ProductsModal from './ProductsModal'

type Product = {
  id: string
  name: string
  description: string | null
}

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
  products: Product[]
  incomeRows: IncomeRow[]
  closedMonths: string[]
}

const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

export default function IncomeClient({ products, incomeRows, closedMonths }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [isAnnual, setIsAnnual] = useState(false)
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [showProductsModal, setShowProductsModal] = useState(false)
  const [editingIncome, setEditingIncome] = useState<IncomeRow | undefined>(undefined)

  const filterMonth = `${year}-${String(month).padStart(2, '0')}`
  const isMonthClosed = closedMonths.includes(filterMonth)
  const monthRows = incomeRows.filter(r => r.income_date.slice(0, 7) === filterMonth)
  const annualRows = incomeRows.filter(r => r.income_date.slice(0, 4) === String(year))

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  function openEdit(row: IncomeRow) {
    setEditingIncome(row)
    setShowIncomeModal(true)
  }

  function openAdd() {
    setEditingIncome(undefined)
    setShowIncomeModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-foreground">הכנסות</h1>
        <button
          onClick={() => setShowProductsModal(true)}
          className="text-sm text-muted-foreground border border-border rounded-lg px-3 py-2 hover:bg-muted"
        >
          ניהול מוצרים
        </button>
      </div>

      {/* Summary cards (always monthly) */}
      <IncomeSummaryCards rows={monthRows} />

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Period toggle — segmented control */}
        <div className="inline-flex items-center bg-muted border border-border rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => setIsAnnual(false)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              !isAnnual
                ? 'bg-card shadow-[0_1px_3px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.6)] text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >חודשי</button>
          <button
            onClick={() => setIsAnnual(true)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              isAnnual
                ? 'bg-card shadow-[0_1px_3px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.6)] text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >שנתי</button>
        </div>

        {/* Period navigator */}
        <div className="flex items-center gap-0.5 bg-card border border-border rounded-lg p-0.5">
          <button
            onClick={isAnnual ? () => setYear(y => y - 1) : prevMonth}
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="הקודם"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium px-3 min-w-[120px] text-center select-none tabular-nums">
            {isAnnual ? year : `${MONTH_NAMES[month - 1]} ${year}`}
          </span>
          <button
            onClick={isAnnual ? () => setYear(y => y + 1) : nextMonth}
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="הבא"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Closed month banner */}
      {isMonthClosed && !isAnnual && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <Lock className="h-4 w-4 shrink-0" />
          <span>חודש זה סגור — לא ניתן להוסיף הכנסות. לפתיחה מחדש יש לגשת לדף <Link href="/dashboard" className="font-semibold underline underline-offset-2 hover:opacity-80">תזרים מזומנים</Link>.</span>
        </div>
      )}

      {/* Charts */}
      <IncomeCharts
        rows={incomeRows}
        isAnnual={isAnnual}
        year={year}
        month={month}
      />

      {/* Product breakdown */}
      <ProductBreakdownTable rows={isAnnual ? annualRows : monthRows} />

      {/* Table */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">רשימת הכנסות</h2>
        <IncomeTable
          rows={incomeRows}
          filterMonth={filterMonth}
          isMonthClosed={isMonthClosed}
          onEdit={openEdit}
        />
      </div>

      {/* FAB — hidden when the viewed month is closed */}
      {!isMonthClosed && (
        <button
          onClick={openAdd}
          className="fixed bottom-8 left-8 bg-green-600 text-white w-14 h-14 rounded-full shadow-lg text-2xl flex items-center justify-center hover:bg-green-700 transition-colors z-40"
          title="הוסף הכנסה"
        >
          +
        </button>
      )}

      {/* Modals */}
      {showIncomeModal && (
        <IncomeModal
          products={products}
          income={editingIncome}
          closedMonths={closedMonths}
          onClose={() => setShowIncomeModal(false)}
        />
      )}

      {showProductsModal && (
        <ProductsModal
          products={products}
          onClose={() => setShowProductsModal(false)}
        />
      )}
    </div>
  )
}
