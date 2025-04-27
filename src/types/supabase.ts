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
      users: {
        Row: {
          id: string
          created_at: string
          full_name: string
          email: string
          phone: string
          id_proof_url: string | null
          company_id: string
          role: 'super_admin' | 'admin' | 'employee'
        }
        Insert: {
          id?: string
          created_at?: string
          full_name: string
          email: string
          phone: string
          id_proof_url?: string | null
          company_id: string
          role: 'super_admin' | 'admin' | 'employee'
        }
        Update: {
          id?: string
          created_at?: string
          full_name?: string
          email?: string
          phone?: string
          id_proof_url?: string | null
          company_id?: string
          role?: 'super_admin' | 'admin' | 'employee'
        }
      }
      companies: {
        Row: {
          id: string
          created_at: string
          name: string
          admin_id: string
          credits: number
          seat_price: number
          seat_booking_limit: number
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          admin_id: string
          credits?: number
          seat_price?: number
          seat_booking_limit?: number
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          admin_id?: string
          credits?: number
          seat_price?: number
          seat_booking_limit?: number
        }
      }
      attendance: {
        Row: {
          id: string
          created_at: string
          user_id: string
          company_id: string
          date: string
          status: 'present' | 'absent'
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          company_id: string
          date: string
          status: 'present' | 'absent'
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          company_id?: string
          date?: string
          status?: 'present' | 'absent'
        }
      }
      credit_history: {
        Row: {
          id: string
          created_at: string
          company_id: string
          amount: number
          action: 'assigned' | 'used'
          description: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          company_id: string
          amount: number
          action: 'assigned' | 'used'
          description?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          company_id?: string
          amount?: number
          action?: 'assigned' | 'used'
          description?: string | null
        }
      }
      seat_bookings: {
        Row: {
          id: string
          created_at: string
          company_id: string
          user_id: string
          date: string
          status: 'confirmed' | 'cancelled'
        }
        Insert: {
          id?: string
          created_at?: string
          company_id: string
          user_id: string
          date: string
          status: 'confirmed' | 'cancelled'
        }
        Update: {
          id?: string
          created_at?: string
          company_id?: string
          user_id?: string
          date?: string
          status?: 'confirmed' | 'cancelled'
        }
      }
    }
  }
}