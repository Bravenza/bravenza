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
      client_auth_tokens: {
        Row: {
          cpf: string
          created_at: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          cpf: string
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          cpf?: string
          created_at?: string
          expires_at?: string
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
          notification_push?: boolean | null
          notification_whatsapp?: boolean | null
          preferred_colors?: string[] | null
          preferred_sizes?: string[] | null
          updated_at?: string
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
      faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_active: boolean | null
          order_index: number | null
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          question?: string
          updated_at?: string
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
      vault_invites: {
        Row: {
          created_at: string | null
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
          used_at: string | null
          used_by_member_id: string | null
        }
        Insert: {
          created_at?: string | null
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
          used_at?: string | null
          used_by_member_id?: string | null
        }
        Update: {
          created_at?: string | null
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
          used_at?: string | null
          used_by_member_id?: string | null
        }
        Relationships: [
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
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_members: {
        Row: {
          active_hunts: number | null
          client_cpf: string
          client_email: string | null
          client_name: string
          created_at: string | null
          id: string
          invited_by: string | null
          invites_remaining: number | null
          invites_semester_reset: string | null
          is_active: boolean | null
          joined_via: string | null
          max_active_hunts: number | null
          max_wishlist_items: number | null
          preferred_brands: string[] | null
          preferred_sizes: string[] | null
          preferred_styles: string[] | null
          tier: Database["public"]["Enums"]["vault_tier"]
          tier_upgraded_at: string | null
          total_purchases: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          active_hunts?: number | null
          client_cpf: string
          client_email?: string | null
          client_name: string
          created_at?: string | null
          id?: string
          invited_by?: string | null
          invites_remaining?: number | null
          invites_semester_reset?: string | null
          is_active?: boolean | null
          joined_via?: string | null
          max_active_hunts?: number | null
          max_wishlist_items?: number | null
          preferred_brands?: string[] | null
          preferred_sizes?: string[] | null
          preferred_styles?: string[] | null
          tier?: Database["public"]["Enums"]["vault_tier"]
          tier_upgraded_at?: string | null
          total_purchases?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          active_hunts?: number | null
          client_cpf?: string
          client_email?: string | null
          client_name?: string
          created_at?: string | null
          id?: string
          invited_by?: string | null
          invites_remaining?: number | null
          invites_semester_reset?: string | null
          is_active?: boolean | null
          joined_via?: string | null
          max_active_hunts?: number | null
          max_wishlist_items?: number | null
          preferred_brands?: string[] | null
          preferred_sizes?: string[] | null
          preferred_styles?: string[] | null
          tier?: Database["public"]["Enums"]["vault_tier"]
          tier_upgraded_at?: string | null
          total_purchases?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_waitlist: {
        Row: {
          admin_notes: string | null
          cpf: string | null
          created_at: string | null
          email: string
          id: string
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
          cpf?: string | null
          created_at?: string | null
          email: string
          id?: string
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
          cpf?: string | null
          created_at?: string | null
          email?: string
          id?: string
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
          completed_at: string | null
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
          updated_at: string | null
          urgency: string | null
        }
        Insert: {
          assigned_to?: string | null
          bid_amount?: number | null
          bid_deadline?: string | null
          completed_at?: string | null
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
          updated_at?: string | null
          urgency?: string | null
        }
        Update: {
          assigned_to?: string | null
          bid_amount?: number | null
          bid_deadline?: string | null
          completed_at?: string | null
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
          updated_at?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_wishlists_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "vault_members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      calculate_vault_tier: {
        Args: { p_total_purchases: number; p_total_spent: number }
        Returns: Database["public"]["Enums"]["vault_tier"]
      }
      generate_authenticity_code: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      generate_vault_invite_code: { Args: never; Returns: string }
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
      get_client_orders: {
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
      get_order_by_token: {
        Args: { p_token: string }
        Returns: {
          balance_paid: boolean
          balance_value: number
          budget_expires_at: string
          budget_status: Database["public"]["Enums"]["budget_status"]
          client_cpf: string
          client_name: string
          created_at: string
          order_id: string
          order_type: Database["public"]["Enums"]["order_type"]
          payment_mode: string
          product_brand: string
          product_color: string
          product_currency: string
          product_model: string
          product_name: string
          product_price: number
          product_size: string
          sinal_paid: boolean
          sinal_value: number
        }[]
      }
      get_order_history: {
        Args: { p_cpf: string; p_order_id: string }
        Returns: {
          history_timestamp: string
          notes: string
          status: Database["public"]["Enums"]["order_status"]
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
      get_vault_member: {
        Args: { p_cpf: string }
        Returns: {
          active_hunts: number
          created_at: string
          id: string
          invites_remaining: number
          joined_via: string
          max_active_hunts: number
          max_wishlist_items: number
          preferred_brands: string[]
          preferred_sizes: string[]
          tier: Database["public"]["Enums"]["vault_tier"]
          total_purchases: number
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
      is_admin: { Args: never; Returns: boolean }
      reject_budget: {
        Args: { p_reason?: string; p_token: string }
        Returns: boolean
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
      hunt_status:
        | "queued"
        | "curating"
        | "options_found"
        | "validating"
        | "pending_decision"
        | "confirmed"
        | "converted"
        | "cancelled"
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
      vault_tier: "member" | "collector" | "elite"
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
      vault_tier: ["member", "collector", "elite"],
    },
  },
} as const
