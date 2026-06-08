'use client'

import { useTransition } from 'react'
import { deleteExpense } from '@/app/(dashboard)/expenses/actions'
import { toast } from 'sonner'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { FileText, Image } from 'lucide-react'

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
}

type Props = {
  expenses: Expense[]
  filterMonth: string
  onEdit: (expense: Expense) => void
}

function fmt(n: number) {
  return n.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 })
}

// Flattened row for the table
type Row = Expense & {
  _installmentNum: number
  _installmentAmt: number
  _vatAmt: number
}

export default function ExpensesTable({ expenses, filterMonth, onEdit }: Props) {
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
        _installmentNum: inst.installment_number,
        _installmentAmt: inst.amount,
        _vatAmt: inst.vat_amount,
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
      sortValue: r => r.expense_categories?.name ?? '',
      cell: r => <span className="text-muted-foreground">{r.expense_categories?.name ?? '—'}</span>,
    },
    {
      key: '_installmentAmt',
      header: 'סכום',
      sortValue: r => r._installmentAmt,
      cell: r => <span className="font-medium">{fmt(r._installmentAmt)}</span>,
    },
    {
      key: '_vatAmt',
      header: 'מע"מ',
      sortValue: r => r._vatAmt,
      cell: r => <span className="text-muted-foreground">{r._vatAmt > 0 ? fmt(r._vatAmt) : '—'}</span>,
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
      cell: r =>
        r.receipts.length > 0 ? (
          <div className="flex gap-1">
            {r.receipts.map(rec => (
              <a key={rec.id} href={rec.cloudinary_url} target="_blank" rel="noreferrer" title="פתח קבלה" className="text-muted-foreground hover:text-foreground transition-colors">
                {rec.file_type === 'pdf' ? <FileText size={16} /> : <Image size={16} />}
              </a>
            ))}
          </div>
        ) : <span className="text-muted-foreground/50">—</span>,
    },
    {
      key: 'actions',
      header: 'פעולות',
      cell: r => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(r)} className="h-7 px-2 text-xs text-muted-foreground hover:text-primary">ערוך</Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} disabled={isPending} className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive">מחק</Button>
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
