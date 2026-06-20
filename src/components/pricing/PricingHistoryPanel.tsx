'use client'

import { useState, useTransition, useEffect, Fragment } from 'react'
import { savePricing, updatePricing, deletePricing, type SavePricingInput } from '@/app/(dashboard)/pricing/actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable, type DataTableColumn, type DataTablePagination } from '@/components/ui/data-table'
import { Plus, Trash2, Search, X, ChevronRight, ChevronLeft, Check, Pencil } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Autocomplete } from '@/components/ui/autocomplete'
import { type Material } from '@/components/pricing/MaterialsPanel'

export interface PricingPart {
  id: string
  name: string
  quantity: number
  material_id: string | null
  price: number | null
  materials: { price: number; unit: string } | null
}

export interface PricingRow {
  id: string
  name: string
  hourly_rate: number
  time_hours: number
  overhead_per_hour: number
  profit_type: string
  profit_value: number
  suggested_price: number | null
  created_at: string
  pricing_parts: PricingPart[]
}

function partTotal(pp: PricingPart): number {
  if (pp.material_id && pp.materials) return pp.materials.price * pp.quantity
  return pp.price ?? 0
}

interface Props {
  pricings: PricingRow[]
  defaultHourlyRate: number
  materials: Material[]
}

interface Part {
  materialId: string | null
  name: string
  unit: string
  unitPrice: number
  quantity: number
}

const STEPS = ['חומרי גלם', 'עבודה', 'הוצאות נלוות', 'רווח']
const PAGE_SIZE = 10

function ils(n: number) {
  return n.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('he-IL')
}

const EMPTY_PART: Part = { materialId: null, name: '', unit: '', unitPrice: 0, quantity: 1 }

export default function PricingHistoryPanel({ pricings, defaultHourlyRate, materials }: Props) {
  // list state
  const [detailId, setDetailId]      = useState<string | null>(null)
  const [search, setSearch]          = useState('')
  const [page, setPage]              = useState(0)
  const [isPending, startTransition] = useTransition()

  // wizard state
  const [showWizard, setShowWizard]       = useState(false)
  const [editingId, setEditingId]         = useState<string | null>(null)
  const [step, setStep]                   = useState(0)
  const [wizardError, setWizardError]     = useState('')
  const [wizardName, setWizardName]       = useState('')
  const [parts, setParts]                 = useState<Part[]>([EMPTY_PART])
  const [hourlyRate, setHourlyRate]       = useState(defaultHourlyRate)
  const [timeHours, setTimeHours]         = useState(0)
  const [overheadPerHour, setOverheadPerHour] = useState(0)
  const [profitType, setProfitType]       = useState<'percent' | 'fixed'>('percent')
  const [profitValue, setProfitValue]     = useState(0)

  useEffect(() => { setPage(0) }, [search])

  const materialsTotal  = parts.reduce((s, p) => s + p.unitPrice * p.quantity, 0)
  const laborTotal      = timeHours * hourlyRate
  const overheadTotal   = timeHours * overheadPerHour
  const costBase        = materialsTotal + laborTotal + overheadTotal
  const profitAmount    = profitType === 'percent' ? costBase * (profitValue / 100) : profitValue
  const suggestedPrice  = costBase + profitAmount

  const filtered = pricings.filter(p => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return p.name.toLowerCase().includes(q) || formatDate(p.created_at).includes(q)
  })

  const pagination: DataTablePagination = {
    page, pageSize: PAGE_SIZE, total: filtered.length, onPageChange: setPage,
  }

  const detailPricing = pricings.find(p => p.id === detailId)

  function resetWizard() {
    setStep(0); setEditingId(null); setWizardName(''); setWizardError('')
    setParts([EMPTY_PART]); setHourlyRate(defaultHourlyRate)
    setTimeHours(0); setOverheadPerHour(0); setProfitType('percent'); setProfitValue(0)
  }

  function openNew() { resetWizard(); setShowWizard(true) }

  function openEdit(pricing: PricingRow) {
    setEditingId(pricing.id)
    setStep(0)
    setWizardName(pricing.name)
    setParts(pricing.pricing_parts.length > 0
      ? pricing.pricing_parts.map(pp => {
          if (pp.material_id && pp.materials) {
            const mat = materials.find(m => m.id === pp.material_id)
            return {
              materialId: pp.material_id,
              name: pp.name,
              unit: mat?.unit ?? pp.materials.unit,
              unitPrice: mat?.price ?? pp.materials.price,
              quantity: pp.quantity,
            }
          }
          return { materialId: null, name: pp.name, unit: '', unitPrice: pp.price ?? 0, quantity: 1 }
        })
      : [EMPTY_PART]
    )
    setHourlyRate(pricing.hourly_rate)
    setTimeHours(pricing.time_hours)
    setOverheadPerHour(pricing.overhead_per_hour)
    setProfitType(pricing.profit_type as 'percent' | 'fixed')
    setProfitValue(pricing.profit_value)
    setWizardError('')
    setDetailId(null)
    setShowWizard(true)
  }

  function validateStep(s: number): string | null {
    if (s === 0 && !wizardName.trim()) return 'יש להזין שם לתמחור'
    if (s === 1 && (!timeHours || timeHours <= 0)) return 'יש להזין שעות עבודה'
    if (s === 1 && (!hourlyRate || hourlyRate <= 0)) return 'יש להזין ערך שעה'
    if (s === 3 && (!profitValue || profitValue <= 0)) return 'יש להזין רווח'
    return null
  }

  function handleNext() {
    const err = validateStep(step)
    if (err) { setWizardError(err); return }
    setWizardError(''); setStep(s => s + 1)
  }

  function handleSave() {
    const err = validateStep(3)
    if (err) { setWizardError(err); return }
    if (!wizardName.trim()) { setWizardError('יש להזין שם לתמחור'); return }

    const input: SavePricingInput = {
      name: wizardName,
      hourly_rate: hourlyRate,
      time_hours: timeHours,
      overhead_per_hour: overheadPerHour,
      profit_type: profitType,
      profit_value: profitValue,
      suggested_price: suggestedPrice,
      parts: parts.filter(p => p.name.trim()).map(p => p.materialId
        ? { name: p.name, material_id: p.materialId, quantity: p.quantity }
        : { name: p.name, price: p.unitPrice }
      ),
    }

    startTransition(async () => {
      const res = editingId
        ? await updatePricing(editingId, input)
        : await savePricing(input)
      if (res && 'error' in res && res.error) {
        setWizardError(res.error); toast.error(res.error)
      } else {
        toast.success(editingId ? 'תמחור עודכן' : 'תמחור נשמר')
        setShowWizard(false)
      }
    })
  }

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
      key: 'name', header: 'שם', sortValue: p => p.name,
      cell: p => (
        <button className="font-medium text-right hover:text-primary transition-colors" onClick={() => setDetailId(p.id)}>
          {p.name}
        </button>
      ),
    },
    {
      key: 'date', header: 'תאריך',
      className: 'text-muted-foreground tabular-nums', sortValue: p => p.created_at,
      cell: p => formatDate(p.created_at),
    },
    {
      key: 'price', header: 'מחיר מומלץ',
      className: 'font-semibold text-green-700 tabular-nums', sortValue: p => p.suggested_price ?? 0,
      cell: p => p.suggested_price != null ? ils(p.suggested_price) : '—',
    },
    {
      key: 'actions', header: '', headerClassName: 'w-16', mobileHidden: true,
      cell: p => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm"
            onClick={e => { e.stopPropagation(); openEdit(p) }}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm"
            onClick={e => { e.stopPropagation(); handleDelete(p.id) }}
            disabled={isPending}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">תמחורים שמורים</h2>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-3.5 w-3.5 ml-1" />
          תמחור חדש
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש לפי שם או תאריך..." className="pr-9" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border px-4 py-3">
        <DataTable columns={columns} data={filtered} rowKey={p => p.id} pagination={pagination}
          emptyMessage={search ? 'לא נמצאו תוצאות' : 'אין תמחורים שמורים עדיין'} />
      </div>

      {/* Detail Modal */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{detailPricing?.name}</DialogTitle>
            {detailPricing && (
              <p className="text-xs text-muted-foreground">
                {new Date(detailPricing.created_at).toLocaleDateString('he-IL')}
              </p>
            )}
          </DialogHeader>
          {detailPricing && (() => {
            const mTotal = detailPricing.pricing_parts.reduce((s, pp) => s + partTotal(pp), 0)
            const lTotal = detailPricing.time_hours * detailPricing.hourly_rate
            const oTotal = detailPricing.time_hours * detailPricing.overhead_per_hour
            const base   = mTotal + lTotal + oTotal
            const profit = detailPricing.profit_type === 'percent'
              ? base * (detailPricing.profit_value / 100)
              : detailPricing.profit_value
            const total  = base + profit
            const fmt    = (n: number) => n.toLocaleString('he-IL', { maximumFractionDigits: 0 })
            return (
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-4 space-y-1.5 text-sm">
                  {/* Materials rows */}
                  <div className="flex justify-between text-muted-foreground font-medium">
                    <span>חומרי גלם</span>
                    <span>{fmt(mTotal)} ₪</span>
                  </div>
                  {detailPricing.pricing_parts.map(pp => (
                    <div key={pp.id} className="flex justify-between text-xs text-muted-foreground/70 pr-3">
                      <span>{pp.name}</span>
                      <span className="flex items-center gap-2 ltr:flex-row-reverse">
                        {pp.material_id && pp.materials && (
                          <span className="text-muted-foreground/50">{pp.quantity} {pp.materials.unit}</span>
                        )}
                        <span>{fmt(partTotal(pp))} ₪</span>
                      </span>
                    </div>
                  ))}

                  {/* Labor */}
                  <div className="flex justify-between text-muted-foreground pt-0.5">
                    <span className="flex flex-col">
                      <span>עבודה</span>
                      <span className="text-xs text-muted-foreground/60">
                        {detailPricing.time_hours} ש׳ × {ils(detailPricing.hourly_rate)}
                      </span>
                    </span>
                    <span>{fmt(lTotal)} ₪</span>
                  </div>

                  {/* Overhead */}
                  {oTotal > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span className="flex flex-col">
                        <span>הוצאות נלוות</span>
                        <span className="text-xs text-muted-foreground/60">
                          {detailPricing.time_hours} ש׳ × {ils(detailPricing.overhead_per_hour)}
                        </span>
                      </span>
                      <span>{fmt(oTotal)} ₪</span>
                    </div>
                  )}

                  {/* Cost base */}
                  <div className="flex justify-between text-foreground font-medium border-t pt-1.5 mt-0.5">
                    <span>עלות בסיס</span>
                    <span>{fmt(base)} ₪</span>
                  </div>

                  {/* Profit */}
                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      רווח
                      {detailPricing.profit_type === 'percent' && (
                        <span className="text-xs mr-1 text-muted-foreground/60">({detailPricing.profit_value}%)</span>
                      )}
                    </span>
                    <span>+ {fmt(profit)} ₪</span>
                  </div>

                  {/* Suggested price */}
                  <div className="flex justify-between font-bold text-lg text-green-700 border-t pt-2 mt-0.5">
                    <span>מחיר מומלץ</span>
                    <span>{fmt(total)} ₪</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => openEdit(detailPricing)}>
                    <Pencil className="h-3.5 w-3.5 ml-1" />ערוך
                  </Button>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Wizard Modal */}
      <Dialog open={showWizard} onOpenChange={v => { if (!v) setShowWizard(false) }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'עריכת תמחור' : 'תמחור חדש'}</DialogTitle>
          </DialogHeader>

          <div className="flex items-start mb-5">
            {STEPS.map((s, i) => (
              <Fragment key={s}>
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-200',
                    i < step   && 'bg-primary border-primary text-primary-foreground',
                    i === step && 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/20',
                    i > step   && 'bg-background border-border text-muted-foreground',
                  )}>
                    {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span className={cn(
                    'text-[11px] text-center leading-tight max-w-[64px]',
                    i < step   && 'text-primary',
                    i === step && 'font-semibold text-foreground',
                    i > step   && 'text-muted-foreground',
                  )}>
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn('flex-1 h-px mt-4 mx-1 transition-colors duration-300', step > i ? 'bg-primary' : 'bg-border')} />
                )}
              </Fragment>
            ))}
          </div>

          <div className="min-h-[260px]">
            {step === 0 && <Step1 parts={parts} setParts={setParts} wizardName={wizardName} setWizardName={setWizardName} materialsTotal={materialsTotal} materials={materials} />}
            {step === 1 && <Step2 hourlyRate={hourlyRate} setHourlyRate={setHourlyRate} timeHours={timeHours} setTimeHours={setTimeHours} laborTotal={laborTotal} />}
            {step === 2 && <Step3 overheadPerHour={overheadPerHour} setOverheadPerHour={setOverheadPerHour} timeHours={timeHours} overheadTotal={overheadTotal} />}
            {step === 3 && <Step4 profitType={profitType} setProfitType={setProfitType} profitValue={profitValue} setProfitValue={setProfitValue} costBase={costBase} profitAmount={profitAmount} suggestedPrice={suggestedPrice} materialsTotal={materialsTotal} laborTotal={laborTotal} overheadTotal={overheadTotal} />}
          </div>

          {wizardError && <p className="text-red-500 text-sm">{wizardError}</p>}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => { setWizardError(''); if (step === 0) setShowWizard(false); else setStep(s => s - 1) }}>
              {step === 0 ? 'ביטול' : <><ChevronRight className="h-4 w-4 ml-1" />הקודם</>}
            </Button>
            {step < 3
              ? <Button onClick={handleNext}>הבא <ChevronLeft className="h-4 w-4 mr-1" /></Button>
              : <Button onClick={handleSave} disabled={isPending}>{editingId ? 'שמור שינויים' : 'שמור תמחור'}</Button>
            }
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Step Components ───────────────────────────────────────────────────────────

function Step1({
  parts, setParts, wizardName, setWizardName, materialsTotal, materials,
}: {
  parts: Part[]
  setParts: React.Dispatch<React.SetStateAction<Part[]>>
  wizardName: string
  setWizardName: (v: string) => void
  materialsTotal: number
  materials: Material[]
}) {
  function selectCatalog(i: number, mat: Material) {
    setParts(prev => prev.map((p, idx) => idx === i
      ? { materialId: mat.id, name: mat.name, unit: mat.unit, unitPrice: mat.price, quantity: p.quantity || 1 }
      : p))
  }

  function setManualName(i: number, name: string) {
    setParts(prev => prev.map((p, idx) => idx === i
      ? { ...p, materialId: null, name, unit: '', unitPrice: 0 }
      : p))
  }

  function updateQuantity(i: number, qty: number) {
    setParts(prev => prev.map((p, idx) => idx === i ? { ...p, quantity: qty } : p))
  }

  function updateManualPrice(i: number, unitPrice: number) {
    setParts(prev => prev.map((p, idx) => idx === i ? { ...p, unitPrice } : p))
  }

  function removePart(i: number) {
    setParts(prev => prev.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>שם התמחור</Label>
        <Input value={wizardName} onChange={e => setWizardName(e.target.value)} placeholder="למשל: כרית מעוצבת" />
      </div>
      <div className="space-y-2">
        <Label>חומרי גלם</Label>
        {parts.map((p, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Autocomplete
              className="flex-1 min-w-0"
              options={materials.map(m => ({
                value: m.id,
                label: m.name,
                description: `${m.unit} · ₪${m.price}`,
              }))}
              value={p.name}
              onChange={name => setManualName(i, name)}
              onSelect={opt => {
                const mat = materials.find(m => m.id === opt.value)
                if (mat) selectCatalog(i, mat)
              }}
              placeholder="חפש או הקלד שם חומר..."
              emptyMessage="לא נמצא בקטלוג — יישמר כידני"
            />
            {p.materialId ? (
              <>
                <Input
                  type="number" min={0} step="0.01"
                  value={p.quantity || ''}
                  onChange={e => updateQuantity(i, parseFloat(e.target.value) || 0)}
                  className="w-16 shrink-0"
                  placeholder="כמות"
                />
                <span className="text-sm text-muted-foreground shrink-0">{p.unit}</span>
                <span className="text-sm font-medium tabular-nums w-20 text-left shrink-0">
                  {(p.unitPrice * p.quantity).toLocaleString('he-IL')} ₪
                </span>
              </>
            ) : (
              <div className="relative w-24 shrink-0">
                <Input
                  type="number" min={0}
                  placeholder="מחיר"
                  value={p.unitPrice || ''}
                  onChange={e => updateManualPrice(i, parseFloat(e.target.value) || 0)}
                  className="pl-8"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">₪</span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => removePart(i)} className="text-red-500 shrink-0 p-1">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setParts(p => [...p, { materialId: null, name: '', unit: '', unitPrice: 0, quantity: 1 }])}>
          <Plus className="h-4 w-4 ml-1" /> הוסף חומר גלם
        </Button>
      </div>
      <p className="text-sm font-medium text-gray-700">סה&quot;כ חומרי גלם: <strong>{materialsTotal.toLocaleString('he-IL')} ₪</strong></p>
    </div>
  )
}

function Step2({
  hourlyRate, setHourlyRate, timeHours, setTimeHours, laborTotal,
}: {
  hourlyRate: number; setHourlyRate: (v: number) => void
  timeHours: number; setTimeHours: (v: number) => void
  laborTotal: number
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>שעות עבודה</Label>
        <Input type="number" min={0} step={0.5} value={timeHours || ''} onChange={e => setTimeHours(parseFloat(e.target.value) || 0)} />
      </div>
      <div className="space-y-1">
        <Label>ערך שעה</Label>
        <div className="relative">
          <Input type="number" min={0} value={hourlyRate || ''} onChange={e => setHourlyRate(parseFloat(e.target.value) || 0)} className="pl-8" />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">₪</span>
        </div>
      </div>
      <p className="text-sm font-medium text-gray-700">סה&quot;כ עבודה: <strong>{laborTotal.toLocaleString('he-IL')} ₪</strong></p>
    </div>
  )
}

function Step3({
  overheadPerHour, setOverheadPerHour, timeHours, overheadTotal,
}: {
  overheadPerHour: number; setOverheadPerHour: (v: number) => void
  timeHours: number; overheadTotal: number
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">הוצאות נלוות לשעה: שחיקת ציוד, שכר דירה יחסי וכד׳.</p>
      <div className="space-y-1">
        <Label>הוצאות נלוות לשעה</Label>
        <div className="relative">
          <Input type="number" min={0} value={overheadPerHour || ''} onChange={e => setOverheadPerHour(parseFloat(e.target.value) || 0)} className="pl-8" />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">₪</span>
        </div>
      </div>
      <p className="text-sm text-gray-500">× {timeHours} שעות</p>
      <p className="text-sm font-medium text-gray-700">סה&quot;כ הוצאות נלוות: <strong>{overheadTotal.toLocaleString('he-IL')} ₪</strong></p>
    </div>
  )
}

function Step4({
  profitType, setProfitType, profitValue, setProfitValue,
  costBase, profitAmount, suggestedPrice,
  materialsTotal, laborTotal, overheadTotal,
}: {
  profitType: 'percent' | 'fixed'; setProfitType: (v: 'percent' | 'fixed') => void
  profitValue: number; setProfitValue: (v: number) => void
  costBase: number; profitAmount: number; suggestedPrice: number
  materialsTotal: number; laborTotal: number; overheadTotal: number
}) {
  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg border border-border bg-muted p-0.5 gap-0.5">
        {([['percent', '% מהעלות'], ['fixed', 'סכום קבוע (₪)']] as const).map(([val, label]) => (
          <button
            key={val} type="button" onClick={() => setProfitType(val)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
              profitType === val ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="space-y-1">
        <Label>{profitType === 'percent' ? 'אחוז רווח' : 'רווח'}</Label>
        <div className="relative">
          <Input type="number" min={0} value={profitValue || ''} onChange={e => setProfitValue(parseFloat(e.target.value) || 0)} className="pl-8" />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            {profitType === 'percent' ? '%' : '₪'}
          </span>
        </div>
      </div>
      <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>חומרי גלם</span><span>{materialsTotal.toLocaleString('he-IL')} ₪</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>עבודה</span><span>{laborTotal.toLocaleString('he-IL')} ₪</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>הוצאות נלוות</span><span>{overheadTotal.toLocaleString('he-IL')} ₪</span>
        </div>
        <div className="flex justify-between text-gray-600 border-t pt-1">
          <span>עלות בסיס</span><span>{costBase.toLocaleString('he-IL')} ₪</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>רווח</span><span>+ {profitAmount.toLocaleString('he-IL', { maximumFractionDigits: 0 })} ₪</span>
        </div>
        <div className="flex justify-between font-bold text-lg text-green-700 border-t pt-1">
          <span>מחיר מומלץ</span><span>{suggestedPrice.toLocaleString('he-IL', { maximumFractionDigits: 0 })} ₪</span>
        </div>
      </div>
    </div>
  )
}
