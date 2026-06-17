'use client'

import { useState, useTransition, useEffect } from 'react'
import { deletePricing } from '@/app/(dashboard)/pricing/actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable, type DataTableColumn, type DataTablePagination } from '@/components/ui/data-table'
import { Plus, Trash2, Search, X } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

interface PricingRow {
  id: string
  name: string
  hourly_rate: number
  time_hours: number
  overhead_per_hour: number
  profit_type: string
  profit_value: number
  suggested_price: number | null
  created_at: string
  pricing_parts: { id: string; name: string; price: number }[]
}

interface Props {
  pricings: PricingRow[]
  onNewPricing: () => void
}

const PAGE_SIZE = 10

function ils(n: number) {
  return n.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('he-IL')
}

export default function PricingHistoryPanel({ pricings, onNewPricing }: Props) {
  const [detailId, setDetailId]      = useState<string | null>(null)
  const [search, setSearch]          = useState('')
  const [page, setPage]              = useState(0)
  const [isPending, startTransition] = useTransition()

  useEffect(() => { setPage(0) }, [search])

  const filtered = pricings.filter(p => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return p.name.toLowerCase().includes(q) || formatDate(p.created_at).includes(q)
  })

  const pagination: DataTablePagination = {
    page,
    pageSize: PAGE_SIZE,
    total: filtered.length,
    onPageChange: setPage,
  }

  const detailPricing = pricings.find(p => p.id === detailId)

  function handleDelete(id: string) {
    if (!confirm('למחוק תמחור זה?')) return
    startTransition(async () => {
      const res = await deletePricing(id)
      if (res && 'error' in res && res.error) toast.error(res.error)
      else toast.success('תמחור נמחק')
    })
  }

  const columns: DataTableColumn<PricingRow>[] = [
    {
      key: 'name',
      header: 'שם',
      sortValue: p => p.name,
      cell: p => (
        <button className="font-medium text-right hover:text-primary transition-colors" onClick={() => setDetailId(p.id)}>
          {p.name}
        </button>
      ),
    },
    {
      key: 'date',
      header: 'תאריך',
      className: 'text-muted-foreground tabular-nums',
      sortValue: p => p.created_at,
      cell: p => formatDate(p.created_at),
    },
    {
      key: 'price',
      header: 'מחיר מומלץ',
      className: 'font-semibold text-green-700 tabular-nums',
      sortValue: p => p.suggested_price ?? 0,
      cell: p => p.suggested_price != null ? ils(p.suggested_price) : '—',
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-10',
      mobileHidden: true,
      cell: p => (
        <Button
          variant="ghost" size="sm"
          onClick={e => { e.stopPropagation(); handleDelete(p.id) }}
          disabled={isPending}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">תמחורים שמורים</h2>
        <Button size="sm" onClick={onNewPricing}>
          <Plus className="h-3.5 w-3.5 ml-1" />
          תמחור חדש
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם או תאריך..."
          className="pr-9"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border px-4 py-3">
        <DataTable
          columns={columns}
          data={filtered}
          rowKey={p => p.id}
          pagination={pagination}
          emptyMessage={search ? 'לא נמצאו תוצאות' : 'אין תמחורים שמורים עדיין'}
        />
      </div>

      {/* Detail Modal */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>{detailPricing?.name}</DialogTitle></DialogHeader>
          {detailPricing && (
            <div className="space-y-3 text-sm">
              {detailPricing.pricing_parts.length > 0 && (
                <div>
                  <p className="font-semibold mb-1">חומרי גלם</p>
                  <table className="w-full">
                    <tbody>
                      {detailPricing.pricing_parts.map(part => (
                        <tr key={part.id}>
                          <td className="py-0.5">{part.name}</td>
                          <td className="py-0.5 text-left">{ils(part.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 border-t pt-2">
                <span className="text-muted-foreground">שעות עבודה</span><span>{detailPricing.time_hours} ש׳</span>
                <span className="text-muted-foreground">ערך שעה</span><span>{ils(detailPricing.hourly_rate)}</span>
                <span className="text-muted-foreground">הוצאות נלוות/שעה</span><span>{ils(detailPricing.overhead_per_hour)}</span>
                <span className="text-muted-foreground">רווח</span>
                <span>
                  {detailPricing.profit_type === 'percent'
                    ? `${detailPricing.profit_value}%`
                    : ils(detailPricing.profit_value)}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold text-base">
                <span>מחיר מומלץ</span>
                <span className="text-green-700">
                  {detailPricing.suggested_price != null ? ils(detailPricing.suggested_price) : '—'}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
