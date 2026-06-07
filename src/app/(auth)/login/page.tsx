'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email('כתובת מייל לא תקינה'),
  password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [passkeyLoading, setPasskeyLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      toast.error('שגיאה בכניסה: ' + error.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  async function signInWithPasskey() {
    setPasskeyLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPasskey()
    if (error) {
      toast.error('שגיאה בכניסה עם מפתח גישה: ' + error.message)
      setPasskeyLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">כניסה למערכת</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={signInWithPasskey}
            disabled={passkeyLoading}
          >
            <PasskeyIcon />
            {passkeyLoading ? 'מאמת...' : 'כניסה עם מפתח גישה (Passkey)'}
          </Button>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">או</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">כתובת מייל</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">סיסמה</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'מתחבר...' : 'כניסה עם מייל וסיסמה'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600">
            אין לך חשבון?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              הרשמה
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function PasskeyIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="8" cy="8" r="4" />
      <path d="M16 19h6M19 16v6M12.5 15.5L15 13l3 3" />
      <path d="M2 20c0-2.2 2.7-4 6-4" />
    </svg>
  )
}
