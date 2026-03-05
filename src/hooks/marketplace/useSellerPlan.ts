import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { marketplaceRequest } from "./api";

export interface FeeTier {
  plan_id: string;
  min_sales: number;
  fee_discount: number;
}

export interface MarketplacePlan {
  id: string;
  name: string;
  price_monthly: number;
  fee_percent: number;
  max_active_listings: number | null;
  max_new_listings_month: number | null;
  boost_slots: number;
  support_sla_hours: number;
  has_storefront: boolean;
  has_verified_badge: boolean;
  has_batch_tools: boolean;
  has_priority_search: boolean;
  features: string[];
  is_active: boolean;
}

export interface SellerPlanStatus {
  plan: MarketplacePlan | null;
  activeCount: number;
  maxActive: number | null;
  monthlyNewCount: number;
  maxMonthlyNew: number | null;
  canPublish: boolean;
  blockReason: string | null;
}

export interface SubscriptionInfo {
  id: string;
  plan_id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  grace_period_end: string | null;
  last_payment_status: string | null;
  marketplace_plans?: MarketplacePlan;
}

export function useSellerPlan(sellerId: string | null) {
  const [plans, setPlans] = useState<MarketplacePlan[]>([]);
  const [feeTiers, setFeeTiers] = useState<FeeTier[]>([]);
  const [status, setStatus] = useState<SellerPlanStatus | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const fetchPlans = useCallback(async () => {
    const [plansRes, tiersRes] = await Promise.all([
      supabase.from("marketplace_plans").select("*").eq("is_active", true).order("price_monthly", { ascending: true }),
      supabase.from("marketplace_fee_tiers").select("plan_id, min_sales, fee_discount").order("min_sales", { ascending: true }),
    ]);
    if (plansRes.data) {
      setPlans(plansRes.data.map((p: any) => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : JSON.parse(p.features || "[]"),
      })));
    }
    if (tiersRes.data) {
      setFeeTiers(tiersRes.data as FeeTier[]);
    }
  }, []);

  const checkLimits = useCallback(async () => {
    if (!sellerId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("check_seller_listing_limits", {
        p_seller_id: sellerId,
      });
      if (data && data.length > 0) {
        const row = data[0];
        const plan = plans.find((p) => p.id === row.plan_id) || null;
        setStatus({
          plan,
          activeCount: row.active_count,
          maxActive: row.max_active,
          monthlyNewCount: row.monthly_new_count,
          maxMonthlyNew: row.max_monthly_new,
          canPublish: row.can_publish,
          blockReason: row.block_reason,
        });
      }
    } catch (err) {
      console.error("checkLimits error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [sellerId, plans]);

  const fetchSubscription = useCallback(async () => {
    if (!sellerId) return null;
    try {
      const data = await marketplaceRequest("", "subscription-status", "POST", {
        action: "status", seller_id: sellerId,
      });
      if (data?.subscription) {
        setSubscription(data.subscription);
        return data.subscription;
      }
    } catch (err) {
      console.error("fetchSubscription error:", err);
    }
    return null;
  }, [sellerId]);

  const subscribe = useCallback(async (planId: string, payerEmail: string) => {
    if (!sellerId) return null;
    setIsSubscribing(true);
    try {
      const data = await marketplaceRequest("", "subscription-create", "POST", {
        action: "create", seller_id: sellerId, plan_id: planId, payer_email: payerEmail,
      });
      if (data?.checkout_url) {
        window.open(data.checkout_url, "_blank");
        return data.checkout_url;
      }
      throw new Error(data?.error || "Erro ao criar assinatura");
    } catch (err) {
      console.error("subscribe error:", err);
      throw err;
    } finally {
      setIsSubscribing(false);
    }
  }, [sellerId]);

  const cancelSubscription = useCallback(async () => {
    if (!sellerId) return false;
    try {
      await marketplaceRequest("", "subscription-cancel", "POST", {
        action: "cancel", seller_id: sellerId,
      });
      await fetchSubscription();
      return true;
    } catch (err) {
      console.error("cancelSubscription error:", err);
      return false;
    }
  }, [sellerId, fetchSubscription]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    if (sellerId && plans.length > 0) {
      checkLimits();
      fetchSubscription();
    }
  }, [sellerId, plans, checkLimits, fetchSubscription]);

  return {
    plans,
    feeTiers,
    status,
    subscription,
    isLoading,
    isSubscribing,
    fetchPlans,
    checkLimits,
    fetchSubscription,
    subscribe,
    cancelSubscription,
  };
}
