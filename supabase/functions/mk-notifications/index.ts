// Marketplace Automated Notifications - Cron Job
// Handles: watchlist alerts, shipping reminders, protection expiry, auto-payout
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function notify(sb: any, title: string, message: string, cpf: string, refId?: string, refType?: string) {
  try {
    await sb.from("notifications").insert({
      title, message, target: "client", target_client_cpf: cpf,
      type: "info", reference_id: refId || null, reference_type: refType || "marketplace",
    });
  } catch (e) { console.error("Notify error:", e); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const results: Record<string, any> = {};

  try {
    // ===== 1. WATCHLIST ALERTS =====
    // Check new offers matching watchlist entries
    console.log("[mk-notifications] Checking watchlist alerts...");
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentOffers } = await sb.from("marketplace_offers")
      .select("id, product_id, size, price, created_at")
      .eq("status", "active")
      .gte("created_at", oneDayAgo);

    let watchlistAlerts = 0;
    for (const offer of (recentOffers || [])) {
      // Find matching watchlist entries
      const { data: watchers } = await sb.from("marketplace_watchlist")
        .select("user_cpf, max_price, size")
        .eq("product_id", offer.product_id)
        .eq("is_active", true);

      for (const w of (watchers || [])) {
        // Check size match (empty = any size)
        if (w.size && w.size !== offer.size) continue;
        // Check price threshold
        if (w.max_price && offer.price > w.max_price) continue;
        
        await notify(sb, "🔔 Novo anúncio na sua watchlist!",
          `Uma oferta de R$ ${offer.price.toFixed(2)} foi publicada para um produto que você acompanha.`,
          w.user_cpf, offer.product_id, "marketplace_watchlist");
        watchlistAlerts++;
      }
    }
    results.watchlist_alerts = watchlistAlerts;

    // ===== 2. SHIPPING REMINDERS =====
    // Remind sellers to ship within 3 days of payment
    console.log("[mk-notifications] Checking shipping reminders...");
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: lateShipments } = await sb.from("vault_marketplace_orders")
      .select("id, order_code, seller_id, paid_at, shipping_mode")
      .eq("status", "paid")
      .lte("paid_at", threeDaysAgo);

    let shippingReminders = 0;
    for (const order of (lateShipments || [])) {
      const { data: sl } = await sb.from("vault_seller_profiles")
        .select("member:vault_members!inner(client_cpf)")
        .eq("id", order.seller_id).single();
      
      if (sl?.member?.client_cpf) {
        const dest = order.shipping_mode === "bravenza" ? "ao Hub Bravenza" : "ao comprador";
        await notify(sb, "⚠️ Envio pendente!",
          `Pedido ${order.order_code}: já se passaram 3+ dias desde o pagamento. Envie ${dest} o mais rápido possível.`,
          sl.member.client_cpf, order.id, "marketplace_shipping");
        shippingReminders++;
      }
    }
    results.shipping_reminders = shippingReminders;

    // ===== 3. PROTECTION EXPIRY → AUTO PAYOUT =====
    // Mark delivered orders as payout_pending after protection expires
    console.log("[mk-notifications] Checking protection expiry...");
    const now = new Date();
    
    const { data: expiredProtection } = await sb.from("vault_marketplace_orders")
      .select("id, order_code, seller_id, seller_payout, protection_ends_at, buyer_cpf")
      .eq("status", "delivered")
      .is("payout_released_at", null)
      .is("dispute_status", null)
      .not("protection_ends_at", "is", null);

    let payoutEligible = 0;
    for (const order of (expiredProtection || [])) {
      if (!order.protection_ends_at || new Date(order.protection_ends_at) >= now) continue;
      
      // Mark as payout_pending
      await sb.from("vault_marketplace_orders").update({
        status: "payout_pending",
      }).eq("id", order.id);

      // Notify seller
      const { data: sl } = await sb.from("vault_seller_profiles")
        .select("member:vault_members!inner(client_cpf)")
        .eq("id", order.seller_id).single();
      
      if (sl?.member?.client_cpf) {
        await notify(sb, "💰 Pagamento liberado!",
          `Pedido ${order.order_code} — R$ ${order.seller_payout.toFixed(2)} será transferido em breve.`,
          sl.member.client_cpf, order.id, "marketplace_payout");
      }

      // Notify buyer that transaction is finalized
      await notify(sb, "✅ Transação concluída",
        `Pedido ${order.order_code} finalizado com sucesso. Obrigado pela compra!`,
        order.buyer_cpf, order.id, "marketplace_order");

      payoutEligible++;
    }
    results.payout_eligible = payoutEligible;

    // ===== 4. PROTECTION EXPIRY WARNING =====
    // Warn buyers 2 days before protection expires
    console.log("[mk-notifications] Checking protection expiry warnings...");
    const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);

    const { data: expiringProtection } = await sb.from("vault_marketplace_orders")
      .select("id, order_code, buyer_cpf, protection_ends_at")
      .eq("status", "delivered")
      .is("dispute_status", null);

    let expiryWarnings = 0;
    for (const order of (expiringProtection || [])) {
      if (!order.protection_ends_at) continue;
      const expDate = new Date(order.protection_ends_at);
      // Notify if expiring within 1-2 days
      if (expDate > oneDayFromNow && expDate <= twoDaysFromNow) {
        await notify(sb, "🛡️ Proteção expirando",
          `Pedido ${order.order_code}: sua janela de proteção expira em ${expDate.toLocaleDateString("pt-BR")}. Abra uma disputa se houver problemas.`,
          order.buyer_cpf, order.id, "marketplace_protection");
        expiryWarnings++;
      }
    }
    results.expiry_warnings = expiryWarnings;

    // ===== 5. RECORD SALE PRICES FOR ANALYTICS =====
    // Update marketplace_offers sold_at when order is completed
    console.log("[mk-notifications] Syncing completed sales for analytics...");
    const { data: completedOrders } = await sb.from("vault_marketplace_orders")
      .select("id, listing_id, sale_price, status")
      .in("status", ["completed", "payout_released"])
      .is("payout_released_at", null);

    // Update product stats from completed sales
    let salesRecorded = 0;
    const productIds = new Set<string>();
    
    // Get all completed order listing_ids → product_ids
    for (const order of (completedOrders || [])) {
      if (!order.listing_id) continue;
      const { data: listing } = await sb.from("vault_marketplace_listings")
        .select("product_id").eq("id", order.listing_id).maybeSingle();
      if (listing?.product_id) {
        productIds.add(listing.product_id);
      }
    }

    // Update product stats (lowest_price, total_offers)
    for (const pid of productIds) {
      const { data: activeOffers } = await sb.from("marketplace_offers")
        .select("price").eq("product_id", pid).eq("status", "active");
      
      if (activeOffers && activeOffers.length > 0) {
        const lowest = Math.min(...activeOffers.map((o: any) => o.price));
        await sb.from("marketplace_products").update({
          lowest_price: lowest,
          total_offers: activeOffers.length,
        }).eq("id", pid);
      } else {
        await sb.from("marketplace_products").update({
          lowest_price: null,
          total_offers: 0,
        }).eq("id", pid);
      }
      salesRecorded++;
    }
    results.products_updated = salesRecorded;

    console.log("[mk-notifications] Done:", JSON.stringify(results));
    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[mk-notifications] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
