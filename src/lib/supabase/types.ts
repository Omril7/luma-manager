// Auto-generated types — do not edit manually.
// Run: npx supabase gen types typescript --local > src/lib/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      settings: {
        Row: {
          id: string
          user_id: string
          vat_rate: number
          paycheck_percent: number
          opening_balance: number
          business_name: string | null
          gmail_user: string | null
          gmail_app_password: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['settings']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['settings']['Insert']>
      }
      expense_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          is_vat_recognized: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['expense_categories']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['expense_categories']['Insert']>
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          description: string
          total_amount: number
          transaction_date: string
          is_recurring: boolean
          installments_total: number
          is_personal: boolean
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>
      }
      expense_installments: {
        Row: {
          id: string
          expense_id: string
          user_id: string
          installment_number: number
          due_month: string
          amount: number
          vat_amount: number
        }
        Insert: Omit<Database['public']['Tables']['expense_installments']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['expense_installments']['Insert']>
      }
      receipts: {
        Row: {
          id: string
          expense_id: string
          user_id: string
          cloudinary_public_id: string
          cloudinary_url: string
          file_type: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['receipts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['receipts']['Insert']>
      }
      income: {
        Row: {
          id: string
          user_id: string
          source: string
          order_id: string | null
          product_id: string | null
          product_name: string
          original_price: number
          discount_amount: number
          final_price: number
          payment_on_delivery: boolean
          income_date: string
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['income']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['income']['Insert']>
      }
      products: {
        Row: {
          id: string
          user_id: string
          external_id: string | null
          name: string
          description: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      calendar_events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          start_time: string
          end_time: string | null
          is_all_day: boolean
          recurrence_rule: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['calendar_events']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['calendar_events']['Insert']>
      }
      product_pricings: {
        Row: {
          id: string
          user_id: string
          name: string
          hourly_rate: number
          time_hours: number
          overhead_per_hour: number
          profit_type: string
          profit_value: number
          suggested_price: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['product_pricings']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['product_pricings']['Insert']>
      }
      pricing_parts: {
        Row: {
          id: string
          pricing_id: string
          user_id: string
          name: string
          price: number
        }
        Insert: Omit<Database['public']['Tables']['pricing_parts']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['pricing_parts']['Insert']>
      }
      authority_payments: {
        Row: {
          id: string
          user_id: string
          type: string
          amount: number
          payment_month: string
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['authority_payments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['authority_payments']['Insert']>
      }
      balance_snapshots: {
        Row: {
          id: string
          user_id: string
          snapshot_month: string
          opening_balance: number
          closing_balance: number
          approved_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['balance_snapshots']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['balance_snapshots']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
