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
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          email: string
          phone: string | null
          country: string | null
          timezone: string | null
          avatar_url: string | null
          kyc_verified: boolean
          kyc_submitted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          email: string
          phone?: string | null
          country?: string | null
          timezone?: string | null
          avatar_url?: string | null
          kyc_verified?: boolean
          kyc_submitted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string
          phone?: string | null
          country?: string | null
          timezone?: string | null
          avatar_url?: string | null
          kyc_verified?: boolean
          kyc_submitted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          gold_tokens: number
          wallet_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          gold_tokens?: number
          wallet_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          gold_tokens?: number
          wallet_address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          location: string
          country: string
          latitude: number | null
          longitude: number | null
          funding_goal: number
          current_funding: number
          min_investment: number
          token_price: number
          total_tokens: number
          available_tokens: number
          expected_return_percentage: number | null
          project_duration_months: number | null
          start_date: string | null
          expected_completion_date: string | null
          actual_completion_date: string | null
          status: 'draft' | 'funding' | 'funded' | 'active' | 'completed' | 'cancelled'
          images: string[] | null
          documents: string[] | null
          video_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          location: string
          country: string
          latitude?: number | null
          longitude?: number | null
          funding_goal: number
          current_funding?: number
          min_investment?: number
          token_price: number
          total_tokens: number
          available_tokens: number
          expected_return_percentage?: number | null
          project_duration_months?: number | null
          start_date?: string | null
          expected_completion_date?: string | null
          actual_completion_date?: string | null
          status?: 'draft' | 'funding' | 'funded' | 'active' | 'completed' | 'cancelled'
          images?: string[] | null
          documents?: string[] | null
          video_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          location?: string
          country?: string
          latitude?: number | null
          longitude?: number | null
          funding_goal?: number
          current_funding?: number
          min_investment?: number
          token_price?: number
          total_tokens?: number
          available_tokens?: number
          expected_return_percentage?: number | null
          project_duration_months?: number | null
          start_date?: string | null
          expected_completion_date?: string | null
          actual_completion_date?: string | null
          status?: 'draft' | 'funding' | 'funded' | 'active' | 'completed' | 'cancelled'
          images?: string[] | null
          documents?: string[] | null
          video_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      investments: {
        Row: {
          id: string
          user_id: string
          project_id: string
          amount: number
          tokens_purchased: number
          token_price_at_purchase: number
          status: 'pending' | 'completed' | 'cancelled' | 'refunded'
          transaction_hash: string | null
          invested_at: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          amount: number
          tokens_purchased: number
          token_price_at_purchase: number
          status?: 'pending' | 'completed' | 'cancelled' | 'refunded'
          transaction_hash?: string | null
          invested_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          amount?: number
          tokens_purchased?: number
          token_price_at_purchase?: number
          status?: 'pending' | 'completed' | 'cancelled' | 'refunded'
          transaction_hash?: string | null
          invested_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          investment_id: string | null
          type: 'deposit' | 'withdrawal' | 'investment' | 'dividend' | 'refund'
          amount: number
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          payment_method: 'credit_card' | 'bank_transfer' | 'cryptocurrency' | 'wallet_balance' | null
          description: string | null
          blockchain_hash: string | null
          blockchain_confirmed: boolean
          payment_processor_id: string | null
          payment_processor_data: Json | null
          initiated_at: string
          completed_at: string | null
          failed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          investment_id?: string | null
          type: 'deposit' | 'withdrawal' | 'investment' | 'dividend' | 'refund'
          amount: number
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          payment_method?: 'credit_card' | 'bank_transfer' | 'cryptocurrency' | 'wallet_balance' | null
          description?: string | null
          blockchain_hash?: string | null
          blockchain_confirmed?: boolean
          payment_processor_id?: string | null
          payment_processor_data?: Json | null
          initiated_at?: string
          completed_at?: string | null
          failed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          investment_id?: string | null
          type?: 'deposit' | 'withdrawal' | 'investment' | 'dividend' | 'refund'
          amount?: number
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          payment_method?: 'credit_card' | 'bank_transfer' | 'cryptocurrency' | 'wallet_balance' | null
          description?: string | null
          blockchain_hash?: string | null
          blockchain_confirmed?: boolean
          payment_processor_id?: string | null
          payment_processor_data?: Json | null
          initiated_at?: string
          completed_at?: string | null
          failed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      dividends: {
        Row: {
          id: string
          project_id: string
          user_id: string
          investment_id: string
          amount: number
          tokens_held: number
          status: 'pending' | 'processing' | 'paid' | 'failed'
          payment_date: string
          paid_at: string | null
          transaction_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          investment_id: string
          amount: number
          tokens_held: number
          status?: 'pending' | 'processing' | 'paid' | 'failed'
          payment_date: string
          paid_at?: string | null
          transaction_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          investment_id?: string
          amount?: number
          tokens_held?: number
          status?: 'pending' | 'processing' | 'paid' | 'failed'
          payment_date?: string
          paid_at?: string | null
          transaction_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'investment' | 'dividend' | 'project_update' | 'kyc' | 'system' | 'security'
          title: string
          message: string
          read: boolean
          read_at: string | null
          link: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'investment' | 'dividend' | 'project_update' | 'kyc' | 'system' | 'security'
          title: string
          message: string
          read?: boolean
          read_at?: string | null
          link?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'investment' | 'dividend' | 'project_update' | 'kyc' | 'system' | 'security'
          title?: string
          message?: string
          read?: boolean
          read_at?: string | null
          link?: string | null
          created_at?: string
        }
      }
    }
  }
}
