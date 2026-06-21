import { create } from 'zustand'

export interface Settings {
  id: string
  user_id: string
  vat_rate: number
  paycheck_percent: number
  opening_balance: number
  business_name: string | null
  accountant_email: string | null
  monthly_salary_target: number | null
  monthly_fixed_expenses: number | null
  working_days_per_month: number | null
  hours_per_day: number | null
  default_hourly_rate: number | null
  default_overhead_per_hour: number | null
  fuel_price_per_liter: number | null
  km_per_liter: number | null
  yearly_maintenance_cost: number | null
  yearly_insurance_cost: number | null
  vehicle_value: number | null
  depreciation_rate_percent: number | null
  yearly_kilometers: number | null
  cost_per_km: number | null
  vat_report_frequency: string | null
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
