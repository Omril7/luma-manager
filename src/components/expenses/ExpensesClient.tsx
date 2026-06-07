'use client'

import { useState } from 'react'
import ExpenseSummaryCards from './ExpenseSummaryCards'
import ExpensesTable from './ExpensesTable'
import ExpensesCharts from './ExpensesCharts'
import ExpenseModal from './ExpenseModal'
import CategoryModal from './CategoryModal'

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
}

const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

export default function ExpensesClient({ categories, expenses, allInstallments, vatRate }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [isAnnual, setIsAnnual] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">הוצאות</h1>
        <button
          onClick={() => setShowCategoryModal(true)}
          className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
        >
          נהל קטגוריות
        </button>
      </div>

      {/* Summary Cards */}
      <ExpenseSummaryCards installments={monthInstallments} vatRate={vatRate} />

      {/* Filter Bar */}
      <div className="flex items-center gap-4 flex-wrap">
        {!isAnnual && (
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <button onClick={prevMonth} className="text-gray-400 hover:text-gray-700 text-lg leading-none">→</button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button onClick={nextMonth} className="text-gray-400 hover:text-gray-700 text-lg leading-none">←</button>
          </div>
        )}
        <button
          onClick={() => setIsAnnual(v => !v)}
          className={`text-sm px-4 py-2 rounded-lg border transition-colors ${isAnnual ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
        >
          דוח שנתי
        </button>
        {isAnnual && (
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <button onClick={() => setYear(y => y - 1)} className="text-gray-400 hover:text-gray-700 text-lg leading-none">→</button>
            <span className="text-sm font-medium w-16 text-center">{year}</span>
            <button onClick={() => setYear(y => y + 1)} className="text-gray-400 hover:text-gray-700 text-lg leading-none">←</button>
          </div>
        )}
      </div>

      {/* Charts */}
      <ExpensesCharts
        installments={allInstallments}
        isAnnual={isAnnual}
        year={year}
        month={month}
      />

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">רשימת הוצאות</h2>
        <ExpensesTable
          expenses={expenses}
          filterMonth={filterMonth}
          onEdit={openEdit}
        />
      </div>

      {/* FAB */}
      <button
        onClick={openAdd}
        className="fixed bottom-8 left-8 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg text-2xl flex items-center justify-center hover:bg-blue-700 transition-colors z-40"
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
    </div>
  )
}
