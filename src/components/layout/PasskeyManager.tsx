'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Passkey {
  id: string
  friendly_name?: string
  created_at: string
}

export function PasskeyManager() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)

  async function loadPasskeys() {
    const supabase = createClient()
    const { data, error } = await supabase.auth.passkey.list()
    if (!error && data) setPasskeys(data as Passkey[])
    setLoading(false)
  }

  useEffect(() => { loadPasskeys() }, [])

  async function registerPasskey() {
    setRegistering(true)
    const supabase = createClient()
    const { error } = await supabase.auth.registerPasskey()
    if (error) {
      toast.error('שגיאה ברישום מפתח גישה: ' + error.message)
    } else {
      toast.success('מפתח גישה נרשם בהצלחה')
      await loadPasskeys()
    }
    setRegistering(false)
  }

  async function deletePasskey(passkeyId: string) {
    const supabase = createClient()
    const { error } = await supabase.auth.passkey.delete({ passkeyId })
    if (error) {
      toast.error('שגיאה במחיקת מפתח גישה: ' + error.message)
    } else {
      toast.success('מפתח גישה נמחק')
      setPasskeys(prev => prev.filter(p => p.id !== passkeyId))
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">טוען...</p>

  return (
    <div className="space-y-3">
      {passkeys.length === 0 ? (
        <p className="text-sm text-muted-foreground">אין מפתחות גישה רשומים</p>
      ) : (
        <ul className="space-y-2">
          {passkeys.map(pk => (
            <li key={pk.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span className="text-gray-700">
                {pk.friendly_name || 'מפתח גישה'}
                <span className="mr-2 text-xs text-muted-foreground">
                  {new Date(pk.created_at).toLocaleDateString('he-IL')}
                </span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700"
                onClick={() => deletePasskey(pk.id)}
              >
                מחק
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={registerPasskey}
        disabled={registering}
      >
        {registering ? 'רושם...' : '+ הוסף מפתח גישה'}
      </Button>
    </div>
  )
}
