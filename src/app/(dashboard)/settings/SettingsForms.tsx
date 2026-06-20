'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { saveGeneralSettings, saveBalanceSettings, saveEmailSettings, changePassword, savePricingSettings, saveDeliverySettings } from './actions'
import { formatILS } from '@/lib/utils'
import type { Settings } from '@/stores/settingsStore'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { Settings2, Calculator, Car } from 'lucide-react'
import { PasswordInput } from '@/components/ui/password-input'

interface ActionState {
  success?: boolean
  error?: string
}

function useToastOnResult(state: ActionState | null) {
  useEffect(() => {
    if (!state) return
    if (state.success) toast.success('נשמר בהצלחה')
    if (state.error) toast.error(state.error)
  }, [state])
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  )
}


function ILSInput({ id, name, value, onChange, step = '1', min = '0', className }: {
  id: string; name: string; value: number; onChange: (v: number) => void
  step?: string; min?: string; className?: string
}) {
  return (
    <div className={`relative ${className ?? ''}`}>
      <Input id={id} name={name} type="number" min={min} step={step}
        value={value} onChange={e => onChange(Number(e.target.value))} className="pl-8" />
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">₪</span>
    </div>
  )
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  )
}


// ─── Combined business settings card ─────────────────────────────────────────

function GeneralSection({ settings }: { settings: Settings | null }) {
  const [state, action] = useFormState<ActionState | null, FormData>(saveGeneralSettings, null)
  useToastOnResult(state)
  return (
    <form action={action} className="flex flex-col h-full gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="business_name">שם העסק</Label>
        <Input id="business_name" name="business_name"
          defaultValue={settings?.business_name ?? ''} placeholder="שם העסק שלך" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="vat_rate">מע&quot;מ</Label>
          <div className="relative">
            <Input id="vat_rate" name="vat_rate" type="number" step="0.01" min="0" max="100"
              defaultValue={settings?.vat_rate ?? 18} className="pl-8" />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="paycheck_percent">משכורת מרווח</Label>
          <div className="relative">
            <Input id="paycheck_percent" name="paycheck_percent" type="number" step="0.01" min="0" max="100"
              defaultValue={settings?.paycheck_percent ?? 30} className="pl-8" />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
          </div>
        </div>
      </div>
      <div className="mt-auto pt-2">
        <SubmitButton label="שמור" pendingLabel="שומר..." />
      </div>
    </form>
  )
}

function BalanceSection({ settings }: { settings: Settings | null }) {
  const [state, action] = useFormState<ActionState | null, FormData>(saveBalanceSettings, null)
  useToastOnResult(state)
  return (
    <form action={action} className="flex flex-col h-full gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="opening_balance">יתרת פתיחה</Label>
        <div className="relative">
          <Input id="opening_balance" name="opening_balance" type="number" step="0.01"
            defaultValue={settings?.opening_balance ?? 0} className="pl-8" />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">₪</span>
        </div>
        <p className="text-xs text-muted-foreground">נקודת הפתיחה של תזרים המזומנים</p>
      </div>
      <div className="mt-auto pt-2">
        <SubmitButton label="שמור" pendingLabel="שומר..." />
      </div>
    </form>
  )
}

function EmailSection({ settings }: { settings: Settings | null }) {
  const [state, action] = useFormState<ActionState | null, FormData>(saveEmailSettings, null)
  useToastOnResult(state)
  return (
    <form action={action} className="flex flex-col h-full gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="accountant_email">מייל רואה החשבון</Label>
        <Input id="accountant_email" name="accountant_email" type="email"
          defaultValue={settings?.accountant_email ?? ''} placeholder="accountant@example.com" dir="ltr" />
        <p className="text-xs text-muted-foreground">יעד לסיכום החודשי</p>
      </div>
      <div className="mt-auto pt-2">
        <SubmitButton label="שמור" pendingLabel="שומר..." />
      </div>
    </form>
  )
}

function AccountSection() {
  const [state, action] = useFormState<ActionState | null, FormData>(changePassword, null)
  useToastOnResult(state)
  return (
    <form action={action} className="flex flex-col h-full gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">סיסמה חדשה</Label>
        <PasswordInput id="password" name="password" placeholder="לפחות 6 תווים" minLength={6} />
      </div>
      <div className="mt-auto pt-2">
        <SubmitButton label="עדכן" pendingLabel="מעדכן..." />
      </div>
    </form>
  )
}

export function SettingsCard({ settings, email }: { settings: Settings | null; email: string }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            הגדרות עסקיות
          </CardTitle>
          <span className="text-sm text-muted-foreground" dir="ltr">{email}</span>
        </div>
      </CardHeader>
      <div className="border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
        <div className="bg-card p-5 flex flex-col"><GeneralSection settings={settings} /></div>
        <div className="bg-card p-5 flex flex-col"><BalanceSection settings={settings} /></div>
        <div className="bg-card p-5 flex flex-col"><EmailSection settings={settings} /></div>
        <div className="bg-card p-5 flex flex-col"><AccountSection /></div>
      </div>
    </Card>
  )
}

// ─── Calculator cards ─────────────────────────────────────────────────────────

function PricingSection({ settings }: { settings: Settings | null }) {
  const [state, action] = useFormState<ActionState | null, FormData>(savePricingSettings, null)
  useToastOnResult(state)

  const [salary, setSalary]     = useState(settings?.monthly_salary_target ?? 0)
  const [expenses, setExpenses] = useState(settings?.monthly_fixed_expenses ?? 0)
  const [days, setDays]         = useState(settings?.working_days_per_month ?? 22)
  const [hours, setHours]       = useState(settings?.hours_per_day ?? 8)

  const hoursPerMonth   = days * hours
  const derivedHourly   = hoursPerMonth > 0 ? salary / hoursPerMonth : 0
  const derivedOverhead = hoursPerMonth > 0 ? expenses / hoursPerMonth : 0

  return (
    <form action={action} className="flex flex-col h-full">
      <input type="hidden" name="default_hourly_rate"       value={derivedHourly.toFixed(2)} />
      <input type="hidden" name="default_overhead_per_hour" value={derivedOverhead.toFixed(2)} />
      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        <div className="flex-1 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="monthly_salary_target">יעד שכר חודשי</Label>
              <ILSInput id="monthly_salary_target" name="monthly_salary_target" value={salary} onChange={setSalary} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="monthly_fixed_expenses">הוצאות קבועות חודשיות</Label>
              <ILSInput id="monthly_fixed_expenses" name="monthly_fixed_expenses" value={expenses} onChange={setExpenses} />
              <p className="text-xs text-muted-foreground">שכ&quot;ד, ציוד, מנויים...</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="working_days_per_month">ימי עבודה בחודש</Label>
              <Input id="working_days_per_month" name="working_days_per_month"
                type="number" min="1" max="31" step="1"
                value={days} onChange={e => setDays(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hours_per_day">שעות עבודה ביום</Label>
              <Input id="hours_per_day" name="hours_per_day"
                type="number" min="1" max="24" step="0.5"
                value={hours} onChange={e => setHours(Number(e.target.value))} />
            </div>
          </div>
          <div className="mt-auto pt-2">
            <SubmitButton label="שמור" pendingLabel="שומר..." />
          </div>
        </div>
        <div className="lg:w-52 rounded-lg border bg-muted/40 p-4 flex flex-col">
          <p className="text-xs font-semibold text-muted-foreground mb-3">{hoursPerMonth} שעות / חודש</p>
          <ResultRow label="ערך שעה" value={formatILS(derivedHourly)} />
          <ResultRow label="הוצאות נלוות לשעה" value={formatILS(derivedOverhead)} />
          <div className="border-t mt-2 pt-2 flex items-center justify-between">
            <span className="text-sm font-semibold">סה&quot;כ לשעה</span>
            <span className="text-lg font-bold tabular-nums">{formatILS(derivedHourly + derivedOverhead)}</span>
          </div>
        </div>
      </div>
    </form>
  )
}

function DeliverySection({ settings }: { settings: Settings | null }) {
  const [state, action] = useFormState<ActionState | null, FormData>(saveDeliverySettings, null)
  useToastOnResult(state)

  const [fuelPrice, setFuelPrice]       = useState(settings?.fuel_price_per_liter ?? 0)
  const [kmPerLiter, setKmPerLiter]     = useState(settings?.km_per_liter ?? 0)
  const [maintenance, setMaintenance]   = useState(settings?.yearly_maintenance_cost ?? 0)
  const [insurance, setInsurance]       = useState(settings?.yearly_insurance_cost ?? 0)
  const [vehicleValue, setVehicleValue] = useState(settings?.vehicle_value ?? 0)
  const [deprRate, setDeprRate]         = useState(settings?.depreciation_rate_percent ?? 15)
  const [yearlyKm, setYearlyKm]         = useState(settings?.yearly_kilometers ?? 0)

  const fuelCostPerKm         = kmPerLiter > 0 ? fuelPrice / kmPerLiter : 0
  const maintenanceCostPerKm  = yearlyKm > 0 ? maintenance / yearlyKm : 0
  const insuranceCostPerKm    = yearlyKm > 0 ? insurance / yearlyKm : 0
  const depreciationCostPerKm = yearlyKm > 0 ? (vehicleValue * deprRate / 100) / yearlyKm : 0
  const costPerKm = fuelCostPerKm + maintenanceCostPerKm + insuranceCostPerKm + depreciationCostPerKm

  return (
    <form action={action} className="flex flex-col h-full">
      <input type="hidden" name="cost_per_km" value={costPerKm.toFixed(4)} />
      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        <div className="flex-1 flex flex-col gap-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fuel_price_per_liter">מחיר ליטר דלק</Label>
              <ILSInput id="fuel_price_per_liter" name="fuel_price_per_liter" value={fuelPrice} onChange={setFuelPrice} step="0.01" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="km_per_liter">ק&quot;מ לליטר</Label>
              <Input id="km_per_liter" name="km_per_liter" type="number" min="0.1" step="0.1"
                value={kmPerLiter} onChange={e => setKmPerLiter(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="yearly_kilometers">ק&quot;מ שנתיים</Label>
              <Input id="yearly_kilometers" name="yearly_kilometers" type="number" min="1" step="500"
                value={yearlyKm} onChange={e => setYearlyKm(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="yearly_maintenance_cost">תחזוקה שנתית</Label>
              <ILSInput id="yearly_maintenance_cost" name="yearly_maintenance_cost" value={maintenance} onChange={setMaintenance} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="yearly_insurance_cost">ביטוח שנתי</Label>
              <ILSInput id="yearly_insurance_cost" name="yearly_insurance_cost" value={insurance} onChange={setInsurance} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehicle_value">שווי הרכב</Label>
              <ILSInput id="vehicle_value" name="vehicle_value" value={vehicleValue} onChange={setVehicleValue} step="1000" />
            </div>
            <div className="space-y-1.5 md:col-span-3">
              <Label htmlFor="depreciation_rate_percent">% פחת שנתי</Label>
              <div className="flex items-center gap-3">
                <div className="relative w-24">
                  <Input id="depreciation_rate_percent" name="depreciation_rate_percent"
                    type="number" min="0" max="100" step="0.5"
                    value={deprRate} onChange={e => setDeprRate(Number(e.target.value))} className="pl-8" />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
                </div>
                <p className="text-xs text-muted-foreground">פחת שנתי: {formatILS(vehicleValue * deprRate / 100)}</p>
              </div>
            </div>
          </div>
          <div className="mt-auto pt-2">
            <SubmitButton label="שמור" pendingLabel="שומר..." />
          </div>
        </div>
        <div className="lg:w-52 rounded-lg border bg-muted/40 p-4 flex flex-col">
          <p className="text-xs font-semibold text-muted-foreground mb-3">פירוט עלות לק&quot;מ</p>
          <ResultRow label="דלק" value={formatILS(fuelCostPerKm, 3)} />
          <ResultRow label="תחזוקה" value={formatILS(maintenanceCostPerKm, 3)} />
          <ResultRow label="ביטוח" value={formatILS(insuranceCostPerKm, 3)} />
          <ResultRow label="פחת" value={formatILS(depreciationCostPerKm, 3)} />
          <div className="border-t mt-2 pt-2 flex items-center justify-between">
            <span className="text-sm font-semibold">סה&quot;כ לק&quot;מ</span>
            <span className="text-lg font-bold tabular-nums">{formatILS(costPerKm, 3)}</span>
          </div>
        </div>
      </div>
    </form>
  )
}

export function CalculatorsCard({ settings }: { settings: Settings | null }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4 text-muted-foreground" />
          מחשבונים
        </CardTitle>
      </CardHeader>
      <div className="border-t grid grid-cols-1 lg:grid-cols-2 gap-px bg-border">
        <div className="bg-card flex flex-col">
          <div className="px-5 py-3 flex items-center gap-2 border-b bg-muted/30">
            <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">תמחור — ערכי ברירת מחדל</span>
          </div>
          <div className="p-5 flex-1">
            <PricingSection settings={settings} />
          </div>
        </div>
        <div className="bg-card flex flex-col">
          <div className="px-5 py-3 flex items-center gap-2 border-b bg-muted/30">
            <Car className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">עלות משלוח לק&quot;מ</span>
          </div>
          <div className="p-5 flex-1">
            <DeliverySection settings={settings} />
          </div>
        </div>
      </div>
    </Card>
  )
}
