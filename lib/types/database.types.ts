export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          actor_id: string | null
          actor_role: string | null
          description: string
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          new_state: Json | null
          previous_state: Json | null
          request_id: string | null
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string | null
          description: string
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_state?: Json | null
          previous_state?: Json | null
          request_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_role?: string | null
          description?: string
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_state?: Json | null
          previous_state?: Json | null
          request_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dividends: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          investment_id: string
          paid_at: string | null
          payment_date: string
          project_id: string
          status: Database["public"]["Enums"]["dividend_status"]
          tokens_held: number
          transaction_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          investment_id: string
          paid_at?: string | null
          payment_date: string
          project_id: string
          status?: Database["public"]["Enums"]["dividend_status"]
          tokens_held: number
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          investment_id?: string
          paid_at?: string | null
          payment_date?: string
          project_id?: string
          status?: Database["public"]["Enums"]["dividend_status"]
          tokens_held?: number
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dividends_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dividends_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dividends_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dividends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      eligibility_states: {
        Row: {
          can_invest: boolean
          can_receive_dividends: boolean
          can_withdraw: boolean
          created_at: string
          id: string
          metadata: Json | null
          previous_status: string | null
          restricted_at: string | null
          restricted_until: string | null
          restriction_reason: string | null
          status: string
          status_changed_at: string
          status_changed_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          can_invest?: boolean
          can_receive_dividends?: boolean
          can_withdraw?: boolean
          created_at?: string
          id?: string
          metadata?: Json | null
          previous_status?: string | null
          restricted_at?: string | null
          restricted_until?: string | null
          restriction_reason?: string | null
          status?: string
          status_changed_at?: string
          status_changed_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          can_invest?: boolean
          can_receive_dividends?: boolean
          can_withdraw?: boolean
          created_at?: string
          id?: string
          metadata?: Json | null
          previous_status?: string | null
          restricted_at?: string | null
          restricted_until?: string | null
          restriction_reason?: string | null
          status?: string
          status_changed_at?: string
          status_changed_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eligibility_states_status_changed_by_fkey"
            columns: ["status_changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eligibility_states_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          amount: number
          approved_at: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          invested_at: string | null
          offering_id: string | null
          project_id: string
          rejected_at: string | null
          status: Database["public"]["Enums"]["investment_status_v2"]
          status_legacy: Database["public"]["Enums"]["investment_status"]
          token_price_at_purchase: number
          tokens_purchased: number
          transaction_hash: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          invested_at?: string | null
          offering_id?: string | null
          project_id: string
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["investment_status_v2"]
          status_legacy?: Database["public"]["Enums"]["investment_status"]
          token_price_at_purchase: number
          tokens_purchased: number
          transaction_hash?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          invested_at?: string | null
          offering_id?: string | null
          project_id?: string
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["investment_status_v2"]
          status_legacy?: Database["public"]["Enums"]["investment_status"]
          token_price_at_purchase?: number
          tokens_purchased?: number
          transaction_hash?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "offerings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_documents: {
        Row: {
          created_at: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_url: string
          id: string
          reviewed_at: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["kyc_status"]
          submitted_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_url: string
          id?: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          file_url?: string
          id?: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kyc_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_profiles: {
        Row: {
          approved_at: string | null
          created_at: string
          date_of_birth: string | null
          document_country: string | null
          document_number: string | null
          document_type: string | null
          expires_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          metadata: Json | null
          nationality: string | null
          provider: string
          provider_applicant_id: string | null
          rejected_at: string | null
          rejection_code: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          date_of_birth?: string | null
          document_country?: string | null
          document_number?: string | null
          document_type?: string | null
          expires_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          metadata?: Json | null
          nationality?: string | null
          provider?: string
          provider_applicant_id?: string | null
          rejected_at?: string | null
          rejection_code?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          date_of_birth?: string | null
          document_country?: string | null
          document_number?: string | null
          document_type?: string | null
          expires_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          metadata?: Json | null
          nationality?: string | null
          provider?: string
          provider_applicant_id?: string | null
          rejected_at?: string | null
          rejection_code?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kyc_profiles_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kyc_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          read: boolean | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offerings: {
        Row: {
          available_tokens: number
          chain_id: number | null
          contract_address: string | null
          created_at: string
          deployed_at: string | null
          id: string
          is_active: boolean
          is_closed: boolean
          metadata: Json | null
          offering_end_date: string
          offering_start_date: string
          project_id: string
          token_name: string
          token_price: number
          token_standard: string
          token_symbol: string
          total_tokens: number
          updated_at: string
        }
        Insert: {
          available_tokens: number
          chain_id?: number | null
          contract_address?: string | null
          created_at?: string
          deployed_at?: string | null
          id?: string
          is_active?: boolean
          is_closed?: boolean
          metadata?: Json | null
          offering_end_date: string
          offering_start_date: string
          project_id: string
          token_name: string
          token_price: number
          token_standard?: string
          token_symbol: string
          total_tokens: number
          updated_at?: string
        }
        Update: {
          available_tokens?: number
          chain_id?: number | null
          contract_address?: string | null
          created_at?: string
          deployed_at?: string | null
          id?: string
          is_active?: boolean
          is_closed?: boolean
          metadata?: Json | null
          offering_end_date?: string
          offering_start_date?: string
          project_id?: string
          token_name?: string
          token_price?: number
          token_standard?: string
          token_symbol?: string
          total_tokens?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offerings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_cycles: {
        Row: {
          amount_per_token: number
          calculated_at: string | null
          created_at: string
          distribution_block_number: number | null
          distribution_completed_at: string | null
          distribution_started_at: string | null
          distribution_tx_hash: string | null
          gold_price_at_calculation: number | null
          id: string
          metadata: Json | null
          name: string
          period_end: string
          period_start: string
          project_id: string
          scheduled_date: string
          status: string
          tokens_eligible: number
          total_amount: number
          total_gold_produced: number | null
          updated_at: string
        }
        Insert: {
          amount_per_token: number
          calculated_at?: string | null
          created_at?: string
          distribution_block_number?: number | null
          distribution_completed_at?: string | null
          distribution_started_at?: string | null
          distribution_tx_hash?: string | null
          gold_price_at_calculation?: number | null
          id?: string
          metadata?: Json | null
          name: string
          period_end: string
          period_start: string
          project_id: string
          scheduled_date: string
          status?: string
          tokens_eligible: number
          total_amount: number
          total_gold_produced?: number | null
          updated_at?: string
        }
        Update: {
          amount_per_token?: number
          calculated_at?: string | null
          created_at?: string
          distribution_block_number?: number | null
          distribution_completed_at?: string | null
          distribution_started_at?: string | null
          distribution_tx_hash?: string | null
          gold_price_at_calculation?: number | null
          id?: string
          metadata?: Json | null
          name?: string
          period_end?: string
          period_start?: string
          project_id?: string
          scheduled_date?: string
          status?: string
          tokens_eligible?: number
          total_amount?: number
          total_gold_produced?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_cycles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_records: {
        Row: {
          amount_due: number
          block_number: number | null
          calculated_at: string
          claimed_at: string | null
          created_at: string
          cycle_id: string
          id: string
          investment_id: string | null
          is_claimed: boolean
          metadata: Json | null
          paid_at: string | null
          payment_destination: string | null
          payment_method: string | null
          project_id: string
          status: string
          tokens_held: number
          tx_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_due: number
          block_number?: number | null
          calculated_at?: string
          claimed_at?: string | null
          created_at?: string
          cycle_id: string
          id?: string
          investment_id?: string | null
          is_claimed?: boolean
          metadata?: Json | null
          paid_at?: string | null
          payment_destination?: string | null
          payment_method?: string | null
          project_id: string
          status?: string
          tokens_held: number
          tx_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_due?: number
          block_number?: number | null
          calculated_at?: string
          claimed_at?: string | null
          created_at?: string
          cycle_id?: string
          id?: string
          investment_id?: string | null
          is_claimed?: boolean
          metadata?: Json | null
          paid_at?: string | null
          payment_destination?: string | null
          payment_method?: string | null
          project_id?: string
          status?: string
          tokens_held?: number
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_records_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "payout_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_records_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_positions: {
        Row: {
          average_token_price: number
          closed_at: string | null
          created_at: string
          id: string
          is_active: boolean
          metadata: Json | null
          project_id: string
          return_percentage: number
          total_dividends_pending: number
          total_dividends_received: number
          total_invested: number
          total_return: number
          total_tokens: number
          updated_at: string
          user_id: string
        }
        Insert: {
          average_token_price?: number
          closed_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          project_id: string
          return_percentage?: number
          total_dividends_pending?: number
          total_dividends_received?: number
          total_invested?: number
          total_return?: number
          total_tokens?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          average_token_price?: number
          closed_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          project_id?: string
          return_percentage?: number
          total_dividends_pending?: number
          total_dividends_received?: number
          total_invested?: number
          total_return?: number
          total_tokens?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_positions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_positions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string | null
          crypto_wallet_address: string | null
          crypto_wallet_connected_at: string | null
          crypto_wallet_type: string | null
          email: string
          first_name: string | null
          id: string
          investor_tier: string | null
          kyc_submitted_at: string | null
          kyc_verified: boolean | null
          last_name: string | null
          phone: string | null
          timezone: string | null
          updated_at: string | null
          wallet_verification_nonce: string | null
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          crypto_wallet_address?: string | null
          crypto_wallet_connected_at?: string | null
          crypto_wallet_type?: string | null
          email: string
          first_name?: string | null
          id: string
          investor_tier?: string | null
          kyc_submitted_at?: string | null
          kyc_verified?: boolean | null
          last_name?: string | null
          phone?: string | null
          timezone?: string | null
          updated_at?: string | null
          wallet_verification_nonce?: string | null
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          crypto_wallet_address?: string | null
          crypto_wallet_connected_at?: string | null
          crypto_wallet_type?: string | null
          email?: string
          first_name?: string | null
          id?: string
          investor_tier?: string | null
          kyc_submitted_at?: string | null
          kyc_verified?: boolean | null
          last_name?: string | null
          phone?: string | null
          timezone?: string | null
          updated_at?: string | null
          wallet_verification_nonce?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          actual_completion_date: string | null
          available_tokens: number
          blockchain_project_id: number | null
          blockchain_signature: string | null
          country: string
          created_at: string | null
          current_funding: number
          description: string | null
          documents: string[] | null
          expected_completion_date: string | null
          expected_return_percentage: number | null
          funding_goal: number
          id: string
          images: string[] | null
          latitude: number | null
          location: string
          longitude: number | null
          min_investment: number
          mint_address: string | null
          mint_authority_revoked: boolean | null
          name: string
          project_duration_months: number | null
          slug: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          token_price: number
          total_tokens: number
          updated_at: string | null
          video_url: string | null
          asset_type: Database["public"]["Enums"]["asset_type_enum"] | null
          round_limit_tokens: number | null
          current_round_issued: number | null
          distribution_cadence: number | null
          token_decimals: number | null
          is_paused: boolean | null
          is_active: boolean | null
          accepted_stablecoin: string | null
          treasury_wallet: string | null
        }
        Insert: {
          actual_completion_date?: string | null
          available_tokens: number
          blockchain_project_id?: number | null
          blockchain_signature?: string | null
          country: string
          created_at?: string | null
          current_funding?: number
          description?: string | null
          documents?: string[] | null
          expected_completion_date?: string | null
          expected_return_percentage?: number | null
          funding_goal: number
          id?: string
          images?: string[] | null
          latitude?: number | null
          location: string
          longitude?: number | null
          min_investment?: number
          mint_address?: string | null
          mint_authority_revoked?: boolean | null
          name: string
          project_duration_months?: number | null
          slug: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          token_price: number
          total_tokens: number
          updated_at?: string | null
          video_url?: string | null
          asset_type?: Database["public"]["Enums"]["asset_type_enum"] | null
          round_limit_tokens?: number | null
          current_round_issued?: number | null
          distribution_cadence?: number | null
          token_decimals?: number | null
          is_paused?: boolean | null
          is_active?: boolean | null
          accepted_stablecoin?: string | null
          treasury_wallet?: string | null
        }
        Update: {
          actual_completion_date?: string | null
          available_tokens?: number
          blockchain_project_id?: number | null
          blockchain_signature?: string | null
          country?: string
          created_at?: string | null
          current_funding?: number
          description?: string | null
          documents?: string[] | null
          expected_completion_date?: string | null
          expected_return_percentage?: number | null
          funding_goal?: number
          id?: string
          images?: string[] | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          min_investment?: number
          mint_address?: string | null
          mint_authority_revoked?: boolean | null
          name?: string
          project_duration_months?: number | null
          slug?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          token_price?: number
          total_tokens?: number
          updated_at?: string | null
          video_url?: string | null
          asset_type?: Database["public"]["Enums"]["asset_type_enum"] | null
          round_limit_tokens?: number | null
          current_round_issued?: number | null
          distribution_cadence?: number | null
          token_decimals?: number | null
          is_paused?: boolean | null
          is_active?: boolean | null
          accepted_stablecoin?: string | null
          treasury_wallet?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          blockchain_confirmed: boolean | null
          blockchain_hash: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          failed_at: string | null
          id: string
          initiated_at: string | null
          investment_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_processor_data: Json | null
          payment_processor_id: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          blockchain_confirmed?: boolean | null
          blockchain_hash?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          failed_at?: string | null
          id?: string
          initiated_at?: string | null
          investment_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_processor_data?: Json | null
          payment_processor_id?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          blockchain_confirmed?: boolean | null
          blockchain_hash?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          failed_at?: string | null
          id?: string
          initiated_at?: string | null
          investment_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_processor_data?: Json | null
          payment_processor_id?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          granted_at: string
          granted_by: string | null
          id: string
          revoked_at: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          revoked_at?: string | null
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          revoked_at?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_links: {
        Row: {
          chain_id: number
          connected_at: string
          created_at: string
          disconnected_at: string | null
          id: string
          is_active: boolean
          last_connected_at: string | null
          metadata: Json | null
          updated_at: string
          user_id: string
          verification_nonce: string | null
          verification_signature: string | null
          verified: boolean
          verified_at: string | null
          wallet_address: string
          wallet_type: string | null
        }
        Insert: {
          chain_id: number
          connected_at?: string
          created_at?: string
          disconnected_at?: string | null
          id?: string
          is_active?: boolean
          last_connected_at?: string | null
          metadata?: Json | null
          updated_at?: string
          user_id: string
          verification_nonce?: string | null
          verification_signature?: string | null
          verified?: boolean
          verified_at?: string | null
          wallet_address: string
          wallet_type?: string | null
        }
        Update: {
          chain_id?: number
          connected_at?: string
          created_at?: string
          disconnected_at?: string | null
          id?: string
          is_active?: boolean
          last_connected_at?: string | null
          metadata?: Json | null
          updated_at?: string
          user_id?: string
          verification_nonce?: string | null
          verification_signature?: string | null
          verified?: boolean
          verified_at?: string | null
          wallet_address?: string
          wallet_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string | null
          gold_tokens: number
          id: string
          updated_at: string | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          balance?: number
          created_at?: string | null
          gold_tokens?: number
          id?: string
          updated_at?: string | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          balance?: number
          created_at?: string | null
          gold_tokens?: number
          id?: string
          updated_at?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_audit_log: {
        Args: {
          p_actor_id?: string
          p_actor_role?: string
          p_description: string
          p_event_type: string
          p_metadata?: Json
          p_new_state?: Json
          p_previous_state?: Json
          p_user_id: string
        }
        Returns: string
      }
      has_role: {
        Args: { check_role: string; check_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      dividend_status: "pending" | "processing" | "paid" | "failed"
      document_type:
        | "passport"
        | "drivers_license"
        | "national_id"
        | "proof_of_address"
        | "selfie"
      investment_status: "pending" | "completed" | "cancelled" | "refunded"
      investment_status_v2: "pending" | "approved" | "rejected"
      kyc_status: "pending" | "under_review" | "approved" | "rejected"
      notification_type:
        | "investment"
        | "dividend"
        | "project_update"
        | "kyc"
        | "system"
        | "security"
      payment_method:
        | "credit_card"
        | "bank_transfer"
        | "cryptocurrency"
        | "wallet_balance"
      project_status:
        | "draft"
        | "funding"
        | "funded"
        | "active"
        | "completed"
        | "cancelled"
        | "canceled"
      asset_type_enum: "real_estate" | "mining" | "other"
      transaction_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
      transaction_type:
        | "deposit"
        | "withdrawal"
        | "investment"
        | "dividend"
        | "refund"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      dividend_status: ["pending", "processing", "paid", "failed"],
      document_type: [
        "passport",
        "drivers_license",
        "national_id",
        "proof_of_address",
        "selfie",
      ],
      investment_status: ["pending", "completed", "cancelled", "refunded"],
      investment_status_v2: ["pending", "approved", "rejected"],
      kyc_status: ["pending", "under_review", "approved", "rejected"],
      notification_type: [
        "investment",
        "dividend",
        "project_update",
        "kyc",
        "system",
        "security",
      ],
      payment_method: [
        "credit_card",
        "bank_transfer",
        "cryptocurrency",
        "wallet_balance",
      ],
      project_status: [
        "draft",
        "funding",
        "funded",
        "active",
        "completed",
        "cancelled",
        "canceled",
      ],
      asset_type_enum: ["real_estate", "mining", "other"],
      transaction_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
      ],
      transaction_type: [
        "deposit",
        "withdrawal",
        "investment",
        "dividend",
        "refund",
      ],
    },
  },
} as const
