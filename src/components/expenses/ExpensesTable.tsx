'use client'

import { useTransition } from 'react'
import { deleteExpense } from '@/app/(dashboard)/expenses/actions'
import { toast } from 'sonner'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { formatILS } from '@/lib/utils'
import { FileText, Image as ImageIcon, Archive } from 'lucide-react'

type Receipt = {
  id: string
  cloudinary_url: string | null
  file_type: string | null
  cleaned_up_at: string | null
  installment_id: string | null
}

type Installment = {
  id: string
  installment_number: number
  due_month: string
  amount: number
  vat_amount: number
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
  expense_installments: Installment[]
  expense_category_splits: { id: string; category_id: string | null; amount: number; expense_categories: { name: string; is_vat_recognized: boolean } | null }[]
}

type InstallmentEditTarget = {
  installmentId: string
  installmentNumber: number
  dueMonth: string
  amount: number
  expenseDescription: string
  receipts: Receipt[]
}

type Props = {
  expenses: Expense[]
  filterMonth: string
  isMonthClosed: boolean
  onEdit: (expense: Expense) => void
  onEditInstallment: (target: InstallmentEditTarget) => void
}

// Flattened row for the table
type Row = Expense & {
  _installmentId: string
  _installmentNum: number
  _installmentAmt: number
  _vatAmt: number
  _dueMonth: string
}

export default function ExpensesTable({ expenses, filterMonth, isMonthClosed, onEdit, onEditInstallment }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!confirm('למחוק הוצאה זו?')) return
    startTransition(async () => {
      const res = await deleteExpense(id)
      if (res && 'error' in res && res.error) toast.error(res.error)
      else toast.success('הוצאה נמחקה')
    })
  }

  const rows: Row[] = expenses
    .map(exp => {
      const inst = exp.expense_installments.find(i => i.due_month.slice(0, 7) === filterMonth)
      if (!inst) return null
      return {
        ...exp,
        _installmentId: inst.id,
        _installmentNum: inst.installment_number,
        _installmentAmt: inst.amount,
        _vatAmt: inst.vat_amount,
        _dueMonth: inst.due_month,
      }
    })
    .filter((r): r is Row => r !== null)

  const columns: DataTableColumn<Row>[] = [
    {
      key: 'transaction_date',
      header: 'תאריך',
      sortValue: r => r.transaction_date,
      cell: r => <span className="text-muted-foreground">{new Date(r.transaction_date).toLocaleDateString('he-IL')}</span>,
    },
    {
      key: 'description',
      header: 'תיאור',
      sortValue: r => r.description,
      cell: r => (
        <span className="font-medium">
          {r.description}
          {r.is_recurring && (
            <span className="mr-1 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">קבוע</span>
          )}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'קטגוריה',
      sortValue: r => r.expense_category_splits.length > 0 ? '__split__' : (r.expense_categories?.name ?? ''),
      cell: r => {
        if (r.expense_category_splits.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {r.expense_category_splits.map(s => (
                <span key={s.id} className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded">
                  {s.expense_categories?.name ?? 'ללא קטגוריה'}
                </span>
              ))}
            </div>
          )
        }
        return <span className="text-muted-foreground">{r.expense_categories?.name ?? '—'}</span>
      },
    },
    {
      key: '_installmentAmt',
      header: 'סכום',
      sortValue: r => r._installmentAmt,
      cell: r => <span className="font-medium">{formatILS(r._installmentAmt, 2)}</span>,
    },
    {
      key: '_vatAmt',
      header: 'מע"מ',
      sortValue: r => r._vatAmt,
      cell: r => <span className="text-muted-foreground">{r._vatAmt > 0 ? formatILS(r._vatAmt, 2) : '—'}</span>,
    },
    {
      key: 'installments',
      header: 'תשלומים',
      cell: r =>
        r.installments_total > 1
          ? <span className="text-muted-foreground whitespace-nowrap">{r._installmentNum} מתוך {r.installments_total}</span>
          : <span className="text-muted-foreground/50">—</span>,
    },
    {
      key: 'is_personal',
      header: 'סוג',
      sortValue: r => r.is_personal ? 1 : 0,
      cell: r => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.is_personal ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
          {r.is_personal ? 'אישי' : 'עסקי'}
        </span>
      ),
    },
    {
      key: 'receipts',
      header: 'קבלה',
      cell: r => {
        // Recurring: show only receipts for this specific installment
        // Non-recurring: show receipts not linked to any installment (belong to the whole expense)
        const visibleReceipts = r.is_recurring && r._installmentNum > 1
          ? r.receipts.filter(rec => rec.installment_id === r._installmentId)
          : r._installmentNum === 1
            ? r.receipts.filter(rec => rec.installment_id === null)
            : []
        return visibleReceipts.length > 0 ? (
          <div className="flex gap-1">
            {visibleReceipts.map(rec =>
              rec.cleaned_up_at ? (
                <span key={rec.id} title="קובץ בארכיון" className="text-muted-foreground/40">
                  <Archive size={16} />
                </span>
              ) : (
                <a key={rec.id} href={rec.cloudinary_url ?? '#'} target="_blank" rel="noreferrer" title="פתח קבלה" className="text-muted-foreground hover:text-foreground transition-colors">
                  {rec.file_type === 'pdf' ? <FileText size={16} /> : <ImageIcon size={16} />}
                </a>
              )
            )}
          </div>
        ) : <span className="text-muted-foreground/50">—</span>
      },
    },
    {
      key: 'actions',
      header: 'פעולות',
      cell: r => (
        <div className="flex gap-1">
          {!isMonthClosed && (r.is_recurring && r._installmentNum > 1 ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditInstallment({
                  installmentId: r._installmentId,
                  installmentNumber: r._installmentNum,
                  dueMonth: r._dueMonth,
                  amount: r._installmentAmt,
                  expenseDescription: r.description,
                  receipts: r.receipts.filter(rec => rec.installment_id === r._installmentId),
                })}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
              >
                ערוך חודש
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onEdit(r)} className="h-7 px-2 text-xs text-muted-foreground hover:text-primary">ערוך תבנית</Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => onEdit(r)} className="h-7 px-2 text-xs text-muted-foreground hover:text-primary">ערוך</Button>
          ))}
          {!isMonthClosed && (
            <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} disabled={isPending} className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive">מחק</Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={rows}
      rowKey={r => r.id}
      emptyMessage="אין הוצאות לחודש זה"
    />
  )
}
