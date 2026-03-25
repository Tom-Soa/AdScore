import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      analyses: {
        Row: {
          id: string
          created_at: string
          script_preview: string
          platform: string
          score: number
          niveau: string
          resume: string
          result_json: string
          status: 'pending' | 'approved' | 'rejected'
          feedback_reason: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          script_preview: string
          platform: string
          score: number
          niveau: string
          resume: string
          result_json: string
          status?: 'pending' | 'approved' | 'rejected'
          feedback_reason?: string | null
          user_id?: string | null
        }
        Update: {
          status?: 'pending' | 'approved' | 'rejected'
          feedback_reason?: string | null
        }
      }
    }
  }
}
