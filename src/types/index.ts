import type { Database } from "@/integrations/supabase/types";

// ── Row types (full database rows) ──────────────────────────────────
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type ClientProfile = Database["public"]["Tables"]["client_profiles"]["Row"];
export type MarketplaceListing = Database["public"]["Tables"]["vault_marketplace_listings"]["Row"];
export type MarketplaceOffer = Database["public"]["Tables"]["marketplace_offers"]["Row"];
export type MarketplaceProduct = Database["public"]["Tables"]["marketplace_products"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

// ── Enum types ──────────────────────────────────────────────────────
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type OrderType = Database["public"]["Enums"]["order_type"];
export type BudgetStatus = Database["public"]["Enums"]["budget_status"];
export type NotificationType = Database["public"]["Enums"]["notification_type"];
export type NotificationTarget = Database["public"]["Enums"]["notification_target"];

// ── Insert / Update helpers ─────────────────────────────────────────
export type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
export type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];
export type ClientProfileInsert = Database["public"]["Tables"]["client_profiles"]["Insert"];
export type ClientProfileUpdate = Database["public"]["Tables"]["client_profiles"]["Update"];
