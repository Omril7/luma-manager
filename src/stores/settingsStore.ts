import { create } from 'zustand'

export interface Settings {
  id: string
  user_id: string
  vat_rate: number
  paycheck_percent: number
  opening_balance: number
  business_name: string | null
  gmail_user: string | null
  gmail_app_password: string | null
}

interface SettingsStore {
  settings: Settings | null
  setSettings: (s: Settings) => void
  clearSettings: () => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  setSettings: (s) => set({ settings: s }),
  clearSettings: () => set({ settings: null }),
}))
