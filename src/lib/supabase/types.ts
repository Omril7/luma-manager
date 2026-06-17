// Auto-generated types — do not edit manually.
// Run: npx supabase gen types typescript --local > src/lib/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      material_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          id: string
          user_id: string
          category_id: string
          name: string
          unit: string
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          name: string
          unit: string
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          name?: string
          unit?: string
          price?: number
          created_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          user_id: string
          vat_rate: number
          paycheck_percent: number
          opening_balance: number
          business_name: string | null
          accountant_email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          vat_rate?: number
          paycheck_percent?: number
          opening_balance?: number
          business_name?: string | null
          accountant_email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          vat_rate?: number
          paycheck_percent?: number
          opening_balance?: number
          business_name?: string | null
          accountant_email?: string | null
          created_at?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          is_vat_recognized: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          is_vat_recognized?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          is_vat_recognized?: boolean
          created_at?: string
        }
        Relationships: []
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
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          description: string
          total_amount: number
          transaction_date: string
          is_recurring?: boolean
          installments_total?: number
          is_personal?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string | null
          description?: string
          total_amount?: number
          transaction_date?: string
          is_recurring?: boolean
          installments_total?: number
          is_personal?: boolean
          notes?: string | null
          created_at?: string
        }
        Relationships: []
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
        Insert: {
          id?: string
          expense_id: string
          user_id: string
          installment_number: number
          due_month: string
          amount: number
          vat_amount?: number
        }
        Update: {
          id?: string
          expense_id?: string
          user_id?: string
          installment_number?: number
          due_month?: string
          amount?: number
          vat_amount?: number
        }
        Relationships: []
      }
      receipts: {
        Row: {
          id: string
          expense_id: string
          user_id: string
          cloudinary_public_id: string | null
          cloudinary_url: string | null
          file_type: string | null
          created_at: string
          cleaned_up_at: string | null
          installment_id: string | null
        }
        Insert: {
          id?: string
          expense_id: string
          user_id: string
          cloudinary_public_id: string
          cloudinary_url: string
          file_type?: string | null
          created_at?: string
          cleaned_up_at?: string | null
          installment_id?: string | null
        }
        Update: {
          id?: string
          expense_id?: string
          user_id?: string
          cloudinary_public_id?: string | null
          cloudinary_url?: string | null
          file_type?: string | null
          created_at?: string
          cleaned_up_at?: string | null
          installment_id?: string | null
        }
        Relationships: []
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
          delivery_amount: number
          income_date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          source?: string
          order_id?: string | null
          product_id?: string | null
          product_name: string
          original_price: number
          discount_amount?: number
          final_price: number
          delivery_amount?: number
          income_date: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          source?: string
          order_id?: string | null
          product_id?: string | null
          product_name?: string
          original_price?: number
          discount_amount?: number
          final_price?: number
          delivery_amount?: number
          income_date?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: []
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
        Insert: {
          id?: string
          user_id: string
          external_id?: string | null
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          external_id?: string | null
          name?: string
          description?: string | null
          created_at?: string
        }
        Relationships: []
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
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          start_time: string
          end_time?: string | null
          is_all_day?: boolean
          recurrence_rule?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string | null
          is_all_day?: boolean
          recurrence_rule?: string | null
          created_at?: string
        }
        Relationships: []
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
        Insert: {
          id?: string
          user_id: string
          name: string
          hourly_rate?: number
          time_hours?: number
          overhead_per_hour?: number
          profit_type?: string
          profit_value?: number
          suggested_price?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          hourly_rate?: number
          time_hours?: number
          overhead_per_hour?: number
          profit_type?: string
          profit_value?: number
          suggested_price?: number | null
          created_at?: string
        }
        Relationships: []
      }
      pricing_parts: {
        Row: {
          id: string
          pricing_id: string
          user_id: string
          name: string
          price: number
        }
        Insert: {
          id?: string
          pricing_id: string
          user_id: string
          name: string
          price: number
        }
        Update: {
          id?: string
          pricing_id?: string
          user_id?: string
          name?: string
          price?: number
        }
        Relationships: []
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
        Insert: {
          id?: string
          user_id: string
          type: string
          amount: number
          payment_month: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          amount?: number
          payment_month?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: []
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
        Insert: {
          id?: string
          user_id: string
          snapshot_month: string
          opening_balance: number
          closing_balance: number
          approved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          snapshot_month?: string
          opening_balance?: number
          closing_balance?: number
          approved_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
