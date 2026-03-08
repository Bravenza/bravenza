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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      abandoned_carts: {
        Row: {
          cart_snapshot: Json
          cart_total: number
          checkout_started_at: string
          created_at: string
          id: string
          item_count: number
          recovered_at: string | null
          recovery_email_opened_at: string | null
          recovery_email_sent_at: string | null
          status: string
          updated_at: string
          user_cpf: string
        }
        Insert: {
          cart_snapshot?: Json
          cart_total?: number
          checkout_started_at?: string
          created_at?: string
          id?: string
          item_count?: number
          recovered_at?: string | null
          recovery_email_opened_at?: string | null
          recovery_email_sent_at?: string | null
          status?: string
          updated_at?: string
          user_cpf: string
        }
        Update: {
          cart_snapshot?: Json
          cart_total?: number
          checkout_started_at?: string
          created_at?: string
          id?: string
          item_count?: number
          recovered_at?: string | null
          recovery_email_opened_at?: string | null
          recovery_email_sent_at?: string | null
          status?: string
          updated_at?: string
          user_cpf?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string
          description: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          description: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_profiles: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          full_name: string
          id: string
          must_change_password: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          full_name: string
          id?: string
          must_change_password?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          full_name?: string
          id?: string
          must_change_password?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          channels: string
          cooldown_until: string | null
          created_at: string
          id: string
          is_active: boolean
          owner_id: string
          product_id: string
          target_price: number | null
          target_size: string | null
        }
        Insert: {
          channels?: string
          cooldown_until?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          owner_id: string
          product_id: string
          target_price?: number | null
          target_size?: string | null
        }
        Update: {
          channels?: string
          cooldown_until?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          owner_id?: string
          product_id?: string
          target_price?: number | null
          target_size?: string | null
        }
        Relationships: []
      }
      app_config: {
        Row: {
          created_at: string | null
          key: string
          value: string
        }
        Insert: {
          created_at?: string | null
          key: string
          value: string
        }
        Update: {
          created_at?: string | null
          key?: string
          value?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      client_addresses: {
        Row: {
          cep: string
          city: string
          complement: string | null
          created_at: string
          id: string
          is_default: boolean
          label: string
          neighborhood: string
          number: string
          state: string
          street: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cep: string
          city: string
          complement?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          neighborhood: string
          number: string
          state: string
          street: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cep?: string
          city?: string
          complement?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          neighborhood?: string
          number?: string
          state?: string
          street?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_auth_tokens: {
        Row: {
          cpf: string
          created_at: string
          expires_at: string
          failed_attempts: number
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          cpf: string
          created_at?: string
          expires_at: string
          failed_attempts?: number
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          cpf?: string
          created_at?: string
          expires_at?: string
          failed_attempts?: number
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      client_documents: {
        Row: {
          client_cpf: string
          document_name: string
          document_type: string
          file_size: number | null
          file_url: string
          generated_at: string
          id: string
          order_id: string | null
        }
        Insert: {
          client_cpf: string
          document_name: string
          document_type: string
          file_size?: number | null
          file_url: string
          generated_at?: string
          id?: string
          order_id?: string | null
        }
        Update: {
          client_cpf?: string
          document_name?: string
          document_type?: string
          file_size?: number | null
          file_url?: string
          generated_at?: string
          id?: string
          order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
        ]
      }
      client_preferences: {
        Row: {
          client_cpf: string
          created_at: string
          favorite_brands: string[] | null
          id: string
          notification_email: boolean | null
          notification_prefs: Json
          notification_push: boolean | null
          notification_whatsapp: boolean | null
          preferred_colors: string[] | null
          preferred_sizes: string[] | null
          updated_at: string
        }
        Insert: {
          client_cpf: string
          created_at?: string
          favorite_brands?: string[] | null
          id?: string
          notification_email?: boolean | null
          notification_prefs?: Json
          notification_push?: boolean | null
          notification_whatsapp?: boolean | null
          preferred_colors?: string[] | null
          preferred_sizes?: string[] | null
          updated_at?: string
        }
        Update: {
          client_cpf?: string
          created_at?: string
          favorite_brands?: string[] | null
          id?: string
          notification_email?: boolean | null
          notification_prefs?: Json
          notification_push?: boolean | null
          notification_whatsapp?: boolean | null
          preferred_colors?: string[] | null
          preferred_sizes?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      client_profiles: {
        Row: {
          anonymized: boolean
          avatar_url: string | null
          cpf: string
          created_at: string | null
          full_name: string
          id: string
          phone: string | null
          privacy_consent_at: string | null
          privacy_consent_version: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          anonymized?: boolean
          avatar_url?: string | null
          cpf: string
          created_at?: string | null
          full_name: string
          id?: string
          phone?: string | null
          privacy_consent_at?: string | null
          privacy_consent_version?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          anonymized?: boolean
          avatar_url?: string | null
          cpf?: string
          created_at?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          privacy_consent_at?: string | null
          privacy_consent_version?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      client_sessions: {
        Row: {
          cpf: string
          created_at: string
          expires_at: string
          id: string
          session_token: string
        }
        Insert: {
          cpf: string
          created_at?: string
          expires_at: string
          id?: string
          session_token: string
        }
        Update: {
          cpf?: string
          created_at?: string
          expires_at?: string
          id?: string
          session_token?: string
        }
        Relationships: []
      }
      closet_items: {
        Row: {
          acquired_from: string
          buy_date: string | null
          buy_price: number | null
          condition: string | null
          created_at: string
          id: string
          market_value_current: number | null
          market_value_last_update_at: string | null
          owner_id: string
          product_id: string
          size: string | null
          source_order_id: string | null
        }
        Insert: {
          acquired_from?: string
          buy_date?: string | null
          buy_price?: number | null
          condition?: string | null
          created_at?: string
          id?: string
          market_value_current?: number | null
          market_value_last_update_at?: string | null
          owner_id: string
          product_id: string
          size?: string | null
          source_order_id?: string | null
        }
        Update: {
          acquired_from?: string
          buy_date?: string | null
          buy_price?: number | null
          condition?: string | null
          created_at?: string
          id?: string
          market_value_current?: number | null
          market_value_last_update_at?: string | null
          owner_id?: string
          product_id?: string
          size?: string | null
          source_order_id?: string | null
        }
        Relationships: []
      }
      cron_execution_logs: {
        Row: {
          duration_ms: number | null
          error_message: string | null
          finished_at: string | null
          id: string
          job_name: string
          result: Json | null
          started_at: string
          status: string
        }
        Insert: {
          duration_ms?: number | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_name: string
          result?: Json | null
          started_at?: string
          status?: string
        }
        Update: {
          duration_ms?: number | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_name?: string
          result?: Json | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_active: boolean | null
          order_index: number | null
          persona: string | null
          question: string
          search_vector: unknown
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          answer: string
          category: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          persona?: string | null
          question: string
          search_vector?: unknown
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          persona?: string | null
          question?: string
          search_vector?: unknown
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      favorite_list_items: {
        Row: {
          created_at: string
          id: string
          list_id: string
          listing_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          list_id: string
          listing_id: string
        }
        Update: {
          created_at?: string
          id?: string
          list_id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "favorite_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_lists: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      featured_models: {
        Row: {
          brand: string
          created_at: string
          id: string
          image_url: string
          is_active: boolean | null
          name: string
          order_index: number | null
          updated_at: string
        }
        Insert: {
          brand: string
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
          updated_at?: string
        }
        Update: {
          brand?: string
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      idempotency_keys: {
        Row: {
          cached_result: Json | null
          created_at: string
          expires_at: string
          id: string
          key: string
          status: string
        }
        Insert: {
          cached_result?: Json | null
          created_at?: string
          expires_at: string
          id?: string
          key: string
          status?: string
        }
        Update: {
          cached_result?: Json | null
          created_at?: string
          expires_at?: string
          id?: string
          key?: string
          status?: string
        }
        Relationships: []
      }
      marketplace_activity_feed: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          listing_id: string | null
          metadata: Json | null
          product_id: string | null
          seller_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          listing_id?: string | null
          metadata?: Json | null
          product_id?: string | null
          seller_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          listing_id?: string | null
          metadata?: Json | null
          product_id?: string | null
          seller_id?: string | null
          title?: string
        }
        Relationships: []
      }
      marketplace_autocut_rules: {
        Row: {
          created_at: string
          cuts_count: number
          id: string
          interval_hours: number
          is_active: boolean
          last_cut_at: string | null
          min_price: number
          offer_id: string
          reduction_amount: number
          reduction_type: string
          seller_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cuts_count?: number
          id?: string
          interval_hours?: number
          is_active?: boolean
          last_cut_at?: string | null
          min_price: number
          offer_id: string
          reduction_amount?: number
          reduction_type?: string
          seller_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cuts_count?: number
          id?: string
          interval_hours?: number
          is_active?: boolean
          last_cut_at?: string | null
          min_price?: number
          offer_id?: string
          reduction_amount?: number
          reduction_type?: string
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_autocut_rules_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: true
            referencedRelation: "marketplace_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_autocut_rules_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: true
            referencedRelation: "marketplace_offers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_autocut_rules_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "vault_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_cart_items: {
        Row: {
          added_at: string
          id: string
          offer_id: string
          product_id: string
          user_cpf: string
        }
        Insert: {
          added_at?: string
          id?: string
          offer_id: string
          product_id: string
          user_cpf: string
        }
        Update: {
          added_at?: string
          id?: string
          offer_id?: string
          product_id?: string
          user_cpf?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_cart_items_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "marketplace_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_cart_items_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "marketplace_offers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_consignments: {
        Row: {
          admin_notes: string | null
          brand: string
          colorway: string | null
          condition: string
          created_at: string
          description: string | null
          fee_amount: number | null
          fee_percent: number
          final_price: number | null
          has_receipt: boolean
          hub_photos: string[] | null
          id: string
          inspected_at: string | null
          inspection_notes: string | null
          inspection_result: string | null
          instructions_sent_at: string | null
          laudo_id: string | null
          listed_at: string | null
          model: string
          offer_id: string | null
          payout_at: string | null
          payout_released_at: string | null
          photographed_at: string | null
          product_id: string | null
          received_at: string | null
          rejection_reason: string | null
          requested_at: string
          sale_amount: number | null
          seller_id: string
          seller_payout: number | null
          seller_photos: string[] | null
          shipped_at: string | null
          size: string
          size_system: string
          sold_at: string | null
          status: string
          suggested_price: number
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          brand: string
          colorway?: string | null
          condition?: string
          created_at?: string
          description?: string | null
          fee_amount?: number | null
          fee_percent?: number
          final_price?: number | null
          has_receipt?: boolean
          hub_photos?: string[] | null
          id?: string
          inspected_at?: string | null
          inspection_notes?: string | null
          inspection_result?: string | null
          instructions_sent_at?: string | null
          laudo_id?: string | null
          listed_at?: string | null
          model: string
          offer_id?: string | null
          payout_at?: string | null
          payout_released_at?: string | null
          photographed_at?: string | null
          product_id?: string | null
          received_at?: string | null
          rejection_reason?: string | null
          requested_at?: string
          sale_amount?: number | null
          seller_id: string
          seller_payout?: number | null
          seller_photos?: string[] | null
          shipped_at?: string | null
          size: string
          size_system?: string
          sold_at?: string | null
          status?: string
          suggested_price: number
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          brand?: string
          colorway?: string | null
          condition?: string
          created_at?: string
          description?: string | null
          fee_amount?: number | null
          fee_percent?: number
          final_price?: number | null
          has_receipt?: boolean
          hub_photos?: string[] | null
          id?: string
          inspected_at?: string | null
          inspection_notes?: string | null
          inspection_result?: string | null
          instructions_sent_at?: string | null
          laudo_id?: string | null
          listed_at?: string | null
          model?: string
          offer_id?: string | null
          payout_at?: string | null
          payout_released_at?: string | null
          photographed_at?: string | null
          product_id?: string | null
          received_at?: string | null
          rejection_reason?: string | null
          requested_at?: string
          sale_amount?: number | null
          seller_id?: string
          seller_payout?: number | null
          seller_photos?: string[] | null
          shipped_at?: string | null
          size?: string
          size_system?: string
          sold_at?: string | null
          status?: string
          suggested_price?: number
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_consignments_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "marketplace_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_consignments_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "marketplace_offers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_consignments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_consignments_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "vault_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          listing_ids: string[] | null
          max_uses: number | null
          min_purchase: number | null
          seller_id: string
          updated_at: string
          uses_count: number
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value: number
          id?: string
          is_active?: boolean
          listing_ids?: string[] | null
          max_uses?: number | null
          min_purchase?: number | null
          seller_id: string
          updated_at?: string
          uses_count?: number
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          listing_ids?: string[] | null
          max_uses?: number | null
          min_purchase?: number | null
          seller_id?: string
          updated_at?: string
          uses_count?: number
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_coupons_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "vault_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_drop_reminders: {
        Row: {
          created_at: string
          id: string
          notified_at: string | null
          release_brand: string
          release_date: string
          release_key: string
          release_model: string
          user_cpf: string
        }
        Insert: {
          created_at?: string
          id?: string
          notified_at?: string | null
          release_brand: string
          release_date: string
          release_key: string
          release_model: string
          user_cpf: string
        }
        Update: {
          created_at?: string
          id?: string
          notified_at?: string | null
          release_brand?: string
          release_date?: string
          release_key?: string
          release_model?: string
          user_cpf?: string
        }
        Relationships: []
      }
      marketplace_fee_tiers: {
        Row: {
          created_at: string
          fee_discount: number
          id: string
          min_sales: number
          plan_id: string
        }
        Insert: {
          created_at?: string
          fee_discount?: number
          id?: string
          min_sales?: number
          plan_id: string
        }
        Update: {
          created_at?: string
          fee_discount?: number
          id?: string
          min_sales?: number
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_fee_tiers_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "marketplace_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_inspections: {
        Row: {
          checklist: Json | null
          created_at: string
          id: string
          inspected_at: string | null
          inspection_photos: string[] | null
          inspector_admin_id: string | null
          laudo_id: string | null
          laudo_qr_url: string | null
          notes: string | null
          offer_id: string | null
          order_id: string | null
          received_at: string | null
          rejection_reason: string | null
          result: string | null
          status: string
          updated_at: string
        }
        Insert: {
          checklist?: Json | null
          created_at?: string
          id?: string
          inspected_at?: string | null
          inspection_photos?: string[] | null
          inspector_admin_id?: string | null
          laudo_id?: string | null
          laudo_qr_url?: string | null
          notes?: string | null
          offer_id?: string | null
          order_id?: string | null
          received_at?: string | null
          rejection_reason?: string | null
          result?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          checklist?: Json | null
          created_at?: string
          id?: string
          inspected_at?: string | null
          inspection_photos?: string[] | null
          inspector_admin_id?: string | null
          laudo_id?: string | null
          laudo_qr_url?: string | null
          notes?: string | null
          offer_id?: string | null
          order_id?: string | null
          received_at?: string | null
          rejection_reason?: string | null
          result?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_inspections_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "marketplace_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_inspections_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "marketplace_offers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_installment_surcharges: {
        Row: {
          created_at: string
          id: string
          label: string
          max_installments: number
          surcharge_percent: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          max_installments: number
          surcharge_percent: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          max_installments?: number
          surcharge_percent?: number
        }
        Relationships: []
      }
      marketplace_loyalty_points: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          points: number
          reference_id: string | null
          user_cpf: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          user_cpf: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          user_cpf?: string
        }
        Relationships: []
      }
      marketplace_negotiation_events: {
        Row: {
          actor_cpf: string
          actor_name: string | null
          created_at: string
          event_type: string
          id: string
          message: string | null
          offer_id: string
          price: number | null
        }
        Insert: {
          actor_cpf: string
          actor_name?: string | null
          created_at?: string
          event_type: string
          id?: string
          message?: string | null
          offer_id: string
          price?: number | null
        }
        Update: {
          actor_cpf?: string
          actor_name?: string | null
          created_at?: string
          event_type?: string
          id?: string
          message?: string | null
          offer_id?: string
          price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_negotiation_events_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "vault_marketplace_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_offers: {
        Row: {
          activated_at: string | null
          boost_active_until: string | null
          boost_level: string | null
          condition: string
          created_at: string
          defects: string | null
          description: string | null
          has_receipt: boolean
          id: string
          interest_free_installments: number | null
          listing_id: string | null
          original_purchase_price: number | null
          photos: string[] | null
          price: number
          pro_recommendation: string | null
          product_id: string
          proof_photos: string[] | null
          published_at: string | null
          seller_id: string
          shipping_cost_estimate: number | null
          shipping_mode: string
          size: string
          size_system: string
          sold_at: string | null
          status: string
          updated_at: string
          views_count: number
        }
        Insert: {
          activated_at?: string | null
          boost_active_until?: string | null
          boost_level?: string | null
          condition?: string
          created_at?: string
          defects?: string | null
          description?: string | null
          has_receipt?: boolean
          id?: string
          interest_free_installments?: number | null
          listing_id?: string | null
          original_purchase_price?: number | null
          photos?: string[] | null
          price: number
          pro_recommendation?: string | null
          product_id: string
          proof_photos?: string[] | null
          published_at?: string | null
          seller_id: string
          shipping_cost_estimate?: number | null
          shipping_mode?: string
          size: string
          size_system?: string
          sold_at?: string | null
          status?: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          activated_at?: string | null
          boost_active_until?: string | null
          boost_level?: string | null
          condition?: string
          created_at?: string
          defects?: string | null
          description?: string | null
          has_receipt?: boolean
          id?: string
          interest_free_installments?: number | null
          listing_id?: string | null
          original_purchase_price?: number | null
          photos?: string[] | null
          price?: number
          pro_recommendation?: string | null
          product_id?: string
          proof_photos?: string[] | null
          published_at?: string | null
          seller_id?: string
          shipping_cost_estimate?: number | null
          shipping_mode?: string
          size?: string
          size_system?: string
          sold_at?: string | null
          status?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "vault_marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_offers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "vault_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_plans: {
        Row: {
          boost_slots: number
          created_at: string
          features: Json | null
          fee_percent: number
          has_batch_tools: boolean
          has_priority_search: boolean
          has_storefront: boolean
          has_verified_badge: boolean
          id: string
          is_active: boolean
          max_active_listings: number | null
          max_new_listings_month: number | null
          name: string
          price_monthly: number
          support_sla_hours: number
          updated_at: string
        }
        Insert: {
          boost_slots?: number
          created_at?: string
          features?: Json | null
          fee_percent?: number
          has_batch_tools?: boolean
          has_priority_search?: boolean
          has_storefront?: boolean
          has_verified_badge?: boolean
          id: string
          is_active?: boolean
          max_active_listings?: number | null
          max_new_listings_month?: number | null
          name: string
          price_monthly?: number
          support_sla_hours?: number
          updated_at?: string
        }
        Update: {
          boost_slots?: number
          created_at?: string
          features?: Json | null
          fee_percent?: number
          has_batch_tools?: boolean
          has_priority_search?: boolean
          has_storefront?: boolean
          has_verified_badge?: boolean
          id?: string
          is_active?: boolean
          max_active_listings?: number | null
          max_new_listings_month?: number | null
          name?: string
          price_monthly?: number
          support_sla_hours?: number
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_price_history: {
        Row: {
          avg_price: number
          created_at: string
          id: string
          max_price: number
          min_price: number
          offers_count: number
          product_id: string
          recorded_date: string
        }
        Insert: {
          avg_price: number
          created_at?: string
          id?: string
          max_price: number
          min_price: number
          offers_count?: number
          product_id: string
          recorded_date?: string
        }
        Update: {
          avg_price?: number
          created_at?: string
          id?: string
          max_price?: number
          min_price?: number
          offers_count?: number
          product_id?: string
          recorded_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_product_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_seller_reply: boolean
          is_visible: boolean
          parent_id: string | null
          product_id: string
          review_id: string | null
          user_cpf: string
          user_name: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_seller_reply?: boolean
          is_visible?: boolean
          parent_id?: string | null
          product_id: string
          review_id?: string | null
          user_cpf: string
          user_name?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_seller_reply?: boolean
          is_visible?: boolean
          parent_id?: string | null
          product_id?: string
          review_id?: string | null
          user_cpf?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_product_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "marketplace_product_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_product_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "marketplace_product_comments_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_product_comments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_product_comments_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "marketplace_product_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_product_comments_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "marketplace_product_reviews_public"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_product_reviews: {
        Row: {
          authenticity_score: number | null
          comment: string | null
          created_at: string
          id: string
          is_verified_purchase: boolean | null
          is_visible: boolean | null
          offer_id: string | null
          product_id: string
          product_quality: number | null
          rating: number
          review_photos: string[] | null
          reviewer_cpf: string
          reviewer_name: string | null
          shipping_speed: number | null
        }
        Insert: {
          authenticity_score?: number | null
          comment?: string | null
          created_at?: string
          id?: string
          is_verified_purchase?: boolean | null
          is_visible?: boolean | null
          offer_id?: string | null
          product_id: string
          product_quality?: number | null
          rating: number
          review_photos?: string[] | null
          reviewer_cpf: string
          reviewer_name?: string | null
          shipping_speed?: number | null
        }
        Update: {
          authenticity_score?: number | null
          comment?: string | null
          created_at?: string
          id?: string
          is_verified_purchase?: boolean | null
          is_visible?: boolean | null
          offer_id?: string | null
          product_id?: string
          product_quality?: number | null
          rating?: number
          review_photos?: string[] | null
          reviewer_cpf?: string
          reviewer_name?: string | null
          shipping_speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_product_reviews_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "marketplace_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_product_reviews_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "marketplace_offers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_products: {
        Row: {
          brand: string
          category: string
          colorway: string | null
          created_at: string
          created_by_admin_id: string | null
          created_by_seller_id: string | null
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean
          is_high_risk: boolean
          lowest_price: number | null
          model: string
          release_date: string | null
          retail_price: number | null
          sku: string | null
          slug: string | null
          total_offers: number
          updated_at: string
        }
        Insert: {
          brand: string
          category?: string
          colorway?: string | null
          created_at?: string
          created_by_admin_id?: string | null
          created_by_seller_id?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_high_risk?: boolean
          lowest_price?: number | null
          model: string
          release_date?: string | null
          retail_price?: number | null
          sku?: string | null
          slug?: string | null
          total_offers?: number
          updated_at?: string
        }
        Update: {
          brand?: string
          category?: string
          colorway?: string | null
          created_at?: string
          created_by_admin_id?: string | null
          created_by_seller_id?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_high_risk?: boolean
          lowest_price?: number | null
          model?: string
          release_date?: string | null
          retail_price?: number | null
          sku?: string | null
          slug?: string | null
          total_offers?: number
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_saved_searches: {
        Row: {
          created_at: string
          filters: Json
          id: string
          last_notified_at: string | null
          name: string
          notify_new_listings: boolean
          results_count: number
          updated_at: string
          user_cpf: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          last_notified_at?: string | null
          name: string
          notify_new_listings?: boolean
          results_count?: number
          updated_at?: string
          user_cpf: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          last_notified_at?: string | null
          name?: string
          notify_new_listings?: boolean
          results_count?: number
          updated_at?: string
          user_cpf?: string
        }
        Relationships: []
      }
      marketplace_seller_badges: {
        Row: {
          badge_icon: string
          badge_name: string
          badge_type: string
          earned_at: string
          id: string
          seller_id: string
        }
        Insert: {
          badge_icon?: string
          badge_name: string
          badge_type: string
          earned_at?: string
          id?: string
          seller_id: string
        }
        Update: {
          badge_icon?: string
          badge_name?: string
          badge_type?: string
          earned_at?: string
          id?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_seller_badges_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "vault_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_seller_follows: {
        Row: {
          created_at: string
          follower_cpf: string
          id: string
          seller_id: string
        }
        Insert: {
          created_at?: string
          follower_cpf: string
          id?: string
          seller_id: string
        }
        Update: {
          created_at?: string
          follower_cpf?: string
          id?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_seller_follows_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "vault_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_seller_payouts: {
        Row: {
          admin_notes: string | null
          amount: number
          bank_name: string | null
          beneficiary_name: string | null
          completed_at: string | null
          created_at: string
          id: string
          pix_account_id: string | null
          pix_key: string | null
          pix_key_type: string | null
          processed_at: string | null
          proof_url: string | null
          rejected_at: string | null
          rejection_reason: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          bank_name?: string | null
          beneficiary_name?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          pix_account_id?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          processed_at?: string | null
          proof_url?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          bank_name?: string | null
          beneficiary_name?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          pix_account_id?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          processed_at?: string | null
          proof_url?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_seller_payouts_pix_account_id_fkey"
            columns: ["pix_account_id"]
            isOneToOne: false
            referencedRelation: "marketplace_seller_pix_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_seller_payouts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "vault_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_seller_pix_accounts: {
        Row: {
          bank_name: string
          beneficiary_name: string
          created_at: string
          id: string
          is_default: boolean | null
          pix_key: string
          pix_key_type: string
          seller_id: string
          updated_at: string
        }
        Insert: {
          bank_name: string
          beneficiary_name: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          pix_key: string
          pix_key_type: string
          seller_id: string
          updated_at?: string
        }
        Update: {
          bank_name?: string
          beneficiary_name?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          pix_key?: string
          pix_key_type?: string
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_seller_pix_accounts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "vault_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string
          grace_period_end: string | null
          id: string
          last_payment_at: string | null
          last_payment_status: string | null
          payment_provider: string | null
          plan_id: string
          provider_subscription_id: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          grace_period_end?: string | null
          id?: string
          last_payment_at?: string | null
          last_payment_status?: string | null
          payment_provider?: string | null
          plan_id?: string
          provider_subscription_id?: string | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          grace_period_end?: string | null
          id?: string
          last_payment_at?: string | null
          last_payment_status?: string | null
          payment_provider?: string | null
          plan_id?: string
          provider_subscription_id?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "marketplace_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_subscriptions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "vault_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_watchlist: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          max_price: number | null
          notify_email: boolean
          notify_push: boolean
          product_id: string
          size: string
          user_cpf: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_price?: number | null
          notify_email?: boolean
          notify_push?: boolean
          product_id: string
          size: string
          user_cpf: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_price?: number | null
          notify_email?: boolean
          notify_push?: boolean
          product_id?: string
          size?: string
          user_cpf?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_watchlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          target: Database["public"]["Enums"]["notification_target"]
          target_client_cpf: string | null
          target_user_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          target: Database["public"]["Enums"]["notification_target"]
          target_client_cpf?: string | null
          target_user_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          target?: Database["public"]["Enums"]["notification_target"]
          target_client_cpf?: string | null
          target_user_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: []
      }
      order_costs: {
        Row: {
          amount: number
          cost_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          order_id: string
        }
        Insert: {
          amount?: number
          cost_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          order_id: string
        }
        Update: {
          amount?: number
          cost_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_costs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
        ]
      }
      order_history: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
        ]
      }
      order_requests: {
        Row: {
          additional_notes: string | null
          address_cep: string
          address_city: string
          address_complement: string | null
          address_neighborhood: string
          address_number: string
          address_state: string
          address_street: string
          admin_notes: string | null
          client_cpf: string
          client_email: string
          client_name: string
          client_phone: string
          converted_order_id: string | null
          created_at: string
          id: string
          product_brand: string | null
          product_color: string | null
          product_link: string | null
          product_model: string | null
          reference_image_url: string | null
          referral_code: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          shoe_size: string
          status: string
        }
        Insert: {
          additional_notes?: string | null
          address_cep: string
          address_city: string
          address_complement?: string | null
          address_neighborhood: string
          address_number: string
          address_state: string
          address_street: string
          admin_notes?: string | null
          client_cpf: string
          client_email: string
          client_name: string
          client_phone: string
          converted_order_id?: string | null
          created_at?: string
          id?: string
          product_brand?: string | null
          product_color?: string | null
          product_link?: string | null
          product_model?: string | null
          reference_image_url?: string | null
          referral_code?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shoe_size: string
          status?: string
        }
        Update: {
          additional_notes?: string | null
          address_cep?: string
          address_city?: string
          address_complement?: string | null
          address_neighborhood?: string
          address_number?: string
          address_state?: string
          address_street?: string
          admin_notes?: string | null
          client_cpf?: string
          client_email?: string
          client_name?: string
          client_phone?: string
          converted_order_id?: string | null
          created_at?: string
          id?: string
          product_brand?: string | null
          product_color?: string | null
          product_link?: string | null
          product_model?: string | null
          reference_image_url?: string | null
          referral_code?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shoe_size?: string
          status?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          authenticity_code: string | null
          authenticity_verification_count: number | null
          authenticity_verified_at: string | null
          balance_due_date: string | null
          balance_paid: boolean | null
          balance_paid_at: string | null
          balance_payment_method:
            | Database["public"]["Enums"]["payment_method"]
            | null
          balance_pix_transaction_id: string | null
          balance_proof_url: string | null
          balance_stripe_payment_id: string | null
          balance_value: number | null
          budget_approval_token: string | null
          budget_approved_at: string | null
          budget_expires_at: string | null
          budget_rejected_at: string | null
          budget_rejection_reason: string | null
          budget_sent_at: string | null
          budget_status: Database["public"]["Enums"]["budget_status"] | null
          client_address: string | null
          client_cpf: string
          client_email: string | null
          client_name: string
          client_phone: string | null
          contract_accepted_at: string | null
          contract_accepted_ip: string | null
          created_at: string
          current_status: Database["public"]["Enums"]["order_status"]
          inspection_photos: string[] | null
          internal_notes: string | null
          international_carrier: string | null
          international_tracking: string | null
          national_carrier: string | null
          national_tracking: string | null
          order_id: string
          order_type: Database["public"]["Enums"]["order_type"]
          other_costs: number | null
          other_costs_description: string | null
          payment_mode: string | null
          pix_copy_paste: string | null
          pix_qr_code: string | null
          product_brand: string | null
          product_color: string | null
          product_cost: number | null
          product_currency: string | null
          product_link: string | null
          product_model: string | null
          product_name: string
          product_price: number | null
          product_reference: string | null
          product_size: string | null
          reference_image_url: string | null
          shipping_cost: number | null
          sinal_paid: boolean | null
          sinal_paid_at: string | null
          sinal_payment_method:
            | Database["public"]["Enums"]["payment_method"]
            | null
          sinal_pix_transaction_id: string | null
          sinal_proof_url: string | null
          sinal_stripe_payment_id: string | null
          sinal_value: number | null
          sla_vault_due_date: string | null
          updated_at: string
        }
        Insert: {
          authenticity_code?: string | null
          authenticity_verification_count?: number | null
          authenticity_verified_at?: string | null
          balance_due_date?: string | null
          balance_paid?: boolean | null
          balance_paid_at?: string | null
          balance_payment_method?:
            | Database["public"]["Enums"]["payment_method"]
            | null
          balance_pix_transaction_id?: string | null
          balance_proof_url?: string | null
          balance_stripe_payment_id?: string | null
          balance_value?: number | null
          budget_approval_token?: string | null
          budget_approved_at?: string | null
          budget_expires_at?: string | null
          budget_rejected_at?: string | null
          budget_rejection_reason?: string | null
          budget_sent_at?: string | null
          budget_status?: Database["public"]["Enums"]["budget_status"] | null
          client_address?: string | null
          client_cpf: string
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          contract_accepted_at?: string | null
          contract_accepted_ip?: string | null
          created_at?: string
          current_status?: Database["public"]["Enums"]["order_status"]
          inspection_photos?: string[] | null
          internal_notes?: string | null
          international_carrier?: string | null
          international_tracking?: string | null
          national_carrier?: string | null
          national_tracking?: string | null
          order_id: string
          order_type?: Database["public"]["Enums"]["order_type"]
          other_costs?: number | null
          other_costs_description?: string | null
          payment_mode?: string | null
          pix_copy_paste?: string | null
          pix_qr_code?: string | null
          product_brand?: string | null
          product_color?: string | null
          product_cost?: number | null
          product_currency?: string | null
          product_link?: string | null
          product_model?: string | null
          product_name: string
          product_price?: number | null
          product_reference?: string | null
          product_size?: string | null
          reference_image_url?: string | null
          shipping_cost?: number | null
          sinal_paid?: boolean | null
          sinal_paid_at?: string | null
          sinal_payment_method?:
            | Database["public"]["Enums"]["payment_method"]
            | null
          sinal_pix_transaction_id?: string | null
          sinal_proof_url?: string | null
          sinal_stripe_payment_id?: string | null
          sinal_value?: number | null
          sla_vault_due_date?: string | null
          updated_at?: string
        }
        Update: {
          authenticity_code?: string | null
          authenticity_verification_count?: number | null
          authenticity_verified_at?: string | null
          balance_due_date?: string | null
          balance_paid?: boolean | null
          balance_paid_at?: string | null
          balance_payment_method?:
            | Database["public"]["Enums"]["payment_method"]
            | null
          balance_pix_transaction_id?: string | null
          balance_proof_url?: string | null
          balance_stripe_payment_id?: string | null
          balance_value?: number | null
          budget_approval_token?: string | null
          budget_approved_at?: string | null
          budget_expires_at?: string | null
          budget_rejected_at?: string | null
          budget_rejection_reason?: string | null
          budget_sent_at?: string | null
          budget_status?: Database["public"]["Enums"]["budget_status"] | null
          client_address?: string | null
          client_cpf?: string
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          contract_accepted_at?: string | null
          contract_accepted_ip?: string | null
          created_at?: string
          current_status?: Database["public"]["Enums"]["order_status"]
          inspection_photos?: string[] | null
          internal_notes?: string | null
          international_carrier?: string | null
          international_tracking?: string | null
          national_carrier?: string | null
          national_tracking?: string | null
          order_id?: string
          order_type?: Database["public"]["Enums"]["order_type"]
          other_costs?: number | null
          other_costs_description?: string | null
          payment_mode?: string | null
          pix_copy_paste?: string | null
          pix_qr_code?: string | null
          product_brand?: string | null
          product_color?: string | null
          product_cost?: number | null
          product_currency?: string | null
          product_link?: string | null
          product_model?: string | null
          product_name?: string
          product_price?: number | null
          product_reference?: string | null
          product_size?: string | null
          reference_image_url?: string | null
          shipping_cost?: number | null
          sinal_paid?: boolean | null
          sinal_paid_at?: string | null
          sinal_payment_method?:
            | Database["public"]["Enums"]["payment_method"]
            | null
          sinal_pix_transaction_id?: string | null
          sinal_proof_url?: string | null
          sinal_stripe_payment_id?: string | null
          sinal_value?: number | null
          sla_vault_due_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_cpf: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_cpf: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_cpf?: string
        }
        Relationships: []
      }
      rate_limit_entries: {
        Row: {
          created_at: string
          id: string
          ip_address: string
          key: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: string
          key: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string
          key?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          discount_order_id: string | null
          discount_percentage: number | null
          discount_used: boolean | null
          discount_used_at: string | null
          expires_at: string | null
          id: string
          referral_code: string
          referred_cpf: string | null
          referred_name: string | null
          referred_order_id: string | null
          referrer_cpf: string
          referrer_email: string | null
          referrer_name: string
          status: string | null
        }
        Insert: {
          created_at?: string
          discount_order_id?: string | null
          discount_percentage?: number | null
          discount_used?: boolean | null
          discount_used_at?: string | null
          expires_at?: string | null
          id?: string
          referral_code: string
          referred_cpf?: string | null
          referred_name?: string | null
          referred_order_id?: string | null
          referrer_cpf: string
          referrer_email?: string | null
          referrer_name: string
          status?: string | null
        }
        Update: {
          created_at?: string
          discount_order_id?: string | null
          discount_percentage?: number | null
          discount_used?: boolean | null
          discount_used_at?: string | null
          expires_at?: string | null
          id?: string
          referral_code?: string
          referred_cpf?: string | null
          referred_name?: string | null
          referred_order_id?: string | null
          referrer_cpf?: string
          referrer_email?: string | null
          referrer_name?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_discount_order_id_fkey"
            columns: ["discount_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "referrals_referred_order_id_fkey"
            columns: ["referred_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
        ]
      }
      reviews: {
        Row: {
          admin_response: string | null
          admin_response_at: string | null
          client_cpf: string
          client_name: string
          comment: string | null
          created_at: string
          customer_service: number | null
          delivery_speed: number | null
          id: string
          is_approved: boolean | null
          is_featured: boolean | null
          order_id: string | null
          product_quality: number | null
          rating: number
          would_recommend: boolean | null
        }
        Insert: {
          admin_response?: string | null
          admin_response_at?: string | null
          client_cpf: string
          client_name: string
          comment?: string | null
          created_at?: string
          customer_service?: number | null
          delivery_speed?: number | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          order_id?: string | null
          product_quality?: number | null
          rating: number
          would_recommend?: boolean | null
        }
        Update: {
          admin_response?: string | null
          admin_response_at?: string | null
          client_cpf?: string
          client_name?: string
          comment?: string | null
          created_at?: string
          customer_service?: number | null
          delivery_speed?: number | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          order_id?: string | null
          product_quality?: number | null
          rating?: number
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
        ]
      }
      scheduled_reminders: {
        Row: {
          attempt_count: number | null
          channel: string
          created_at: string
          id: string
          last_error: string | null
          order_id: string | null
          reminder_type: string
          scheduled_for: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          attempt_count?: number | null
          channel: string
          created_at?: string
          id?: string
          last_error?: string | null
          order_id?: string | null
          reminder_type: string
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          attempt_count?: number | null
          channel?: string
          created_at?: string
          id?: string
          last_error?: string | null
          order_id?: string | null
          reminder_type?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reminders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
        ]
      }
      seller_collections: {
        Row: {
          cover_image: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          listing_ids: string[] | null
          name: string
          seller_id: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          listing_ids?: string[] | null
          name: string
          seller_id: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          listing_ids?: string[] | null
          name?: string
          seller_id?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_collections_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "vault_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_strikes: {
        Row: {
          appeal_message: string | null
          appeal_reviewed_at: string | null
          appeal_reviewed_by: string | null
          appeal_status: string | null
          created_at: string
          id: string
          is_active: boolean
          issued_by: string | null
          order_id: string | null
          reason: string
          seller_id: string
          severity: string
          strike_type: string
          suspension_ends_at: string | null
          suspension_starts_at: string | null
          updated_at: string
        }
        Insert: {
          appeal_message?: string | null
          appeal_reviewed_at?: string | null
          appeal_reviewed_by?: string | null
          appeal_status?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          issued_by?: string | null
          order_id?: string | null
          reason: string
          seller_id: string
          severity?: string
          strike_type: string
          suspension_ends_at?: string | null
          suspension_starts_at?: string | null
          updated_at?: string
        }
        Update: {
          appeal_message?: string | null
          appeal_reviewed_at?: string | null
          appeal_reviewed_by?: string | null
          appeal_status?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          issued_by?: string | null
          order_id?: string | null
          reason?: string
          seller_id?: string
          severity?: string
          strike_type?: string
          suspension_ends_at?: string | null
          suspension_starts_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_strikes_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "vault_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      silhouette_taxonomy: {
        Row: {
          brand_name: string
          id: string
          match_keywords: string[]
          priority: number
          silhouette_name: string
        }
        Insert: {
          brand_name: string
          id?: string
          match_keywords: string[]
          priority?: number
          silhouette_name: string
        }
        Update: {
          brand_name?: string
          id?: string
          match_keywords?: string[]
          priority?: number
          silhouette_name?: string
        }
        Relationships: []
      }
      silhouettes: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "silhouettes_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      sneaker_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_primary: boolean
          sneaker_id: string
          source: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean
          sneaker_id: string
          source: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean
          sneaker_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "sneaker_images_sneaker_id_fkey"
            columns: ["sneaker_id"]
            isOneToOne: false
            referencedRelation: "sneaker_models"
            referencedColumns: ["id"]
          },
        ]
      }
      sneaker_models: {
        Row: {
          brand_id: string
          colorway: string | null
          created_at: string
          description_en: string | null
          description_pt: string | null
          id: string
          image_status: string
          model_name_en: string | null
          model_name_pt: string | null
          msrp: number | null
          msrp_exchange_rate: number | null
          msrp_usd: number | null
          needs_official_image: boolean
          placeholder_image_url: string
          release_date: string | null
          silhouette_id: string | null
          sku: string
          source_primary: string
          source_secondary: string[] | null
          translation_error: string | null
          translation_status: string
        }
        Insert: {
          brand_id: string
          colorway?: string | null
          created_at?: string
          description_en?: string | null
          description_pt?: string | null
          id?: string
          image_status?: string
          model_name_en?: string | null
          model_name_pt?: string | null
          msrp?: number | null
          msrp_exchange_rate?: number | null
          msrp_usd?: number | null
          needs_official_image?: boolean
          placeholder_image_url?: string
          release_date?: string | null
          silhouette_id?: string | null
          sku: string
          source_primary?: string
          source_secondary?: string[] | null
          translation_error?: string | null
          translation_status?: string
        }
        Update: {
          brand_id?: string
          colorway?: string | null
          created_at?: string
          description_en?: string | null
          description_pt?: string | null
          id?: string
          image_status?: string
          model_name_en?: string | null
          model_name_pt?: string | null
          msrp?: number | null
          msrp_exchange_rate?: number | null
          msrp_usd?: number | null
          needs_official_image?: boolean
          placeholder_image_url?: string
          release_date?: string | null
          silhouette_id?: string | null
          sku?: string
          source_primary?: string
          source_secondary?: string[] | null
          translation_error?: string | null
          translation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sneaker_models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sneaker_models_silhouette_id_fkey"
            columns: ["silhouette_id"]
            isOneToOne: false
            referencedRelation: "silhouettes"
            referencedColumns: ["id"]
          },
        ]
      }
      sneaker_releases: {
        Row: {
          brand: string
          colorway: string | null
          created_at: string
          hype_level: string
          id: string
          image_url: string | null
          is_active: boolean
          model: string
          release_date: string
          updated_at: string
        }
        Insert: {
          brand: string
          colorway?: string | null
          created_at?: string
          hype_level?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          model: string
          release_date: string
          updated_at?: string
        }
        Update: {
          brand?: string
          colorway?: string | null
          created_at?: string
          hype_level?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          model?: string
          release_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          average_shipping_days: number | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          country: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          payment_methods: string[] | null
          rating: number | null
          specialties: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          average_shipping_days?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          country: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          payment_methods?: string[] | null
          rating?: number | null
          specialties?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          average_shipping_days?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          payment_methods?: string[] | null
          rating?: number | null
          specialties?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vault_badges: {
        Row: {
          badge_description: string | null
          badge_icon: string | null
          badge_name: string
          badge_type: string
          earned_at: string | null
          id: string
          member_id: string
        }
        Insert: {
          badge_description?: string | null
          badge_icon?: string | null
          badge_name: string
          badge_type: string
          earned_at?: string | null
          id?: string
          member_id: string
        }
        Update: {
          badge_description?: string | null
          badge_icon?: string | null
          badge_name?: string
          badge_type?: string
          earned_at?: string | null
          id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_badges_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "vault_member_rankings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "vault_badges_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_community_comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_community_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "vault_community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_community_comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vault_member_rankings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "vault_community_comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_community_comment_reactions: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          reaction_type: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_community_comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "vault_community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_community_comment_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vault_member_rankings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "vault_community_comment_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_community_comments: {
        Row: {
          content: string
          created_at: string | null
          edited_at: string | null
          id: string
          likes_count: number | null
          parent_id: string | null
          post_id: string
          reactions_summary: Json | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          post_id: string
          reactions_summary?: Json | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          post_id?: string
          reactions_summary?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_community_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "vault_community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "vault_community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_community_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vault_member_rankings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "vault_community_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_community_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_community_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "vault_member_rankings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "vault_community_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_community_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "vault_member_rankings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "vault_community_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_community_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "vault_community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_community_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vault_member_rankings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "vault_community_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_community_posts: {
        Row: {
          attachments: string[] | null
          comments_count: number | null
          content: string | null
          created_at: string | null
          edited_at: string | null
          id: string
          is_pinned: boolean | null
          likes_count: number | null
          media_types: string[] | null
          moderated_by_admin_id: string | null
          moderation_notes: string | null
          reactions_summary: Json | null
          reports_count: number | null
          status: Database["public"]["Enums"]["community_post_status"] | null
          title: string
          type: Database["public"]["Enums"]["community_post_type"]
          user_id: string
        }
        Insert: {
          attachments?: string[] | null
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_pinned?: boolean | null
          likes_count?: number | null
          media_types?: string[] | null
          moderated_by_admin_id?: string | null
          moderation_notes?: string | null
          reactions_summary?: Json | null
          reports_count?: number | null
          status?: Database["public"]["Enums"]["community_post_status"] | null
          title: string
          type?: Database["public"]["Enums"]["community_post_type"]
          user_id: string
        }
        Update: {
          attachments?: string[] | null
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_pinned?: boolean | null
          likes_count?: number | null
          media_types?: string[] | null
          moderated_by_admin_id?: string | null
          moderation_notes?: string | null
          reactions_summary?: Json | null
          reports_count?: number | null
          status?: Database["public"]["Enums"]["community_post_status"] | null
          title?: string
          type?: Database["public"]["Enums"]["community_post_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vault_member_rankings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "vault_community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_community_presence: {
        Row: {
          id: string
          last_seen_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          id?: string
          last_seen_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          id?: string
          last_seen_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_community_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "vault_member_rankings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "vault_community_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_community_reactions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_community_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "vault_community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_community_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vault_member_rankings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "vault_community_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_community_reports: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          details: string | null
          id: string
          post_id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by_admin_id: string | null
          status: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          post_id: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by_admin_id?: string | null
          status?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          post_id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by_admin_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_community_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "vault_community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_community_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "vault_member_rankings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "vault_community_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_hunt_options: {
        Row: {
          admin_recommendation: boolean | null
          authenticity_notes: string | null
          client_feedback: string | null
          condition: string | null
          created_at: string | null
          currency: string | null
          estimated_total_brl: number | null
          hunt_id: string
          id: string
          images: string[] | null
          is_selected: boolean | null
          price: number
          risk_level: string | null
          shipping_estimate: string | null
          supplier_country: string | null
          supplier_name: string | null
        }
        Insert: {
          admin_recommendation?: boolean | null
          authenticity_notes?: string | null
          client_feedback?: string | null
          condition?: string | null
          created_at?: string | null
          currency?: string | null
          estimated_total_brl?: number | null
          hunt_id: string
          id?: string
          images?: string[] | null
          is_selected?: boolean | null
          price: number
          risk_level?: string | null
          shipping_estimate?: string | null
          supplier_country?: string | null
          supplier_name?: string | null
        }
        Update: {
          admin_recommendation?: boolean | null
          authenticity_notes?: string | null
          client_feedback?: string | null
          condition?: string | null
          created_at?: string | null
          currency?: string | null
          estimated_total_brl?: number | null
          hunt_id?: string
          id?: string
          images?: string[] | null
          is_selected?: boolean | null
          price?: number
          risk_level?: string | null
          shipping_estimate?: string | null
          supplier_country?: string | null
          supplier_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_hunt_options_hunt_id_fkey"
            columns: ["hunt_id"]
            isOneToOne: false
            referencedRelation: "vault_wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_intel_bookmarks: {
        Row: {
          client_cpf: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          client_cpf: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          client_cpf?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_intel_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "vault_intel_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_intel_likes: {
        Row: {
          client_cpf: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          client_cpf: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          client_cpf?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_intel_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "vault_intel_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_intel_posts: {
        Row: {
          content: string
          cover_image: string | null
          created_at: string | null
          created_by_admin_id: string | null
          excerpt: string | null
          external_link: string | null
          id: string
          is_featured: boolean | null
          likes_count: number
          media_urls: string[] | null
          published_at: string | null
          read_time_min: number | null
          status: string | null
          title: string
          type: Database["public"]["Enums"]["intel_post_type"]
          updated_at: string | null
          video_url: string | null
          visibility: Database["public"]["Enums"]["intel_visibility"] | null
        }
        Insert: {
          content: string
          cover_image?: string | null
          created_at?: string | null
          created_by_admin_id?: string | null
          excerpt?: string | null
          external_link?: string | null
          id?: string
          is_featured?: boolean | null
          likes_count?: number
          media_urls?: string[] | null
          published_at?: string | null
          read_time_min?: number | null
          status?: string | null
          title: string
          type?: Database["public"]["Enums"]["intel_post_type"]
          updated_at?: string | null
          video_url?: string | null
          visibility?: Database["public"]["Enums"]["intel_visibility"] | null
        }
        Update: {
          content?: string
          cover_image?: string | null
          created_at?: string | null
          created_by_admin_id?: string | null
          excerpt?: string | null
          external_link?: string | null
          id?: string
          is_featured?: boolean | null
          likes_count?: number
          media_urls?: string[] | null
          published_at?: string | null
          read_time_min?: number | null
          status?: string | null
          title?: string
          type?: Database["public"]["Enums"]["intel_post_type"]
          updated_at?: string | null
          video_url?: string | null
          visibility?: Database["public"]["Enums"]["intel_visibility"] | null
        }
        Relationships: []
      }
      vault_invites: {
        Row: {
          converted_purchase_vault_item_id: string | null
          created_at: string | null
          created_by_tier_at_time:
            | Database["public"]["Enums"]["vault_tier"]
            | null
          expires_at: string | null
          id: string
          invite_code: string
          inviter_id: string
          recipient_email: string | null
          recipient_name: string | null
          reward_expires_at: string | null
          reward_granted: boolean | null
          reward_type: string | null
          status: string | null
          token: string | null
          used_at: string | null
          used_by_member_id: string | null
        }
        Insert: {
          converted_purchase_vault_item_id?: string | null
          created_at?: string | null
          created_by_tier_at_time?:
            | Database["public"]["Enums"]["vault_tier"]
            | null
          expires_at?: string | null
          id?: string
          invite_code: string
          inviter_id: string
          recipient_email?: string | null
          recipient_name?: string | null
          reward_expires_at?: string | null
          reward_granted?: boolean | null
          reward_type?: string | null
          status?: string | null
          token?: string | null
          used_at?: string | null
          used_by_member_id?: string | null
        }
        Update: {
          converted_purchase_vault_item_id?: string | null
          created_at?: string | null
          created_by_tier_at_time?:
            | Database["public"]["Enums"]["vault_tier"]
            | null
          expires_at?: string | null
          id?: string
          invite_code?: string
          inviter_id?: string
          recipient_email?: string | null
          recipient_name?: string | null
          reward_expires_at?: string | null
          reward_granted?: boolean | null
          reward_type?: string | null
          status?: string | null
          token?: string | null
          used_at?: string | null
          used_by_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_invites_converted_purchase_vault_item_id_fkey"
            columns: ["converted_purchase_vault_item_id"]
            isOneToOne: false
            referencedRelation: "vault_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_invites_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "vault_member_rankings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "vault_invites_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_invites_used_by_member_id_fkey"
            columns: ["used_by_member_id"]
            isOneToOne: false
            referencedRelation: "vault_member_rankings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "vault_invites_used_by_member_id_fkey"
            columns: ["used_by_member_id"]
            isOneToOne: false
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_items: {
        Row: {
          brand: string | null
          certificate_pdf_url: string | null
          colorway: string | null
          created_at: string | null
          id: string
          inspection_photos: string[] | null
          marketplace_product_id: string | null
          model: string | null
          origin_city: string | null
          origin_country: string | null
          purchase_date: string | null
          purchase_price: number | null
          purchase_value: number | null
          qr_private_url: string | null
          search_id: string | null
          size: string | null
          timeline_events: Json | null
          title: string
          user_id: string
          vault_id: string
          verified_at: string | null
          verified_status:
            | Database["public"]["Enums"]["vault_verified_status"]
            | null
        }
        Insert: {
          brand?: string | null
          certificate_pdf_url?: string | null
          colorway?: string | null
          created_at?: string | null
          id?: string
          inspection_photos?: string[] | null
          marketplace_product_id?: string | null
          model?: string | null
          origin_city?: string | null
          origin_country?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          purchase_value?: number | null
          qr_private_url?: string | null
          search_id?: string | null
          size?: string | null
          timeline_events?: Json | null
          title: string
          user_id: string
          vault_id: string
          verified_at?: string | null
          verified_status?:
            | Database["public"]["Enums"]["vault_verified_status"]
            | null
        }
        Update: {
          brand?: string | null
          certificate_pdf_url?: string | null
          colorway?: string | null
          created_at?: string | null
          id?: string
          inspection_photos?: string[] | null
          marketplace_product_id?: string | null
          model?: string | null
          origin_city?: string | null
          origin_country?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          purchase_value?: number | null
          qr_private_url?: string | null
          search_id?: string | null
          size?: string | null
          timeline_events?: Json | null
          title?: string
          user_id?: string
          vault_id?: string
          verified_at?: string | null
          verified_status?:
            | Database["public"]["Enums"]["vault_verified_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_items_marketplace_product_id_fkey"
            columns: ["marketplace_product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_items_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "vault_searches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vault_member_rankings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "vault_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_login_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_login_at: string
          login_date: string
          longest_streak: number
          member_id: string
          total_logins: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_login_at?: string
          login_date?: string
          longest_streak?: number
          member_id: string
          total_logins?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_login_at?: string
          login_date?: string
          longest_streak?: number
          member_id?: string
          total_logins?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_login_streaks_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "vault_member_rankings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "vault_login_streaks_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_marketplace_favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_cpf: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_cpf: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_cpf?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_marketplace_favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_marketplace_favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "vault_marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_marketplace_listings: {
        Row: {
          brand: string | null
          colorway: string | null
          condition: string
          created_at: string
          description: string | null
          favorites_count: number
          id: string
          interest_free_installments: number | null
          is_vault_certified: boolean
          model: string | null
          original_purchase_price: number | null
          photos: string[]
          price: number
          pro_recommendation: string | null
          product_id: string | null
          published_at: string | null
          seller_id: string
          shipping_cost_estimate: number | null
          shipping_mode: string
          size: string | null
          sold_at: string | null
          status: string
          title: string
          updated_at: string
          vault_item_id: string | null
          views_count: number
        }
        Insert: {
          brand?: string | null
          colorway?: string | null
          condition?: string
          created_at?: string
          description?: string | null
          favorites_count?: number
          id?: string
          interest_free_installments?: number | null
          is_vault_certified?: boolean
          model?: string | null
          original_purchase_price?: number | null
          photos?: string[]
          price: number
          pro_recommendation?: string | null
          product_id?: string | null
          published_at?: string | null
          seller_id: string
          shipping_cost_estimate?: number | null
          shipping_mode?: string
          size?: string | null
          sold_at?: string | null
          status?: string
          title: string
          updated_at?: string
          vault_item_id?: string | null
          views_count?: number
        }
        Update: {
          brand?: string | null
          colorway?: string | null
          condition?: string
          created_at?: string
          description?: string | null
          favorites_count?: number
          id?: string
          interest_free_installments?: number | null
          is_vault_certified?: boolean
          model?: string | null
          original_purchase_price?: number | null
          photos?: string[]
          price?: number
          pro_recommendation?: string | null
          product_id?: string | null
          published_at?: string | null
          seller_id?: string
          shipping_cost_estimate?: number | null
          shipping_mode?: string
          size?: string | null
          sold_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          vault_item_id?: string | null
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "vault_marketplace_listings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_marketplace_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "vault_seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_marketplace_listings_vault_item_id_fkey"
            columns: ["vault_item_id"]
            isOneToOne: false
            referencedRelation: "vault_items"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_marketplace_messages: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean | null
          listing_id: string | null
          message: string
          order_id: string | null
          read_at: string | null
          sender_cpf: string
          sender_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean | null
          listing_id?: string | null
          message: string
          order_id?: string | null
          read_at?: string | null
          sender_cpf: string
          sender_name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean | null
          listing_id?: string | null
          message?: string
          order_id?: string | null
          read_at?: string | null
          sender_cpf?: string
          sender_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_marketplace_messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_marketplace_messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "vault_marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_marketplace_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vault_marketplace_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_marketplace_offers: {
        Row: {
          bundle_discount_percent: number | null
          bundle_id: string | null
          buyer_cpf: string
          buyer_name: string
          counter_message: string | null
          counter_price: number | null
          created_at: string
          expires_at: string
          id: string
          listing_id: string
          message: string | null
          offer_price: number
          responded_at: string | null
          status: string
        }
        Insert: {
          bundle_discount_percent?: number | null
          bundle_id?: string | null
          buyer_cpf: string
          buyer_name: string
          counter_message?: string | null
          counter_price?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          listing_id: string
          message?: string | null
          offer_price: number
          responded_at?: string | null
          status?: string
        }
        Update: {
          bundle_discount_percent?: number | null
          bundle_id?: string | null
          buyer_cpf?: string
          buyer_name?: string
          counter_message?: string | null
          counter_price?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          offer_price?: number
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_marketplace_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_marketplace_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "vault_marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_marketplace_orders: {
        Row: {
          admin_notes: string | null
          authentication_fee: number | null
          authentication_requested: boolean
          buyer_address: string | null
          buyer_cpf: string
          buyer_email: string | null
          buyer_name: string
          buyer_phone: string | null
          buyer_rated_at: string | null
          buyer_rating: number | null
          buyer_review: string | null
          cancellation_reason: string | null
          cancellation_window_ends_at: string | null
          cancelled_at: string | null
          confirmed_at: string | null
          contest_window_ends_at: string | null
          coupon_code: string | null
          created_at: string
          delivered_at: string | null
          discount_amount: number | null
          dispute_opened_at: string | null
          dispute_reason: string | null
          dispute_refund_amount: number | null
          dispute_resolution: string | null
          dispute_resolved_at: string | null
          dispute_status: string | null
          fee_amount: number
          fee_percent: number
          hub_received_at: string | null
          hub_shipped_at: string | null
          hub_tracking_code: string | null
          hub_tracking_to_buyer: string | null
          id: string
          inspection_id: string | null
          inspection_result: string | null
          listing_id: string | null
          mp_payment_id: string | null
          order_code: string | null
          paid_at: string | null
          payment_id: string | null
          payment_method: string | null
          payout_amount: number | null
          payout_method: string | null
          payout_proof_url: string | null
          payout_released_at: string | null
          payout_status: string | null
          pix_transaction_id: string | null
          protection_ends_at: string | null
          refund_amount: number | null
          refund_at: string | null
          requires_authentication: boolean
          sale_price: number
          seller_id: string
          seller_payout: number
          shipped_at: string | null
          shipping_cost: number | null
          shipping_mode: string
          status: string
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          authentication_fee?: number | null
          authentication_requested?: boolean
          buyer_address?: string | null
          buyer_cpf: string
          buyer_email?: string | null
          buyer_name: string
          buyer_phone?: string | null
          buyer_rated_at?: string | null
          buyer_rating?: number | null
          buyer_review?: string | null
          cancellation_reason?: string | null
          cancellation_window_ends_at?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          contest_window_ends_at?: string | null
          coupon_code?: string | null
          created_at?: string
          delivered_at?: string | null
          discount_amount?: number | null
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          dispute_refund_amount?: number | null
          dispute_resolution?: string | null
          dispute_resolved_at?: string | null
          dispute_status?: string | null
          fee_amount: number
          fee_percent: number
          hub_received_at?: string | null
          hub_shipped_at?: string | null
          hub_tracking_code?: string | null
          hub_tracking_to_buyer?: string | null
          id?: string
          inspection_id?: string | null
          inspection_result?: string | null
          listing_id?: string | null
          mp_payment_id?: string | null
          order_code?: string | null
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payout_amount?: number | null
          payout_method?: string | null
          payout_proof_url?: string | null
          payout_released_at?: string | null
          payout_status?: string | null
          pix_transaction_id?: string | null
          protection_ends_at?: string | null
          refund_amount?: number | null
          refund_at?: string | null
          requires_authentication?: boolean
          sale_price: number
          seller_id: string
          seller_payout: number
          shipped_at?: string | null
          shipping_cost?: number | null
          shipping_mode?: string
          status?: string
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          authentication_fee?: number | null
          authentication_requested?: boolean
          buyer_address?: string | null
          buyer_cpf?: string
          buyer_email?: string | null
          buyer_name?: string
          buyer_phone?: string | null
          buyer_rated_at?: string | null
          buyer_rating?: number | null
          buyer_review?: string | null
          cancellation_reason?: string | null
          cancellation_window_ends_at?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          contest_window_ends_at?: string | null
          coupon_code?: string | null
          created_at?: string
          delivered_at?: string | null
          discount_amount?: number | null
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          dispute_refund_amount?: number | null
          dispute_resolution?: string | null
          dispute_resolved_at?: string | null
          dispute_status?: string | null
          fee_amount?: number
          fee_percent?: number
          hub_received_at?: string | null
          hub_shipped_at?: string | null
          hub_tracking_code?: string | null
          hub_tracking_to_buyer?: string | null
          id?: string
          inspection_id?: string | null
          inspection_result?: string | null
          listing_id?: string | null
          mp_payment_id?: string | null
          order_code?: string | null
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payout_amount?: number | null
          payout_method?: string | null
          payout_proof_url?: string | null
          payout_released_at?: string | null
          payout_status?: string | null
          pix_transaction_id?: string | null
          protection_ends_at?: string | null
          refund_amount?: number | null
          refund_at?: string | null
          requires_authentication?: boolean
          sale_price?: number
          seller_id?: string
          seller_payout?: number
          shipped_at?: string | null
          shipping_cost?: number | null
          shipping_mode?: string
          status?: string
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_marketplace_orders_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "marketplace_inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_marketplace_orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_marketplace_orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "vault_marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_marketplace_orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "vault_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_match_options: {
        Row: {
          condition: string | null
          created_at: string | null
          currency: string | null
          evidence_urls: string[] | null
          id: string
          match_room_id: string
          option_title: string
          price_estimate: number | null
          pros: string | null
          region: string | null
          risks: string | null
        }
        Insert: {
          condition?: string | null
          created_at?: string | null
          currency?: string | null
          evidence_urls?: string[] | null
          id?: string
          match_room_id: string
          option_title: string
          price_estimate?: number | null
          pros?: string | null
          region?: string | null
          risks?: string | null
        }
        Update: {
          condition?: string | null
          created_at?: string | null
          currency?: string | null
          evidence_urls?: string[] | null
          id?: string
          match_room_id?: string
          option_title?: string
          price_estimate?: number | null
          pros?: string | null
          region?: string | null
          risks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_match_options_match_room_id_fkey"
            columns: ["match_room_id"]
            isOneToOne: false
            referencedRelation: "vault_match_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_match_rooms: {
        Row: {
          auto_research_search_id: string | null
          created_at: string | null
          created_by_admin_id: string | null
          decision_at: string | null
          decision_deadline_at: string | null
          decision_notes_from_customer: string | null
          decision_status:
            | Database["public"]["Enums"]["match_decision_status"]
            | null
          id: string
          rejection_category: string | null
          rejection_reason: string | null
          search_id: string
          user_id: string
        }
        Insert: {
          auto_research_search_id?: string | null
          created_at?: string | null
          created_by_admin_id?: string | null
          decision_at?: string | null
          decision_deadline_at?: string | null
          decision_notes_from_customer?: string | null
          decision_status?:
            | Database["public"]["Enums"]["match_decision_status"]
            | null
          id?: string
          rejection_category?: string | null
          rejection_reason?: string | null
          search_id: string
          user_id: string
        }
        Update: {
          auto_research_search_id?: string | null
          created_at?: string | null
          created_by_admin_id?: string | null
          decision_at?: string | null
          decision_deadline_at?: string | null
          decision_notes_from_customer?: string | null
          decision_status?:
            | Database["public"]["Enums"]["match_decision_status"]
            | null
          id?: string
          rejection_category?: string | null
          rejection_reason?: string | null
          search_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_match_rooms_auto_research_search_id_fkey"
            columns: ["auto_research_search_id"]
            isOneToOne: false
            referencedRelation: "vault_searches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_match_rooms_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "vault_searches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_match_rooms_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vault_member_rankings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "vault_match_rooms_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_member_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_member_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "vault_member_rankings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "vault_member_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_member_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "vault_member_rankings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "vault_member_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_members: {
        Row: {
          active_hunts: number | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          client_cpf: string
          client_email: string | null
          client_name: string
          community_opt_in: boolean | null
          created_at: string | null
          display_name: string | null
          facebook_url: string | null
          flags_consecutive_declines: number | null
          flags_eligible_for_black: boolean | null
          flags_review_mode_until: string | null
          followers_count: number | null
          following_count: number | null
          hide_online_status: boolean
          id: string
          instagram_url: string | null
          invited_by: string | null
          invites_remaining: number | null
          invites_semester_reset: string | null
          is_active: boolean | null
          is_profile_public: boolean | null
          joined_at: string | null
          joined_via: string | null
          linkedin_url: string | null
          max_active_hunts: number | null
          max_wishlist_items: number | null
          notes_internal: string | null
          posts_count: number | null
          preferred_brands: string[] | null
          preferred_sizes: string[] | null
          preferred_styles: string[] | null
          state: string | null
          stats_converted_invites: number | null
          stats_decision_rate: number | null
          stats_matches_approved: number | null
          stats_matches_declined: number | null
          stats_matches_total: number | null
          stats_purchases_count_12m: number | null
          stats_purchases_count_18m: number | null
          stats_spend_total_12m: number | null
          stats_spend_total_18m: number | null
          status: Database["public"]["Enums"]["vault_member_status"] | null
          tier: Database["public"]["Enums"]["vault_tier"]
          tier_upgraded_at: string | null
          timezone: string | null
          total_purchases: number | null
          total_spent: number | null
          twitter_url: string | null
          updated_at: string | null
        }
        Insert: {
          active_hunts?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          client_cpf: string
          client_email?: string | null
          client_name: string
          community_opt_in?: boolean | null
          created_at?: string | null
          display_name?: string | null
          facebook_url?: string | null
          flags_consecutive_declines?: number | null
          flags_eligible_for_black?: boolean | null
          flags_review_mode_until?: string | null
          followers_count?: number | null
          following_count?: number | null
          hide_online_status?: boolean
          id?: string
          instagram_url?: string | null
          invited_by?: string | null
          invites_remaining?: number | null
          invites_semester_reset?: string | null
          is_active?: boolean | null
          is_profile_public?: boolean | null
          joined_at?: string | null
          joined_via?: string | null
          linkedin_url?: string | null
          max_active_hunts?: number | null
          max_wishlist_items?: number | null
          notes_internal?: string | null
          posts_count?: number | null
          preferred_brands?: string[] | null
          preferred_sizes?: string[] | null
          preferred_styles?: string[] | null
          state?: string | null
          stats_converted_invites?: number | null
          stats_decision_rate?: number | null
          stats_matches_approved?: number | null
          stats_matches_declined?: number | null
          stats_matches_total?: number | null
          stats_purchases_count_12m?: number | null
          stats_purchases_count_18m?: number | null
          stats_spend_total_12m?: number | null
          stats_spend_total_18m?: number | null
          status?: Database["public"]["Enums"]["vault_member_status"] | null
          tier?: Database["public"]["Enums"]["vault_tier"]
          tier_upgraded_at?: string | null
          timezone?: string | null
          total_purchases?: number | null
          total_spent?: number | null
          twitter_url?: string | null
          updated_at?: string | null
        }
        Update: {
          active_hunts?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          client_cpf?: string
          client_email?: string | null
          client_name?: string
          community_opt_in?: boolean | null
          created_at?: string | null
          display_name?: string | null
          facebook_url?: string | null
          flags_consecutive_declines?: number | null
          flags_eligible_for_black?: boolean | null
          flags_review_mode_until?: string | null
          followers_count?: number | null
          following_count?: number | null
          hide_online_status?: boolean
          id?: string
          instagram_url?: string | null
          invited_by?: string | null
          invites_remaining?: number | null
          invites_semester_reset?: string | null
          is_active?: boolean | null
          is_profile_public?: boolean | null
          joined_at?: string | null
          joined_via?: string | null
          linkedin_url?: string | null
          max_active_hunts?: number | null
          max_wishlist_items?: number | null
          notes_internal?: string | null
          posts_count?: number | null
          preferred_brands?: string[] | null
          preferred_sizes?: string[] | null
          preferred_styles?: string[] | null
          state?: string | null
          stats_converted_invites?: number | null
          stats_decision_rate?: number | null
          stats_matches_approved?: number | null
          stats_matches_declined?: number | null
          stats_matches_total?: number | null
          stats_purchases_count_12m?: number | null
          stats_purchases_count_18m?: number | null
          stats_spend_total_12m?: number | null
          stats_spend_total_18m?: number | null
          status?: Database["public"]["Enums"]["vault_member_status"] | null
          tier?: Database["public"]["Enums"]["vault_tier"]
          tier_upgraded_at?: string | null
          timezone?: string | null
          total_purchases?: number | null
          total_spent?: number | null
          twitter_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "vault_member_rankings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "vault_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_search_updates: {
        Row: {
          created_at: string | null
          created_by_admin_id: string | null
          id: string
          message: string
          search_id: string
          update_type: Database["public"]["Enums"]["search_update_type"]
          visible_to_customer: boolean | null
        }
        Insert: {
          created_at?: string | null
          created_by_admin_id?: string | null
          id?: string
          message: string
          search_id: string
          update_type?: Database["public"]["Enums"]["search_update_type"]
          visible_to_customer?: boolean | null
        }
        Update: {
          created_at?: string | null
          created_by_admin_id?: string | null
          id?: string
          message?: string
          search_id?: string
          update_type?: Database["public"]["Enums"]["search_update_type"]
          visible_to_customer?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_search_updates_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "vault_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_searches: {
        Row: {
          created_at: string | null
          created_by_admin_id: string | null
          decline_count: number | null
          id: string
          internal_notes: string | null
          is_active: boolean | null
          last_decline_category: string | null
          last_decline_reason: string | null
          last_update_at: string | null
          match_room_id: string | null
          original_search_id: string | null
          progress_message: string | null
          progress_percentage: number | null
          sla_next_update_due_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["search_status"]
          updated_at: string | null
          user_id: string
          wishlist_item_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_admin_id?: string | null
          decline_count?: number | null
          id?: string
          internal_notes?: string | null
          is_active?: boolean | null
          last_decline_category?: string | null
          last_decline_reason?: string | null
          last_update_at?: string | null
          match_room_id?: string | null
          original_search_id?: string | null
          progress_message?: string | null
          progress_percentage?: number | null
          sla_next_update_due_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["search_status"]
          updated_at?: string | null
          user_id: string
          wishlist_item_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_admin_id?: string | null
          decline_count?: number | null
          id?: string
          internal_notes?: string | null
          is_active?: boolean | null
          last_decline_category?: string | null
          last_decline_reason?: string | null
          last_update_at?: string | null
          match_room_id?: string | null
          original_search_id?: string | null
          progress_message?: string | null
          progress_percentage?: number | null
          sla_next_update_due_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["search_status"]
          updated_at?: string | null
          user_id?: string
          wishlist_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_match_room"
            columns: ["match_room_id"]
            isOneToOne: false
            referencedRelation: "vault_match_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_searches_original_search_id_fkey"
            columns: ["original_search_id"]
            isOneToOne: false
            referencedRelation: "vault_searches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vault_member_rankings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "vault_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_searches_wishlist_item_id_fkey"
            columns: ["wishlist_item_id"]
            isOneToOne: false
            referencedRelation: "vault_wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_seller_profiles: {
        Row: {
          account_type: string | null
          active_strikes_count: number
          avatar_url: string | null
          average_rating: number | null
          bank_name: string | null
          bio: string | null
          cancellation_rate: number | null
          cnpj: string | null
          cpf_cnpj: string | null
          cpf_cnpj_encrypted: string | null
          created_at: string
          current_fee_percent: number
          dispute_rate: number | null
          followers_count: number
          full_name: string | null
          id: string
          id_back_url: string | null
          id_back_url_encrypted: string | null
          id_front_url: string | null
          id_front_url_encrypted: string | null
          id_selfie_url: string | null
          id_selfie_url_encrypted: string | null
          is_active: boolean
          is_business: boolean
          kyc_docs_deleted: boolean
          kyc_rejection_reason: string | null
          kyc_reviewed_at: string | null
          kyc_reviewed_by: string | null
          kyc_status: string
          member_id: string
          monthly_new_listings_count: number
          monthly_new_listings_reset_at: string
          on_time_shipping_rate: number | null
          onboarding_completed_at: string | null
          payout_speed_days: number | null
          phone: string | null
          pix_beneficiary: string | null
          pix_key: string | null
          pix_key_encrypted: string | null
          pix_key_type: string | null
          plan_id: string | null
          pro_approval_rate: number | null
          ratings_count: number
          seller_cep: string | null
          storefront_banner: string | null
          storefront_tagline: string | null
          storefront_theme: string | null
          support_priority: number
          suspended_until: string | null
          terms_accepted_at: string | null
          tier: string
          tier_updated_at: string | null
          total_sales_count: number
          total_sales_value: number
          updated_at: string
          verified_badge: boolean
        }
        Insert: {
          account_type?: string | null
          active_strikes_count?: number
          avatar_url?: string | null
          average_rating?: number | null
          bank_name?: string | null
          bio?: string | null
          cancellation_rate?: number | null
          cnpj?: string | null
          cpf_cnpj?: string | null
          cpf_cnpj_encrypted?: string | null
          created_at?: string
          current_fee_percent?: number
          dispute_rate?: number | null
          followers_count?: number
          full_name?: string | null
          id?: string
          id_back_url?: string | null
          id_back_url_encrypted?: string | null
          id_front_url?: string | null
          id_front_url_encrypted?: string | null
          id_selfie_url?: string | null
          id_selfie_url_encrypted?: string | null
          is_active?: boolean
          is_business?: boolean
          kyc_docs_deleted?: boolean
          kyc_rejection_reason?: string | null
          kyc_reviewed_at?: string | null
          kyc_reviewed_by?: string | null
          kyc_status?: string
          member_id: string
          monthly_new_listings_count?: number
          monthly_new_listings_reset_at?: string
          on_time_shipping_rate?: number | null
          onboarding_completed_at?: string | null
          payout_speed_days?: number | null
          phone?: string | null
          pix_beneficiary?: string | null
          pix_key?: string | null
          pix_key_encrypted?: string | null
          pix_key_type?: string | null
          plan_id?: string | null
          pro_approval_rate?: number | null
          ratings_count?: number
          seller_cep?: string | null
          storefront_banner?: string | null
          storefront_tagline?: string | null
          storefront_theme?: string | null
          support_priority?: number
          suspended_until?: string | null
          terms_accepted_at?: string | null
          tier?: string
          tier_updated_at?: string | null
          total_sales_count?: number
          total_sales_value?: number
          updated_at?: string
          verified_badge?: boolean
        }
        Update: {
          account_type?: string | null
          active_strikes_count?: number
          avatar_url?: string | null
          average_rating?: number | null
          bank_name?: string | null
          bio?: string | null
          cancellation_rate?: number | null
          cnpj?: string | null
          cpf_cnpj?: string | null
          cpf_cnpj_encrypted?: string | null
          created_at?: string
          current_fee_percent?: number
          dispute_rate?: number | null
          followers_count?: number
          full_name?: string | null
          id?: string
          id_back_url?: string | null
          id_back_url_encrypted?: string | null
          id_front_url?: string | null
          id_front_url_encrypted?: string | null
          id_selfie_url?: string | null
          id_selfie_url_encrypted?: string | null
          is_active?: boolean
          is_business?: boolean
          kyc_docs_deleted?: boolean
          kyc_rejection_reason?: string | null
          kyc_reviewed_at?: string | null
          kyc_reviewed_by?: string | null
          kyc_status?: string
          member_id?: string
          monthly_new_listings_count?: number
          monthly_new_listings_reset_at?: string
          on_time_shipping_rate?: number | null
          onboarding_completed_at?: string | null
          payout_speed_days?: number | null
          phone?: string | null
          pix_beneficiary?: string | null
          pix_key?: string | null
          pix_key_encrypted?: string | null
          pix_key_type?: string | null
          plan_id?: string | null
          pro_approval_rate?: number | null
          ratings_count?: number
          seller_cep?: string | null
          storefront_banner?: string | null
          storefront_tagline?: string | null
          storefront_theme?: string | null
          support_priority?: number
          suspended_until?: string | null
          terms_accepted_at?: string | null
          tier?: string
          tier_updated_at?: string | null
          total_sales_count?: number
          total_sales_value?: number
          updated_at?: string
          verified_badge?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "vault_seller_profiles_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "vault_member_rankings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "vault_seller_profiles_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_seller_profiles_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "marketplace_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_waitlist: {
        Row: {
          admin_notes: string | null
          city: string | null
          cpf: string | null
          created_at: string | null
          email: string
          id: string
          interests: string | null
          name: string
          phone: string | null
          reason: string | null
          referral_source: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          admin_notes?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          email: string
          id?: string
          interests?: string | null
          name: string
          phone?: string | null
          reason?: string | null
          referral_source?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          admin_notes?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string
          id?: string
          interests?: string | null
          name?: string
          phone?: string | null
          reason?: string | null
          referral_source?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: []
      }
      vault_wishlists: {
        Row: {
          assigned_to: string | null
          bid_amount: number | null
          bid_deadline: string | null
          colorway: string | null
          completed_at: string | null
          condition_pref:
            | Database["public"]["Enums"]["condition_preference"]
            | null
          condition_preference: string | null
          converted_order_id: string | null
          created_at: string | null
          decision_deadline: string | null
          id: string
          is_active: boolean | null
          max_price: number | null
          member_id: string
          min_price: number | null
          notes: string | null
          open_bid_enabled: boolean | null
          options_sent_at: string | null
          priority: number | null
          product_brand: string | null
          product_color: string | null
          product_link: string | null
          product_model: string | null
          product_name: string
          product_size: string | null
          reference_image_url: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["hunt_status"] | null
          title: string | null
          updated_at: string | null
          urgency: string | null
          urgency_level: Database["public"]["Enums"]["urgency_level"] | null
        }
        Insert: {
          assigned_to?: string | null
          bid_amount?: number | null
          bid_deadline?: string | null
          colorway?: string | null
          completed_at?: string | null
          condition_pref?:
            | Database["public"]["Enums"]["condition_preference"]
            | null
          condition_preference?: string | null
          converted_order_id?: string | null
          created_at?: string | null
          decision_deadline?: string | null
          id?: string
          is_active?: boolean | null
          max_price?: number | null
          member_id: string
          min_price?: number | null
          notes?: string | null
          open_bid_enabled?: boolean | null
          options_sent_at?: string | null
          priority?: number | null
          product_brand?: string | null
          product_color?: string | null
          product_link?: string | null
          product_model?: string | null
          product_name: string
          product_size?: string | null
          reference_image_url?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["hunt_status"] | null
          title?: string | null
          updated_at?: string | null
          urgency?: string | null
          urgency_level?: Database["public"]["Enums"]["urgency_level"] | null
        }
        Update: {
          assigned_to?: string | null
          bid_amount?: number | null
          bid_deadline?: string | null
          colorway?: string | null
          completed_at?: string | null
          condition_pref?:
            | Database["public"]["Enums"]["condition_preference"]
            | null
          condition_preference?: string | null
          converted_order_id?: string | null
          created_at?: string | null
          decision_deadline?: string | null
          id?: string
          is_active?: boolean | null
          max_price?: number | null
          member_id?: string
          min_price?: number | null
          notes?: string | null
          open_bid_enabled?: boolean | null
          options_sent_at?: string | null
          priority?: number | null
          product_brand?: string | null
          product_color?: string | null
          product_link?: string | null
          product_model?: string | null
          product_name?: string
          product_size?: string | null
          reference_image_url?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["hunt_status"] | null
          title?: string | null
          updated_at?: string | null
          urgency?: string | null
          urgency_level?: Database["public"]["Enums"]["urgency_level"] | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_wishlists_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "vault_member_rankings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "vault_wishlists_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_attempts: {
        Row: {
          code_attempted: string
          created_at: string
          id: string
          ip_address: string
          is_valid: boolean
        }
        Insert: {
          code_attempted: string
          created_at?: string
          id?: string
          ip_address: string
          is_valid?: boolean
        }
        Update: {
          code_attempted?: string
          created_at?: string
          id?: string
          ip_address?: string
          is_valid?: boolean
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string
          id: string
          reference_id: string | null
          reference_type: string | null
          type: string
          user_cpf: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type: string
          user_cpf: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          user_cpf?: string
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          id: string
          message_template: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id: string
          message_template: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          message_template?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      marketplace_cart_details: {
        Row: {
          added_at: string | null
          id: string | null
          offer_condition: string | null
          offer_id: string | null
          offer_interest_free_installments: number | null
          offer_photos: string[] | null
          offer_price: number | null
          offer_seller_id: string | null
          offer_shipping_mode: string | null
          offer_size: string | null
          offer_status: string | null
          product_brand: string | null
          product_id: string | null
          product_images: string[] | null
          product_model: string | null
          product_slug: string | null
          seller_name: string | null
          user_cpf: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_cart_items_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "marketplace_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_cart_items_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "marketplace_offers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_offers_seller_id_fkey"
            columns: ["offer_seller_id"]
            isOneToOne: false
            referencedRelation: "vault_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings_public: {
        Row: {
          brand: string | null
          colorway: string | null
          condition: string | null
          created_at: string | null
          description: string | null
          favorites_count: number | null
          id: string | null
          is_vault_certified: boolean | null
          model: string | null
          photos: string[] | null
          price: number | null
          pro_recommendation: string | null
          product_id: string | null
          published_at: string | null
          seller_id: string | null
          shipping_cost_estimate: number | null
          shipping_mode: string | null
          size: string | null
          sold_at: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          vault_item_id: string | null
          views_count: number | null
        }
        Insert: {
          brand?: string | null
          colorway?: string | null
          condition?: string | null
          created_at?: string | null
          description?: string | null
          favorites_count?: number | null
          id?: string | null
          is_vault_certified?: boolean | null
          model?: string | null
          photos?: string[] | null
          price?: number | null
          pro_recommendation?: string | null
          product_id?: string | null
          published_at?: string | null
          seller_id?: string | null
          shipping_cost_estimate?: number | null
          shipping_mode?: string | null
          size?: string | null
          sold_at?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          vault_item_id?: string | null
          views_count?: number | null
        }
        Update: {
          brand?: string | null
          colorway?: string | null
          condition?: string | null
          created_at?: string | null
          description?: string | null
          favorites_count?: number | null
          id?: string | null
          is_vault_certified?: boolean | null
          model?: string | null
          photos?: string[] | null
          price?: number | null
          pro_recommendation?: string | null
          product_id?: string | null
          published_at?: string | null
          seller_id?: string | null
          shipping_cost_estimate?: number | null
          shipping_mode?: string | null
          size?: string | null
          sold_at?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          vault_item_id?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_marketplace_listings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_marketplace_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "vault_seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_marketplace_listings_vault_item_id_fkey"
            columns: ["vault_item_id"]
            isOneToOne: false
            referencedRelation: "vault_items"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_offers_public: {
        Row: {
          activated_at: string | null
          boost_active_until: string | null
          boost_level: string | null
          condition: string | null
          created_at: string | null
          defects: string | null
          description: string | null
          has_receipt: boolean | null
          id: string | null
          listing_id: string | null
          photos: string[] | null
          price: number | null
          pro_recommendation: string | null
          product_id: string | null
          proof_photos: string[] | null
          published_at: string | null
          seller_id: string | null
          shipping_cost_estimate: number | null
          shipping_mode: string | null
          size: string | null
          size_system: string | null
          sold_at: string | null
          status: string | null
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          activated_at?: string | null
          boost_active_until?: string | null
          boost_level?: string | null
          condition?: string | null
          created_at?: string | null
          defects?: string | null
          description?: string | null
          has_receipt?: boolean | null
          id?: string | null
          listing_id?: string | null
          photos?: string[] | null
          price?: number | null
          pro_recommendation?: string | null
          product_id?: string | null
          proof_photos?: string[] | null
          published_at?: string | null
          seller_id?: string | null
          shipping_cost_estimate?: number | null
          shipping_mode?: string | null
          size?: string | null
          size_system?: string | null
          sold_at?: string | null
          status?: string | null
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          activated_at?: string | null
          boost_active_until?: string | null
          boost_level?: string | null
          condition?: string | null
          created_at?: string | null
          defects?: string | null
          description?: string | null
          has_receipt?: boolean | null
          id?: string | null
          listing_id?: string | null
          photos?: string[] | null
          price?: number | null
          pro_recommendation?: string | null
          product_id?: string | null
          proof_photos?: string[] | null
          published_at?: string | null
          seller_id?: string | null
          shipping_cost_estimate?: number | null
          shipping_mode?: string | null
          size?: string | null
          size_system?: string | null
          sold_at?: string | null
          status?: string | null
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "vault_marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_offers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "vault_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_product_comments_public: {
        Row: {
          content: string | null
          created_at: string | null
          id: string | null
          is_seller_reply: boolean | null
          is_visible: boolean | null
          parent_id: string | null
          product_id: string | null
          review_id: string | null
          user_cpf_masked: string | null
          user_name: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string | null
          is_seller_reply?: boolean | null
          is_visible?: boolean | null
          parent_id?: string | null
          product_id?: string | null
          review_id?: string | null
          user_cpf_masked?: never
          user_name?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string | null
          is_seller_reply?: boolean | null
          is_visible?: boolean | null
          parent_id?: string | null
          product_id?: string | null
          review_id?: string | null
          user_cpf_masked?: never
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_product_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "marketplace_product_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_product_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "marketplace_product_comments_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_product_comments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_product_comments_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "marketplace_product_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_product_comments_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "marketplace_product_reviews_public"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_product_reviews_public: {
        Row: {
          authenticity_score: number | null
          comment: string | null
          created_at: string | null
          id: string | null
          is_verified_purchase: boolean | null
          product_id: string | null
          product_quality: number | null
          rating: number | null
          review_photos: string[] | null
          reviewer_cpf_masked: string | null
          reviewer_name: string | null
          shipping_speed: number | null
        }
        Insert: {
          authenticity_score?: number | null
          comment?: string | null
          created_at?: string | null
          id?: string | null
          is_verified_purchase?: boolean | null
          product_id?: string | null
          product_quality?: number | null
          rating?: number | null
          review_photos?: string[] | null
          reviewer_cpf_masked?: never
          reviewer_name?: string | null
          shipping_speed?: number | null
        }
        Update: {
          authenticity_score?: number | null
          comment?: string | null
          created_at?: string | null
          id?: string | null
          is_verified_purchase?: boolean | null
          product_id?: string | null
          product_quality?: number | null
          rating?: number | null
          review_photos?: string[] | null
          reviewer_cpf_masked?: never
          reviewer_name?: string | null
          shipping_speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews_public: {
        Row: {
          admin_response: string | null
          admin_response_at: string | null
          client_cpf_masked: string | null
          client_name: string | null
          comment: string | null
          created_at: string | null
          customer_service: number | null
          delivery_speed: number | null
          id: string | null
          is_approved: boolean | null
          is_featured: boolean | null
          order_id: string | null
          product_quality: number | null
          rating: number | null
          would_recommend: boolean | null
        }
        Insert: {
          admin_response?: string | null
          admin_response_at?: string | null
          client_cpf_masked?: never
          client_name?: string | null
          comment?: string | null
          created_at?: string | null
          customer_service?: number | null
          delivery_speed?: number | null
          id?: string | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          order_id?: string | null
          product_quality?: number | null
          rating?: number | null
          would_recommend?: boolean | null
        }
        Update: {
          admin_response?: string | null
          admin_response_at?: string | null
          client_cpf_masked?: never
          client_name?: string | null
          comment?: string | null
          created_at?: string | null
          customer_service?: number | null
          delivery_speed?: number | null
          id?: string | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          order_id?: string | null
          product_quality?: number | null
          rating?: number | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
        ]
      }
      vault_member_rankings: {
        Row: {
          avatar_url: string | null
          badges_count: number | null
          client_name: string | null
          current_streak: number | null
          display_name: string | null
          longest_streak: number | null
          member_id: string | null
          posts_count: number | null
          stats_converted_invites: number | null
          stats_purchases_count_12m: number | null
          tier: Database["public"]["Enums"]["vault_tier"] | null
          total_logins: number | null
          total_purchases: number | null
          total_score: number | null
        }
        Relationships: []
      }
      wallet_balances: {
        Row: {
          balance: number | null
          last_transaction_at: string | null
          total_transactions: number | null
          user_cpf: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_post_comment: {
        Args: {
          p_content: string
          p_cpf: string
          p_parent_id?: string
          p_post_id: string
        }
        Returns: Json
      }
      apply_cashback_to_order: {
        Args: {
          p_cpf: string
          p_discount_amount: number
          p_order_id: string
          p_payment_type: string
        }
        Returns: boolean
      }
      approve_budget: { Args: { p_token: string }; Returns: boolean }
      approve_vault_match: {
        Args: { p_cpf: string; p_match_room_id: string }
        Returns: boolean
      }
      assert_caller_owns_cpf: { Args: { p_cpf: string }; Returns: undefined }
      auto_enroll_vault_member: {
        Args: { p_cpf: string; p_email?: string; p_name: string }
        Returns: string
      }
      auto_expire_marketplace_offers: { Args: never; Returns: number }
      calculate_protection_end: {
        Args: { delivery_date: string }
        Returns: string
      }
      calculate_seller_fee: {
        Args: { p_plan_id: string; p_total_sales: number }
        Returns: number
      }
      calculate_strike_severity: {
        Args: { p_seller_id: string }
        Returns: string
      }
      calculate_vault_tier: {
        Args: { p_total_purchases: number; p_total_spent: number }
        Returns: Database["public"]["Enums"]["vault_tier"]
      }
      check_seller_listing_limits: {
        Args: { p_seller_id: string }
        Returns: {
          active_count: number
          block_reason: string
          can_publish: boolean
          max_active: number
          max_monthly_new: number
          monthly_new_count: number
          plan_id: string
        }[]
      }
      check_vault_tier_eligibility: {
        Args: { p_member_id: string }
        Returns: {
          black_criteria_met: number
          current_tier: Database["public"]["Enums"]["vault_tier"]
          eligible_for_black: boolean
          eligible_for_privilege: boolean
          privilege_criteria_met: number
        }[]
      }
      check_verified_badge_eligibility: {
        Args: { p_seller_id: string }
        Returns: boolean
      }
      cleanup_rate_limit_entries: { Args: never; Returns: undefined }
      create_vault_invite: {
        Args: { p_cpf: string }
        Returns: {
          invite_code: string
          success: boolean
        }[]
      }
      create_vault_item_from_order: {
        Args: { p_member_id: string; p_order_id: string }
        Returns: string
      }
      create_vault_wishlist_item: {
        Args: {
          p_brand?: string
          p_color?: string
          p_condition?: string
          p_cpf: string
          p_max_price?: number
          p_min_price?: number
          p_model?: string
          p_notes?: string
          p_priority?: number
          p_size?: string
          p_title: string
          p_urgency?: string
        }
        Returns: string
      }
      decline_vault_match: {
        Args: { p_cpf: string; p_match_room_id: string; p_reason?: string }
        Returns: boolean
      }
      decrypt_pii: { Args: { ciphertext: string }; Returns: string }
      downgrade_seller_to_free: {
        Args: { p_seller_id: string }
        Returns: undefined
      }
      encrypt_pii: { Args: { plaintext: string }; Returns: string }
      ensure_vault_membership: {
        Args: { p_cpf: string }
        Returns: {
          active_hunts: number
          client_name: string
          community_opt_in: boolean
          id: string
          invites_remaining: number
          is_new_member: boolean
          joined_via: string
          max_active_hunts: number
          max_wishlist_items: number
          tier: Database["public"]["Enums"]["vault_tier"]
          total_purchases: number
        }[]
      }
      generate_authenticity_code: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      generate_vault_invite_code: { Args: never; Returns: string }
      generate_vault_item_id: { Args: never; Returns: string }
      get_admin_client_heatmap: {
        Args: never
        Returns: {
          client_count: number
          revenue: number
          state_code: string
        }[]
      }
      get_admin_dashboard_metrics: {
        Args: never
        Returns: {
          approved_budgets: number
          avg_time_to_approval_hours: number
          avg_time_to_close_days: number
          balance_received: number
          delivered_count: number
          pending_budgets: number
          pending_revenue: number
          rejected_budgets: number
          sinal_paid_count: number
          sinal_received: number
          total_budgets_sent: number
          total_revenue: number
        }[]
      }
      get_admin_dashboard_overview: { Args: never; Returns: Json }
      get_admin_finance_chart: {
        Args: {
          p_end: string
          p_fee_card?: number
          p_fee_pix?: number
          p_start: string
        }
        Returns: {
          costs: number
          month: string
          profit: number
          revenue: number
        }[]
      }
      get_admin_finance_cost_breakdown: {
        Args: {
          p_end: string
          p_fee_card?: number
          p_fee_pix?: number
          p_start: string
        }
        Returns: {
          category: string
          total: number
        }[]
      }
      get_admin_finance_kpis: {
        Args: {
          p_end: string
          p_fee_card?: number
          p_fee_pix?: number
          p_start: string
        }
        Returns: {
          average_ticket: number
          gross_profit: number
          paid_orders: number
          profit_margin: number
          total_costs: number
          total_orders: number
          total_payment_fees: number
          total_revenue: number
        }[]
      }
      get_admin_finance_monthly: {
        Args: never
        Returns: {
          costs: number
          margin: number
          month_key: string
          orders_count: number
          profit: number
          revenue: number
        }[]
      }
      get_admin_finance_orders: {
        Args: {
          p_end: string
          p_fee_card?: number
          p_fee_pix?: number
          p_start: string
          p_status?: string
        }
        Returns: {
          client_name: string
          created_at: string
          current_status: string
          margin: number
          order_id: string
          other_costs: number
          payment_fees: number
          product_cost: number
          product_name: string
          profit: number
          revenue: number
          shipping_cost: number
        }[]
      }
      get_admin_order_requests:
        | {
            Args: never
            Returns: {
              additional_notes: string
              address_cep: string
              address_city: string
              address_complement: string
              address_neighborhood: string
              address_number: string
              address_state: string
              address_street: string
              admin_notes: string
              client_cpf: string
              client_email: string
              client_name: string
              client_phone: string
              converted_order_id: string
              created_at: string
              id: string
              product_brand: string
              product_color: string
              product_link: string
              product_model: string
              reference_image_url: string
              referral_code: string
              reviewed_at: string
              reviewed_by: string
              shoe_size: string
              status: string
            }[]
          }
        | {
            Args: { p_limit?: number; p_offset?: number; p_search?: string }
            Returns: Json
          }
      get_admin_orders_by_month: {
        Args: never
        Returns: {
          faturamento: number
          month_key: string
          pedidos: number
        }[]
      }
      get_admin_orders_by_status: {
        Args: never
        Returns: {
          count: number
          status_group: string
        }[]
      }
      get_admin_orders_csv:
        | {
            Args: never
            Returns: {
              client_cpf: string
              client_name: string
              created_at: string
              current_status: string
              order_id: string
              product_name: string
              product_price: number
            }[]
          }
        | {
            Args: { p_date_from?: string; p_search?: string; p_status?: string }
            Returns: {
              client_cpf: string
              client_name: string
              created_at: string
              current_status: string
              order_id: string
              product_name: string
              product_price: number
              sla_vault_due_date: string
            }[]
          }
      get_admin_report_pdf_data: {
        Args: {
          p_last_month_end: string
          p_last_month_start: string
          p_month_end: string
          p_month_start: string
        }
        Returns: Json
      }
      get_client_available_cashback: {
        Args: { p_cpf: string }
        Returns: {
          referral_ids: string[]
          total_percentage: number
        }[]
      }
      get_client_documents: {
        Args: { p_cpf: string }
        Returns: {
          document_name: string
          document_type: string
          file_url: string
          generated_at: string
          id: string
          order_id: string
        }[]
      }
      get_client_orders:
        | {
            Args: never
            Returns: {
              authenticity_code: string | null
              authenticity_verification_count: number | null
              authenticity_verified_at: string | null
              balance_due_date: string | null
              balance_paid: boolean | null
              balance_paid_at: string | null
              balance_payment_method:
                | Database["public"]["Enums"]["payment_method"]
                | null
              balance_pix_transaction_id: string | null
              balance_proof_url: string | null
              balance_stripe_payment_id: string | null
              balance_value: number | null
              budget_approval_token: string | null
              budget_approved_at: string | null
              budget_expires_at: string | null
              budget_rejected_at: string | null
              budget_rejection_reason: string | null
              budget_sent_at: string | null
              budget_status: Database["public"]["Enums"]["budget_status"] | null
              client_address: string | null
              client_cpf: string
              client_email: string | null
              client_name: string
              client_phone: string | null
              contract_accepted_at: string | null
              contract_accepted_ip: string | null
              created_at: string
              current_status: Database["public"]["Enums"]["order_status"]
              inspection_photos: string[] | null
              internal_notes: string | null
              international_carrier: string | null
              international_tracking: string | null
              national_carrier: string | null
              national_tracking: string | null
              order_id: string
              order_type: Database["public"]["Enums"]["order_type"]
              other_costs: number | null
              other_costs_description: string | null
              payment_mode: string | null
              pix_copy_paste: string | null
              pix_qr_code: string | null
              product_brand: string | null
              product_color: string | null
              product_cost: number | null
              product_currency: string | null
              product_link: string | null
              product_model: string | null
              product_name: string
              product_price: number | null
              product_reference: string | null
              product_size: string | null
              reference_image_url: string | null
              shipping_cost: number | null
              sinal_paid: boolean | null
              sinal_paid_at: string | null
              sinal_payment_method:
                | Database["public"]["Enums"]["payment_method"]
                | null
              sinal_pix_transaction_id: string | null
              sinal_proof_url: string | null
              sinal_stripe_payment_id: string | null
              sinal_value: number | null
              sla_vault_due_date: string | null
              updated_at: string
            }[]
            SetofOptions: {
              from: "*"
              to: "orders"
              isOneToOne: false
              isSetofReturn: true
            }
          }
        | {
            Args: { p_cpf: string }
            Returns: {
              balance_paid: boolean
              balance_value: number
              budget_status: Database["public"]["Enums"]["budget_status"]
              created_at: string
              current_status: Database["public"]["Enums"]["order_status"]
              order_id: string
              order_type: Database["public"]["Enums"]["order_type"]
              product_brand: string
              product_model: string
              product_name: string
              product_price: number
              product_size: string
              sinal_paid: boolean
              sinal_value: number
              updated_at: string
            }[]
          }
      get_client_preferences: {
        Args: { p_cpf: string }
        Returns: {
          favorite_brands: string[]
          notification_email: boolean
          notification_push: boolean
          notification_whatsapp: boolean
          preferred_colors: string[]
          preferred_sizes: string[]
        }[]
      }
      get_client_profile: {
        Args: never
        Returns: {
          avatar_url: string
          cpf: string
          full_name: string
          id: string
          phone: string
          user_id: string
          vault_member_id: string
          vault_status: string
          vault_tier: string
        }[]
      }
      get_client_referrals: {
        Args: { p_cpf: string }
        Returns: {
          created_at: string
          discount_percentage: number
          discount_used: boolean
          id: string
          referral_code: string
          referred_name: string
          status: string
        }[]
      }
      get_current_seller_id: { Args: never; Returns: string }
      get_following_feed: {
        Args: { p_cpf: string; p_limit?: number; p_offset?: number }
        Returns: {
          attachments: string[]
          author_avatar: string
          author_items_count: number
          author_name: string
          author_tier: string
          comments_count: number
          content: string
          created_at: string
          has_liked: boolean
          id: string
          is_pinned: boolean
          likes_count: number
          media_types: string[]
          reactions_summary: Json
          title: string
          type: string
          user_id: string
          user_reactions: string[]
        }[]
      }
      get_loyalty_balance: { Args: { p_cpf: string }; Returns: number }
      get_marketplace_fee_percent: {
        Args: { sales_count: number }
        Returns: number
      }
      get_member_connections: {
        Args: {
          p_cpf: string
          p_limit?: number
          p_member_id: string
          p_offset?: number
          p_type: string
        }
        Returns: Json
      }
      get_member_public_profile: {
        Args: { p_cpf: string; p_member_id: string }
        Returns: Json
      }
      get_my_cpf: { Args: never; Returns: string }
      get_online_community_users: {
        Args: { p_minutes?: number }
        Returns: {
          items_count: number
          last_seen_at: string
          user_id: string
          user_name: string
          user_tier: string
        }[]
      }
      get_order_by_token:
        | {
            Args: { p_token: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.get_order_by_token(p_token => text), public.get_order_by_token(p_token => uuid). Try renaming the parameters or the function itself in the database so function overloading can be resolved"[]
          }
        | {
            Args: { p_token: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.get_order_by_token(p_token => text), public.get_order_by_token(p_token => uuid). Try renaming the parameters or the function itself in the database so function overloading can be resolved"[]
          }
      get_order_history: {
        Args: { p_cpf: string; p_order_id: string }
        Returns: {
          history_timestamp: string
          notes: string
          status: Database["public"]["Enums"]["order_status"]
        }[]
      }
      get_own_community_profile: { Args: { p_cpf: string }; Returns: Json }
      get_post_comments: {
        Args: { p_cpf: string; p_post_id: string }
        Returns: {
          author_name: string
          author_tier: string
          content: string
          created_at: string
          has_liked: boolean
          id: string
          likes_count: number
          parent_id: string
          reactions_summary: Json
          user_id: string
          user_reactions: string[]
        }[]
      }
      get_trending_posts: {
        Args: { p_limit?: number }
        Returns: {
          author_name: string
          comments_count: number
          id: string
          likes_count: number
          title: string
        }[]
      }
      get_vault_badges: {
        Args: { p_cpf: string }
        Returns: {
          badge_description: string
          badge_icon: string
          badge_name: string
          badge_type: string
          earned_at: string
        }[]
      }
      get_vault_club_tier_limits: {
        Args: { p_tier: Database["public"]["Enums"]["vault_tier"] }
        Returns: {
          decision_window_hours: number
          invites_per_semester: number
          max_active_searches: number
          max_wishlist_items: number
          sla_first_response_hours: number
          sla_match_room_hours: number
          sla_update_frequency_hours: number
        }[]
      }
      get_vault_collection: {
        Args: { p_cpf: string }
        Returns: {
          authenticity_code: string
          inspection_photos: string[]
          order_id: string
          product_brand: string
          product_color: string
          product_model: string
          product_name: string
          product_size: string
          purchase_date: string
          vault_id: string
        }[]
      }
      get_vault_community_feed: {
        Args: { p_cpf: string; p_limit?: number; p_offset?: number }
        Returns: {
          attachments: string[]
          author_avatar: string
          author_items_count: number
          author_name: string
          author_tier: string
          comments_count: number
          content: string
          created_at: string
          has_liked: boolean
          id: string
          is_pinned: boolean
          likes_count: number
          media_types: string[]
          reactions_summary: Json
          title: string
          type: string
          user_id: string
          user_reactions: string[]
        }[]
      }
      get_vault_community_posts: {
        Args: { p_cpf: string }
        Returns: {
          attachments: string[]
          author_name: string
          author_tier: string
          content: string
          created_at: string
          id: string
          title: string
          type: string
        }[]
      }
      get_vault_hunt_options: {
        Args: { p_cpf: string; p_hunt_id: string }
        Returns: {
          admin_recommendation: boolean
          condition: string
          currency: string
          estimated_total_brl: number
          id: string
          images: string[]
          is_selected: boolean
          price: number
          risk_level: string
          shipping_estimate: string
          supplier_country: string
          supplier_name: string
        }[]
      }
      get_vault_intel_posts: {
        Args: { p_cpf: string }
        Returns: {
          content: string
          cover_image: string
          excerpt: string
          external_link: string
          id: string
          is_featured: boolean
          likes_count: number
          media_urls: string[]
          published_at: string
          read_time_min: number
          title: string
          type: string
          video_url: string
          visibility: string
        }[]
      }
      get_vault_invites: {
        Args: { p_cpf: string }
        Returns: {
          created_at: string
          expires_at: string
          id: string
          invite_code: string
          recipient_name: string
          reward_granted: boolean
          status: string
          used_at: string
        }[]
      }
      get_vault_item_certificate_url: {
        Args: { p_item_id: string }
        Returns: Json
      }
      get_vault_match_room: {
        Args: { p_cpf: string; p_match_room_id: string }
        Returns: {
          created_at: string
          decision_deadline_at: string
          decision_status: Database["public"]["Enums"]["match_decision_status"]
          id: string
          options: Json
          search_id: string
          wishlist_title: string
        }[]
      }
      get_vault_member: {
        Args: { p_cpf: string }
        Returns: {
          active_hunts: number
          client_name: string
          community_opt_in: boolean
          created_at: string
          following_count: number
          id: string
          invites_remaining: number
          joined_via: string
          max_active_hunts: number
          max_wishlist_items: number
          preferred_brands: string[]
          preferred_sizes: string[]
          stats_converted_invites: number
          stats_decision_rate: number
          stats_purchases_count_12m: number
          stats_spend_total_12m: number
          tier: string
          total_purchases: number
        }[]
      }
      get_vault_member_items: {
        Args: { p_cpf: string }
        Returns: {
          brand: string
          certificate_pdf_url: string
          colorway: string
          id: string
          inspection_photos: string[]
          model: string
          purchase_date: string
          purchase_value: number
          qr_private_url: string
          size: string
          title: string
          vault_id: string
          verified_status: Database["public"]["Enums"]["vault_verified_status"]
        }[]
      }
      get_vault_member_searches: {
        Args: { p_cpf: string }
        Returns: {
          decision_status: Database["public"]["Enums"]["match_decision_status"]
          has_match_room: boolean
          is_active: boolean
          last_update_at: string
          match_room_id: string
          progress_message: string
          progress_percentage: number
          search_id: string
          started_at: string
          status: Database["public"]["Enums"]["search_status"]
          wishlist_title: string
        }[]
      }
      get_vault_member_wishlists: {
        Args: { p_cpf: string }
        Returns: {
          condition_pref: string
          created_at: string
          id: string
          max_price: number
          min_price: number
          notes: string
          priority: number
          product_brand: string
          product_color: string
          product_model: string
          product_size: string
          title: string
          urgency_level: string
        }[]
      }
      get_vault_tier_limits: {
        Args: { p_tier: Database["public"]["Enums"]["vault_tier"] }
        Returns: {
          invites_per_semester: number
          max_hunts: number
          max_wishlist: number
        }[]
      }
      get_vault_wishlists: {
        Args: { p_cpf: string }
        Returns: {
          created_at: string
          decision_deadline: string
          id: string
          max_price: number
          options_count: number
          product_brand: string
          product_model: string
          product_name: string
          product_size: string
          status: Database["public"]["Enums"]["hunt_status"]
          urgency: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { _user_id: string }; Returns: boolean }
      mask_cpf: { Args: { cpf_value: string }; Returns: string }
      mask_email: { Args: { email: string }; Returns: string }
      record_vault_login: { Args: { p_cpf: string }; Returns: Json }
      reject_budget: {
        Args: { p_reason?: string; p_token: string }
        Returns: boolean
      }
      report_community_post: {
        Args: {
          p_cpf: string
          p_details?: string
          p_post_id: string
          p_reason: string
        }
        Returns: Json
      }
      search_faqs: {
        Args: { p_persona?: string; p_query: string }
        Returns: {
          answer: string
          category: string
          id: string
          persona: string
          question: string
          rank: number
        }[]
      }
      start_vault_search: {
        Args: { p_cpf: string; p_wishlist_id: string }
        Returns: string
      }
      toggle_comment_like: {
        Args: { p_comment_id: string; p_cpf: string }
        Returns: Json
      }
      toggle_comment_reaction: {
        Args: { p_comment_id: string; p_cpf: string; p_reaction_type: string }
        Returns: Json
      }
      toggle_follow: {
        Args: { p_cpf: string; p_target_member_id: string }
        Returns: Json
      }
      toggle_post_like: {
        Args: { p_cpf: string; p_post_id: string }
        Returns: Json
      }
      toggle_post_reaction: {
        Args: { p_cpf: string; p_post_id: string; p_reaction_type: string }
        Returns: Json
      }
      track_order: {
        Args: { p_cpf: string; p_order_id: string }
        Returns: {
          balance_due_date: string
          balance_paid: boolean
          balance_value: number
          budget_approval_token: string
          budget_status: Database["public"]["Enums"]["budget_status"]
          client_name: string
          created_at: string
          current_status: Database["public"]["Enums"]["order_status"]
          international_tracking: string
          national_carrier: string
          national_tracking: string
          order_id: string
          order_type: Database["public"]["Enums"]["order_type"]
          product_currency: string
          product_name: string
          product_price: number
          product_reference: string
          sinal_paid: boolean
          sinal_value: number
          sla_vault_due_date: string
        }[]
      }
      update_member_profile: {
        Args: {
          p_avatar_url?: string
          p_bio?: string
          p_city?: string
          p_cpf: string
          p_display_name?: string
          p_facebook_url?: string
          p_instagram_url?: string
          p_is_profile_public?: boolean
          p_linkedin_url?: string
          p_state?: string
          p_twitter_url?: string
        }
        Returns: Json
      }
      update_presence: { Args: { p_cpf: string }; Returns: undefined }
      update_vault_community_opt_in: {
        Args: { p_cpf: string; p_opt_in: boolean }
        Returns: boolean
      }
      upsert_client_preferences: {
        Args: {
          p_cpf: string
          p_favorite_brands?: string[]
          p_notification_email?: boolean
          p_notification_push?: boolean
          p_notification_whatsapp?: boolean
          p_preferred_colors?: string[]
          p_preferred_sizes?: string[]
        }
        Returns: boolean
      }
      validate_vault_invite: {
        Args: { p_code: string }
        Returns: {
          expires_at: string
          invite_id: string
          inviter_name: string
          is_valid: boolean
          status: string
        }[]
      }
      verify_authenticity: {
        Args: { p_code: string }
        Returns: {
          client_name: string
          created_at: string
          inspection_photos: string[]
          is_valid: boolean
          order_id: string
          product_brand: string
          product_color: string
          product_model: string
          product_name: string
          product_size: string
          verification_count: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      budget_status: "PENDING" | "SENT" | "APPROVED" | "REJECTED" | "EXPIRED"
      community_post_status: "PUBLISHED" | "PENDING_REVIEW" | "REMOVED"
      community_post_type: "SHOWCASE" | "DISCUSSION" | "POLL" | "ISO_WTB"
      condition_preference: "DS" | "VNDS" | "USED_OK"
      hunt_status:
        | "queued"
        | "curating"
        | "options_found"
        | "validating"
        | "pending_decision"
        | "confirmed"
        | "converted"
        | "cancelled"
      intel_post_type: "RADAR" | "GUIDE" | "ALERT" | "EVENT"
      intel_visibility: "ALL" | "PRIVILEGE_PLUS" | "BLACK_ONLY"
      match_decision_status: "PENDING" | "APPROVED" | "DECLINED" | "EXPIRED"
      notification_target: "admin" | "client"
      notification_type:
        | "new_order_request"
        | "order_status_update"
        | "budget_sent"
        | "budget_approved"
        | "budget_rejected"
        | "payment_received"
        | "order_delivered"
        | "system_alert"
        | "cashback_available"
        | "cashback_expiring"
      order_status:
        | "ORDER_CONFIRMED"
        | "SOURCING"
        | "NEGOTIATING"
        | "PURCHASE_COMPLETED"
        | "PACKAGE_EN_ROUTE"
        | "ARRIVED"
        | "INSPECTION_APPROVED"
        | "BALANCE_DUE"
        | "INTERNATIONAL_DISPATCH"
        | "CUSTOMS"
        | "NATIONAL_TRANSIT"
        | "DISPATCHED"
        | "DELIVERED"
        | "REQUEST_RECEIVED"
        | "BUDGET_SENT"
        | "DEPOSIT_CONFIRMED"
        | "SEARCH_SELECTION"
        | "PRODUCT_FOUND"
        | "PREPARING_INTERNATIONAL"
        | "INTERNATIONAL_TRANSIT"
        | "ARRIVED_BRAZIL"
        | "PRODUCT_INSPECTED"
        | "BALANCE_PENDING"
        | "FULLY_PAID"
        | "SHIPPED_TO_CLIENT"
        | "LOST"
      order_type: "READY" | "VAULT"
      payment_method: "PIX" | "CREDIT_CARD"
      search_status:
        | "RECEIVED"
        | "IN_CURATION"
        | "OPTIONS_IDENTIFIED"
        | "VALIDATING"
        | "MATCH_SENT"
        | "AWAITING_DECISION"
        | "CLOSED_APPROVED"
        | "CLOSED_NOT_FOUND"
        | "CLOSED_CANCELLED"
      search_update_type: "UPDATE" | "ALERT" | "REQUEST_INFO"
      urgency_level: "NOW" | "FLEXIBLE"
      vault_member_status: "ACTIVE" | "SUSPENDED" | "BANNED"
      vault_tier: "member" | "collector" | "elite"
      vault_verified_status: "VERIFIED" | "PENDING" | "REVOKED"
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
      app_role: ["admin", "user"],
      budget_status: ["PENDING", "SENT", "APPROVED", "REJECTED", "EXPIRED"],
      community_post_status: ["PUBLISHED", "PENDING_REVIEW", "REMOVED"],
      community_post_type: ["SHOWCASE", "DISCUSSION", "POLL", "ISO_WTB"],
      condition_preference: ["DS", "VNDS", "USED_OK"],
      hunt_status: [
        "queued",
        "curating",
        "options_found",
        "validating",
        "pending_decision",
        "confirmed",
        "converted",
        "cancelled",
      ],
      intel_post_type: ["RADAR", "GUIDE", "ALERT", "EVENT"],
      intel_visibility: ["ALL", "PRIVILEGE_PLUS", "BLACK_ONLY"],
      match_decision_status: ["PENDING", "APPROVED", "DECLINED", "EXPIRED"],
      notification_target: ["admin", "client"],
      notification_type: [
        "new_order_request",
        "order_status_update",
        "budget_sent",
        "budget_approved",
        "budget_rejected",
        "payment_received",
        "order_delivered",
        "system_alert",
        "cashback_available",
        "cashback_expiring",
      ],
      order_status: [
        "ORDER_CONFIRMED",
        "SOURCING",
        "NEGOTIATING",
        "PURCHASE_COMPLETED",
        "PACKAGE_EN_ROUTE",
        "ARRIVED",
        "INSPECTION_APPROVED",
        "BALANCE_DUE",
        "INTERNATIONAL_DISPATCH",
        "CUSTOMS",
        "NATIONAL_TRANSIT",
        "DISPATCHED",
        "DELIVERED",
        "REQUEST_RECEIVED",
        "BUDGET_SENT",
        "DEPOSIT_CONFIRMED",
        "SEARCH_SELECTION",
        "PRODUCT_FOUND",
        "PREPARING_INTERNATIONAL",
        "INTERNATIONAL_TRANSIT",
        "ARRIVED_BRAZIL",
        "PRODUCT_INSPECTED",
        "BALANCE_PENDING",
        "FULLY_PAID",
        "SHIPPED_TO_CLIENT",
        "LOST",
      ],
      order_type: ["READY", "VAULT"],
      payment_method: ["PIX", "CREDIT_CARD"],
      search_status: [
        "RECEIVED",
        "IN_CURATION",
        "OPTIONS_IDENTIFIED",
        "VALIDATING",
        "MATCH_SENT",
        "AWAITING_DECISION",
        "CLOSED_APPROVED",
        "CLOSED_NOT_FOUND",
        "CLOSED_CANCELLED",
      ],
      search_update_type: ["UPDATE", "ALERT", "REQUEST_INFO"],
      urgency_level: ["NOW", "FLEXIBLE"],
      vault_member_status: ["ACTIVE", "SUSPENDED", "BANNED"],
      vault_tier: ["member", "collector", "elite"],
      vault_verified_status: ["VERIFIED", "PENDING", "REVOKED"],
    },
  },
} as const
