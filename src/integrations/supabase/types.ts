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
          reviewed_at?: string | null
          reviewed_by?: string | null
          shoe_size?: string
          status?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
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
          internal_notes: string | null
          international_tracking: string | null
          national_carrier: string | null
          national_tracking: string | null
          order_id: string
          order_type: Database["public"]["Enums"]["order_type"]
          pix_copy_paste: string | null
          pix_qr_code: string | null
          product_brand: string | null
          product_color: string | null
          product_currency: string | null
          product_link: string | null
          product_model: string | null
          product_name: string
          product_price: number | null
          product_reference: string | null
          product_size: string | null
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
          internal_notes?: string | null
          international_tracking?: string | null
          national_carrier?: string | null
          national_tracking?: string | null
          order_id: string
          order_type?: Database["public"]["Enums"]["order_type"]
          pix_copy_paste?: string | null
          pix_qr_code?: string | null
          product_brand?: string | null
          product_color?: string | null
          product_currency?: string | null
          product_link?: string | null
          product_model?: string | null
          product_name: string
          product_price?: number | null
          product_reference?: string | null
          product_size?: string | null
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
          internal_notes?: string | null
          international_tracking?: string | null
          national_carrier?: string | null
          national_tracking?: string | null
          order_id?: string
          order_type?: Database["public"]["Enums"]["order_type"]
          pix_copy_paste?: string | null
          pix_qr_code?: string | null
          product_brand?: string | null
          product_color?: string | null
          product_currency?: string | null
          product_link?: string | null
          product_model?: string | null
          product_name?: string
          product_price?: number | null
          product_reference?: string | null
          product_size?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_budget: { Args: { p_token: string }; Returns: boolean }
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
      get_order_by_token: {
        Args: { p_token: string }
        Returns: {
          balance_paid: boolean
          balance_value: number
          budget_expires_at: string
          budget_status: Database["public"]["Enums"]["budget_status"]
          client_name: string
          created_at: string
          order_id: string
          order_type: Database["public"]["Enums"]["order_type"]
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
          client_name: string
          created_at: string
          current_status: Database["public"]["Enums"]["order_status"]
          international_tracking: string
          national_carrier: string
          national_tracking: string
          order_id: string
          order_type: Database["public"]["Enums"]["order_type"]
          product_name: string
          product_reference: string
          sla_vault_due_date: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      budget_status: "PENDING" | "SENT" | "APPROVED" | "REJECTED" | "EXPIRED"
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
      order_type: "READY" | "VAULT"
      payment_method: "PIX" | "CREDIT_CARD"
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
      ],
      order_type: ["READY", "VAULT"],
      payment_method: ["PIX", "CREDIT_CARD"],
    },
  },
} as const
