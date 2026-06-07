'use client'

import { useState, useTransition } from 'react'
import { savePricing, deletePricing, SavePricingInput } from '@/app/(dashboard)/pricing/actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  defaultHourlyRate: number
}

interface Part {
  name: string
  price: number
}

function ils(n: number) {
  return n.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('he-IL')
}

const STEPS = ['חומרי גלם', 'עבודה', 'הוצאות נלוות', 'רווח']

export default function PricingClient({ pricings, defaultHourlyRate }: Props) {
  const [showWizard, setShowWizard] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  // Wizard state
  const [wizardName, setWizardName] = useState('')
  const [parts, setParts] = useState<Part[]>([{ name: '', price: 0 }])
  const [hourlyRate, setHourlyRate] = useState(defaultHourlyRate)
  const [timeHours, setTimeHours] = useState(0)
  const [overheadPerHour, setOverheadPerHour] = useState(0)
  const [profitType, setProfitType] = useState<'percent' | 'fixed'>('percent')
  const [profitValue, setProfitValue] = useState(0)

  const materialsTotal = parts.reduce((s, p) => s + (p.price || 0), 0)
  const laborTotal = timeHours * hourlyRate
  const overheadTotal = timeHours * overheadPerHour
  const costBase = materialsTotal + laborTotal + overheadTotal
  const profitAmount = profitType === 'percent' ? costBase * (profitValue / 100) : profitValue
  const suggestedPrice = costBase + profitAmount

  function resetWizard() {
    setStep(0)
    setWizardName('')
    setParts([{ name: '', price: 0 }])
    setHourlyRate(defaultHourlyRate)
    setTimeHours(0)
    setOverheadPerHour(0)
    setProfitType('percent')
    setProfitValue(0)
    setError('')
  }

  function openWizard() {
    resetWizard()
    setShowWizard(true)
  }

  function handleSave() {
    if (!wizardName.trim()) { setError('יש להזין שם לתמחור'); return }
    const input: SavePricingInput = {
      name: wizardName,
      hourly_rate: hourlyRate,
      time_hours: timeHours,
      overhead_per_hour: overheadPerHour,
      profit_type: profitType,
      profit_value: profitValue,
      suggested_price: suggestedPrice,
      parts: parts.filter(p => p.name.trim()),
    }
    startTransition(async () => {
      const res = await savePricing(input)
      if (res && 'error' in res && res.error) {
        setError(res.error)
        toast.error(res.error)
      } else {
        toast.success('תמחור נשמר')
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

  const detailPricing = pricings.find(p => p.id === detailId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">תמחור מוצרים</h1>
        <Button onClick={openWizard}>
          <Plus className="h-4 w-4 ml-1" />
          תמחור חדש
        </Button>
      </div>

      {/* Pricing History List */}
      {pricings.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-10 text-center text-muted-foreground">
          אין תמחורים שמורים עדיין
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border divide-y divide-border">
          {pricings.map(p => (
            <div key={p.id} className="flex items-center justify-between p-4">
              <div
                className="flex-1 cursor-pointer hover:text-blue-600"
                onClick={() => setDetailId(p.id)}
              >
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-gray-500">{formatDate(p.created_at)}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-green-700">
                  {p.suggested_price != null ? ils(p.suggested_price) : '—'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(p.id)}
                  disabled={isPending}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{detailPricing?.name}</DialogTitle>
          </DialogHeader>
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

      {/* Wizard Modal */}
      <Dialog open={showWizard} onOpenChange={v => { if (!v) setShowWizard(false) }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>תמחור חדש</DialogTitle>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex gap-1 mb-2">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`flex-1 text-center text-xs py-1 rounded ${i === step ? 'bg-blue-600 text-white' : i < step ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}
              >
                {i + 1}. {s}
              </div>
            ))}
          </div>

          <div className="min-h-[260px]">
            {step === 0 && (
              <Step1
                parts={parts}
                setParts={setParts}
                wizardName={wizardName}
                setWizardName={setWizardName}
                materialsTotal={materialsTotal}
              />
            )}
            {step === 1 && (
              <Step2
                hourlyRate={hourlyRate}
                setHourlyRate={setHourlyRate}
                timeHours={timeHours}
                setTimeHours={setTimeHours}
                laborTotal={laborTotal}
              />
            )}
            {step === 2 && (
              <Step3
                overheadPerHour={overheadPerHour}
                setOverheadPerHour={setOverheadPerHour}
                timeHours={timeHours}
                overheadTotal={overheadTotal}
              />
            )}
            {step === 3 && (
              <Step4
                profitType={profitType}
                setProfitType={setProfitType}
                profitValue={profitValue}
                setProfitValue={setProfitValue}
                costBase={costBase}
                profitAmount={profitAmount}
                suggestedPrice={suggestedPrice}
                materialsTotal={materialsTotal}
                laborTotal={laborTotal}
                overheadTotal={overheadTotal}
              />
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              onClick={() => step === 0 ? setShowWizard(false) : setStep(s => s - 1)}
            >
              {step === 0 ? 'ביטול' : (
                <><ChevronRight className="h-4 w-4 ml-1" />הקודם</>
              )}
            </Button>
            {step < 3 ? (
              <Button onClick={() => setStep(s => s + 1)}>
                הבא <ChevronLeft className="h-4 w-4 mr-1" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={isPending}>
                שמור תמחור
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Step Components ───────────────────────────────────────────────────────────

function Step1({
  parts, setParts, wizardName, setWizardName, materialsTotal,
}: {
  parts: Part[]
  setParts: React.Dispatch<React.SetStateAction<Part[]>>
  wizardName: string
  setWizardName: (v: string) => void
  materialsTotal: number
}) {
  function updatePart(i: number, field: keyof Part, value: string | number) {
    setParts(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p))
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
          <div key={i} className="flex gap-2">
            <Input
              placeholder="שם חומר"
              value={p.name}
              onChange={e => updatePart(i, 'name', e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              min={0}
              placeholder="מחיר"
              value={p.price || ''}
              onChange={e => updatePart(i, 'price', parseFloat(e.target.value) || 0)}
              className="w-28 text-left"
            />
            <Button variant="ghost" size="sm" onClick={() => removePart(i)} className="text-red-500">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setParts(p => [...p, { name: '', price: 0 }])}>
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
  hourlyRate: number
  setHourlyRate: (v: number) => void
  timeHours: number
  setTimeHours: (v: number) => void
  laborTotal: number
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>שעות עבודה</Label>
        <Input
          type="number" min={0} step={0.5}
          value={timeHours || ''}
          onChange={e => setTimeHours(parseFloat(e.target.value) || 0)}
        />
      </div>
      <div className="space-y-1">
        <Label>ערך שעה (₪)</Label>
        <Input
          type="number" min={0}
          value={hourlyRate || ''}
          onChange={e => setHourlyRate(parseFloat(e.target.value) || 0)}
        />
      </div>
      <p className="text-sm font-medium text-gray-700">סה&quot;כ עבודה: <strong>{laborTotal.toLocaleString('he-IL')} ₪</strong></p>
    </div>
  )
}

function Step3({
  overheadPerHour, setOverheadPerHour, timeHours, overheadTotal,
}: {
  overheadPerHour: number
  setOverheadPerHour: (v: number) => void
  timeHours: number
  overheadTotal: number
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">הוצאות נלוות לשעה: שחיקת ציוד, שכר דירה יחסי וכד׳.</p>
      <div className="space-y-1">
        <Label>הוצאות נלוות לשעה (₪)</Label>
        <Input
          type="number" min={0}
          value={overheadPerHour || ''}
          onChange={e => setOverheadPerHour(parseFloat(e.target.value) || 0)}
        />
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
  profitType: 'percent' | 'fixed'
  setProfitType: (v: 'percent' | 'fixed') => void
  profitValue: number
  setProfitValue: (v: number) => void
  costBase: number
  profitAmount: number
  suggestedPrice: number
  materialsTotal: number
  laborTotal: number
  overheadTotal: number
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={profitType === 'percent' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setProfitType('percent')}
        >% מהעלות</Button>
        <Button
          variant={profitType === 'fixed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setProfitType('fixed')}
        >סכום קבוע (₪)</Button>
      </div>
      <div className="space-y-1">
        <Label>{profitType === 'percent' ? 'אחוז רווח' : 'רווח (₪)'}</Label>
        <Input
          type="number" min={0}
          value={profitValue || ''}
          onChange={e => setProfitValue(parseFloat(e.target.value) || 0)}
        />
      </div>

      {/* Price breakdown card */}
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
