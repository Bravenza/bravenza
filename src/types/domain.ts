/**
 * Domain types derived from the Supabase auto-generated schema.
 *
 * Each type maps directly to a database table Row, Insert, or Update shape.
 * Import from here instead of reaching into the raw Database type.
 */

import type { Database } from "@/integrations/supabase/types";

// ── Row types (full database rows) ──────────────────────────────────

export type Order = Database["public"]["Tables"]["vault_marketplace_orders"]["Row"];
export type MarketplaceListing = Database["public"]["Tables"]["vault_marketplace_listings"]["Row"];
export type MarketplaceOffer = Database["public"]["Tables"]["marketplace_offers"]["Row"];
export type SellerProfile = Database["public"]["Tables"]["vault_seller_profiles"]["Row"];
export type VaultMember = Database["public"]["Tables"]["vault_members"]["Row"];
export type MarketplaceSubscription = Database["public"]["Tables"]["marketplace_subscriptions"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

// ── Derived field types ─────────────────────────────────────────────

export type OrderStatus = Order["status"];

// ── Insert types ────────────────────────────────────────────────────

export type OrderInsert = Database["public"]["Tables"]["vault_marketplace_orders"]["Insert"];
export type MarketplaceListingInsert = Database["public"]["Tables"]["vault_marketplace_listings"]["Insert"];
export type MarketplaceOfferInsert = Database["public"]["Tables"]["marketplace_offers"]["Insert"];
export type SellerProfileInsert = Database["public"]["Tables"]["vault_seller_profiles"]["Insert"];
export type VaultMemberInsert = Database["public"]["Tables"]["vault_members"]["Insert"];
export type MarketplaceSubscriptionInsert = Database["public"]["Tables"]["marketplace_subscriptions"]["Insert"];
export type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];

// ── Update types ────────────────────────────────────────────────────

export type OrderUpdate = Database["public"]["Tables"]["vault_marketplace_orders"]["Update"];
export type MarketplaceListingUpdate = Database["public"]["Tables"]["vault_marketplace_listings"]["Update"];
export type MarketplaceOfferUpdate = Database["public"]["Tables"]["marketplace_offers"]["Update"];
export type SellerProfileUpdate = Database["public"]["Tables"]["vault_seller_profiles"]["Update"];
export type VaultMemberUpdate = Database["public"]["Tables"]["vault_members"]["Update"];
export type MarketplaceSubscriptionUpdate = Database["public"]["Tables"]["marketplace_subscriptions"]["Update"];
export type NotificationUpdate = Database["public"]["Tables"]["notifications"]["Update"];
