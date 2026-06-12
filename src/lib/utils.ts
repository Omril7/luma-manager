import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatILS(amount: number, decimals = 0): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'dd/MM/yyyy', { locale: he })
}

export function formatMonthYear(dateStr: string): string {
  return format(new Date(dateStr), 'MMMM yyyy', { locale: he })
}

export function startOfMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`
}
