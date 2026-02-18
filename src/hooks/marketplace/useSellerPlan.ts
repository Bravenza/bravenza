import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export function useSellerPlan(sellerId: string | null) {
  const [plans, setPlans] = useState<MarketplacePlan[]>([]);
  const [status, setStatus] = useState<SellerPlanStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPlans = useCallback(async () => {
    const { data } = await supabase
      .from("marketplace_plans")
      .select("*")
      .eq("is_active", true)
      .order("price_monthly", { ascending: true });
    if (data) {
      setPlans(data.map((p: any) => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : JSON.parse(p.features || "[]"),
      })));
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

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    if (sellerId && plans.length > 0) {
      checkLimits();
    }
  }, [sellerId, plans, checkLimits]);

  return { plans, status, isLoading, fetchPlans, checkLimits };
}
