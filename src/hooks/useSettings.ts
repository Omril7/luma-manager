'use client'

import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { createClient } from '@/lib/supabase/client'

export function useSettings() {
  const { settings, setSettings } = useSettingsStore()

  useEffect(() => {
    if (settings) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setSettings(data)
        })
    })
  }, [settings, setSettings])

  return settings
}
