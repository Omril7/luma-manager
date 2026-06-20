'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { saveGeneralSettings, saveBalanceSettings, saveEmailSettings, changePassword, savePricingSettings } from './actions'
import type { Settings } from '@/stores/settingsStore'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { Settings2, Wallet, Mail, User, Calculator } from 'lucide-react'
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
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  )
}

export function GeneralSettingsForm({ settings }: { settings: Settings | null }) {
  const [state, action] = useFormState<ActionState | null, FormData>(saveGeneralSettings, null)
  useToastOnResult(state)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-muted-foreground" />
          כללי
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="business_name">שם העסק</Label>
            <Input
              id="business_name"
              name="business_name"
              defaultValue={settings?.business_name ?? ''}
              placeholder="שם העסק שלך"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="vat_rate">שיעור מע&quot;מ</Label>
              <div className="relative">
                <Input
                  id="vat_rate"
                  name="vat_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  defaultValue={settings?.vat_rate ?? 18}
                  className="pl-8"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="paycheck_percent">אחוז משכורת מרווח</Label>
              <div className="relative">
                <Input
                  id="paycheck_percent"
                  name="paycheck_percent"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  defaultValue={settings?.paycheck_percent ?? 30}
                  className="pl-8"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
              </div>
            </div>
          </div>
          <SubmitButton label="שמור" pendingLabel="שומר..." />
        </form>
      </CardContent>
    </Card>
  )
}

export function BalanceSettingsForm({ settings }: { settings: Settings | null }) {
  const [state, action] = useFormState<ActionState | null, FormData>(saveBalanceSettings, null)
  useToastOnResult(state)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="h-5 w-5 text-muted-foreground" />
          עובר ושב
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="opening_balance">יתרת פתיחה</Label>
            <div className="relative">
              <Input
                id="opening_balance"
                name="opening_balance"
                type="number"
                step="0.01"
                defaultValue={settings?.opening_balance ?? 0}
                className="pl-8"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">₪</span>
            </div>
            <p className="text-xs text-muted-foreground">
              הסכום שממנו מתחיל חישוב תזרים המזומנים
            </p>
          </div>
          <SubmitButton label="שמור" pendingLabel="שומר..." />
        </form>
      </CardContent>
    </Card>
  )
}

export function EmailSettingsForm({ settings }: { settings: Settings | null }) {
  const [state, action] = useFormState<ActionState | null, FormData>(saveEmailSettings, null)
  useToastOnResult(state)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="h-5 w-5 text-muted-foreground" />
          מייל
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="accountant_email">כתובת מייל של רואה החשבון</Label>
            <Input
              id="accountant_email"
              name="accountant_email"
              type="email"
              defaultValue={settings?.accountant_email ?? ''}
              placeholder="accountant@example.com"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              אל כתובת זו יישלח הסיכום החודשי
            </p>
          </div>
          <SubmitButton label="שמור" pendingLabel="שומר..." />
        </form>
      </CardContent>
    </Card>
  )
}

export function PricingSettingsForm({ settings }: { settings: Settings | null }) {
  const [state, action] = useFormState<ActionState | null, FormData>(savePricingSettings, null)
  useToastOnResult(state)

  const [salary, setSalary]       = useState(settings?.monthly_salary_target ?? 0)
  const [expenses, setExpenses]   = useState(settings?.monthly_fixed_expenses ?? 0)
  const [days, setDays]           = useState(settings?.working_days_per_month ?? 22)
  const [hours, setHours]         = useState(settings?.hours_per_day ?? 8)

  const hoursPerMonth   = days * hours
  const derivedHourly   = hoursPerMonth > 0 ? salary / hoursPerMonth : 0
  const derivedOverhead = hoursPerMonth > 0 ? expenses / hoursPerMonth : 0

  function ils(n: number) {
    return n.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 })
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5 text-muted-foreground" />
          תמחור — ערכי ברירת מחדל
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-6">
          <input type="hidden" name="default_hourly_rate"       value={derivedHourly.toFixed(2)} />
          <input type="hidden" name="default_overhead_per_hour" value={derivedOverhead.toFixed(2)} />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label htmlFor="monthly_salary_target">יעד שכר חודשי</Label>
              <div className="relative">
                <Input
                  id="monthly_salary_target"
                  name="monthly_salary_target"
                  type="number"
                  min="0"
                  step="1"
                  value={salary}
                  onChange={e => setSalary(Number(e.target.value))}
                  className="pl-8"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">₪</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="monthly_fixed_expenses">הוצאות קבועות חודשיות</Label>
              <div className="relative">
                <Input
                  id="monthly_fixed_expenses"
                  name="monthly_fixed_expenses"
                  type="number"
                  min="0"
                  step="1"
                  value={expenses}
                  onChange={e => setExpenses(Number(e.target.value))}
                  className="pl-8"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">₪</span>
              </div>
              <p className="text-xs text-muted-foreground">שכ&quot;ד, ציוד, מנויים...</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="working_days_per_month">ימי עבודה בחודש</Label>
              <Input
                id="working_days_per_month"
                name="working_days_per_month"
                type="number"
                min="1"
                max="31"
                step="1"
                value={days}
                onChange={e => setDays(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="hours_per_day">שעות עבודה ביום</Label>
              <Input
                id="hours_per_day"
                name="hours_per_day"
                type="number"
                min="1"
                max="24"
                step="0.5"
                value={hours}
                onChange={e => setHours(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/40 p-4">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">ערך שעה מחושב</p>
              <p className="text-xl font-semibold tabular-nums">{ils(derivedHourly)}</p>
              <p className="text-xs text-muted-foreground">
                {ils(salary)} ÷ {hoursPerMonth} שעות
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">הוצאות נלוות לשעה</p>
              <p className="text-xl font-semibold tabular-nums">{ils(derivedOverhead)}</p>
              <p className="text-xs text-muted-foreground">
                {ils(expenses)} ÷ {hoursPerMonth} שעות
              </p>
            </div>
          </div>

          <SubmitButton label="שמור" pendingLabel="שומר..." />
        </form>
      </CardContent>
    </Card>
  )
}

export function AccountSettingsForm({ email }: { email: string }) {
  const [state, action] = useFormState<ActionState | null, FormData>(changePassword, null)
  useToastOnResult(state)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          חשבון
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label>כתובת מייל</Label>
          <p className="text-sm text-muted-foreground" dir="ltr">{email}</p>
        </div>
        <form action={action} className="space-y-4 border-t pt-4">
          <p className="text-sm font-medium">שינוי סיסמה</p>
          <div className="space-y-1">
            <Label htmlFor="password">סיסמה חדשה</Label>
            <PasswordInput
              id="password"
              name="password"
              placeholder="לפחות 6 תווים"
              minLength={6}
            />
          </div>
          <SubmitButton label="עדכן סיסמה" pendingLabel="מעדכן..." />
        </form>
      </CardContent>
    </Card>
  )
}
