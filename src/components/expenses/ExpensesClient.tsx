'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import ExpenseSummaryCards from './ExpenseSummaryCards'
import ExpensesTable from './ExpensesTable'
import ExpensesCharts from './ExpensesCharts'
import ExpenseModal from './ExpenseModal'
import CategoryModal from './CategoryModal'
import SendSummaryModal from './SendSummaryModal'

type Category = {
  id: string
  name: string
  is_vat_recognized: boolean
}

type Receipt = {
  id: string
  cloudinary_url: string
  file_type: string | null
}

type Installment = {
  id: string
  installment_number: number
  due_month: string
  amount: number
  vat_amount: number
  expenses: {
    is_personal: boolean
    expense_categories: { name: string; is_vat_recognized: boolean } | null
  } | null
}

type Expense = {
  id: string
  description: string
  category_id: string | null
  total_amount: number
  transaction_date: string
  is_recurring: boolean
  installments_total: number
  is_personal: boolean
  notes: string | null
  expense_categories: { id: string; name: string; is_vat_recognized: boolean } | null
  receipts: Receipt[]
  expense_installments: { id: string; installment_number: number; due_month: string; amount: number; vat_amount: number }[]
}

type Props = {
  categories: Category[]
  expenses: Expense[]
  allInstallments: Installment[]
  vatRate: number
  hasGmailConfig: boolean
}

const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

export default function ExpensesClient({ categories, expenses, allInstallments, vatRate, hasGmailConfig }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [isAnnual, setIsAnnual] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined)

  const filterMonth = `${year}-${String(month).padStart(2, '0')}`

  // Installments for the current month (for summary cards)
  const monthInstallments = allInstallments.filter(i => i.due_month.slice(0, 7) === filterMonth)

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  function openAdd() {
    setEditingExpense(undefined)
    setShowExpenseModal(true)
  }

  function openEdit(expense: Expense) {
    setEditingExpense(expense)
    setShowExpenseModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-foreground">הוצאות</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="text-sm text-muted-foreground border border-border rounded-lg px-3 py-2 hover:bg-muted"
          >
            נהל קטגוריות
          </button>
          <button
            onClick={() => setShowSummaryModal(true)}
            className="text-sm bg-primary text-primary-foreground rounded-lg px-3 py-2 hover:bg-primary/90"
          >
            שלח סיכום חודשי
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <ExpenseSummaryCards installments={monthInstallments} vatRate={vatRate} />

      {/* Filter Bar */}
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

      {/* Charts */}
      <ExpensesCharts
        installments={allInstallments}
        isAnnual={isAnnual}
        year={year}
        month={month}
      />

      {/* Expenses Table */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">רשימת הוצאות</h2>
        <ExpensesTable
          expenses={expenses}
          filterMonth={filterMonth}
          onEdit={openEdit}
        />
      </div>

      {/* FAB */}
      <button
        onClick={openAdd}
        className="fixed bottom-8 left-8 bg-primary text-primary-foreground w-14 h-14 rounded-full shadow-lg text-2xl flex items-center justify-center hover:bg-primary/90 transition-colors z-40"
        title="הוסף הוצאה"
      >
        +
      </button>

      {/* Modals */}
      {showExpenseModal && (
        <ExpenseModal
          categories={categories}
          expense={editingExpense}
          onClose={() => setShowExpenseModal(false)}
          onCategoryModalOpen={() => setShowCategoryModal(true)}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          categories={categories}
          onClose={() => setShowCategoryModal(false)}
        />
      )}

      {showSummaryModal && (
        <SendSummaryModal
          hasGmailConfig={hasGmailConfig}
          onClose={() => setShowSummaryModal(false)}
        />
      )}
    </div>
  )
}
