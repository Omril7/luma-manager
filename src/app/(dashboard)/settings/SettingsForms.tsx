'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { saveGeneralSettings, saveBalanceSettings, saveEmailSettings, changePassword } from './actions'
import type { Settings } from '@/stores/settingsStore'
import { toast } from 'sonner'
import { useEffect } from 'react'

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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">כללי</CardTitle>
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
              <Label htmlFor="vat_rate">שיעור מע&quot;מ (%)</Label>
              <Input
                id="vat_rate"
                name="vat_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                defaultValue={settings?.vat_rate ?? 18}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="paycheck_percent">אחוז משכורת מהרווח (%)</Label>
              <Input
                id="paycheck_percent"
                name="paycheck_percent"
                type="number"
                step="0.01"
                min="0"
                max="100"
                defaultValue={settings?.paycheck_percent ?? 30}
              />
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">עובר ושב</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="opening_balance">יתרת פתיחה (₪)</Label>
            <Input
              id="opening_balance"
              name="opening_balance"
              type="number"
              step="0.01"
              defaultValue={settings?.opening_balance ?? 0}
            />
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">מייל</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="gmail_user">כתובת Gmail</Label>
            <Input
              id="gmail_user"
              name="gmail_user"
              type="email"
              defaultValue={settings?.gmail_user ?? ''}
              placeholder="your@gmail.com"
              dir="ltr"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="gmail_app_password">סיסמת אפליקציה (App Password)</Label>
            <Input
              id="gmail_app_password"
              name="gmail_app_password"
              type="password"
              defaultValue={settings?.gmail_app_password ?? ''}
              placeholder="xxxx xxxx xxxx xxxx"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              נוצר ב-Google Account → אבטחה → סיסמאות אפליקציה
            </p>
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">חשבון</CardTitle>
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
            <Input
              id="password"
              name="password"
              type="password"
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
