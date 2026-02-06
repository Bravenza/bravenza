import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-client-cpf",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const clientCpf = req.headers.get("x-client-cpf");
  if (!clientCpf) {
    return jsonResponse({ error: "CPF não informado" }, 401);
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    // ===================== LISTINGS =====================

    // GET: List active listings
    if (req.method === "GET" && action === "listings") {
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = 20;
      const offset = (page - 1) * limit;
      const brand = url.searchParams.get("brand");
      const size = url.searchParams.get("size");
      const sort = url.searchParams.get("sort") || "recent";

      let query = supabase
        .from("vault_marketplace_listings")
        .select(`
          *,
          seller:vault_seller_profiles!inner(
            id,
            member:vault_members!inner(client_name, tier),
            average_rating,
            total_sales_count,
            current_fee_percent
          )
        `, { count: "exact" })
        .eq("status", "active");

      if (brand) query = query.ilike("brand", `%${brand}%`);
      if (size) query = query.eq("size", size);

      if (sort === "price_asc") query = query.order("price", { ascending: true });
      else if (sort === "price_desc") query = query.order("price", { ascending: false });
      else query = query.order("published_at", { ascending: false });

      query = query.range(offset, offset + limit - 1);

      const { data, count, error } = await query;
      if (error) throw error;

      const listingIds = (data || []).map((l: any) => l.id);
      const { data: favs } = await supabase
        .from("vault_marketplace_favorites")
        .select("listing_id")
        .eq("user_cpf", clientCpf)
        .in("listing_id", listingIds);

      const favSet = new Set((favs || []).map((f: any) => f.listing_id));
      const enriched = (data || []).map((l: any) => ({
        ...l,
        is_favorited: favSet.has(l.id),
      }));

      return jsonResponse({ listings: enriched, total: count });
    }

    // GET: Single listing detail
    if (req.method === "GET" && action === "listing-detail") {
      const listingId = url.searchParams.get("id");
      if (!listingId) throw new Error("ID obrigatório");

      const { data, error } = await supabase
        .from("vault_marketplace_listings")
        .select(`
          *,
          seller:vault_seller_profiles!inner(
            id,
            member:vault_members!inner(client_name, tier),
            average_rating,
            total_sales_count,
            current_fee_percent,
            bio
          )
        `)
        .eq("id", listingId)
        .single();

      if (error) throw error;

      await supabase
        .from("vault_marketplace_listings")
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq("id", listingId);

      const { data: fav } = await supabase
        .from("vault_marketplace_favorites")
        .select("id")
        .eq("listing_id", listingId)
        .eq("user_cpf", clientCpf)
        .maybeSingle();

      return jsonResponse({ ...data, is_favorited: !!fav });
    }

    // GET: My listings (as seller)
    if (req.method === "GET" && action === "my-listings") {
      const { data: member } = await supabase
        .from("vault_members")
        .select("id")
        .eq("client_cpf", clientCpf)
        .single();

      if (!member) {
        return jsonResponse({ listings: [], seller: null });
      }

      const { data: seller } = await supabase
        .from("vault_seller_profiles")
        .select("*")
        .eq("member_id", member.id)
        .maybeSingle();

      if (!seller) {
        return jsonResponse({ listings: [], seller: null });
      }

      const { data: listings } = await supabase
        .from("vault_marketplace_listings")
        .select("*")
        .eq("seller_id", seller.id)
        .order("created_at", { ascending: false });

      return jsonResponse({ listings: listings || [], seller });
    }

    // POST: Create listing
    if (req.method === "POST" && action === "create-listing") {
      const body = await req.json();

      const { data: member } = await supabase
        .from("vault_members")
        .select("id")
        .eq("client_cpf", clientCpf)
        .single();

      if (!member) throw new Error("Você precisa ser membro do Vault Club");

      let { data: seller } = await supabase
        .from("vault_seller_profiles")
        .select("*")
        .eq("member_id", member.id)
        .maybeSingle();

      if (!seller) {
        const { data: newSeller, error: sellerErr } = await supabase
          .from("vault_seller_profiles")
          .insert({ member_id: member.id })
          .select()
          .single();
        if (sellerErr) throw sellerErr;
        seller = newSeller;
      }

      const { data: listing, error } = await supabase
        .from("vault_marketplace_listings")
        .insert({
          seller_id: seller.id,
          vault_item_id: body.vault_item_id || null,
          title: body.title,
          description: body.description || null,
          brand: body.brand || null,
          model: body.model || null,
          colorway: body.colorway || null,
          size: body.size || null,
          condition: body.condition || "usado_bom",
          photos: body.photos || [],
          price: body.price,
          original_purchase_price: body.original_purchase_price || null,
          shipping_mode: body.shipping_mode || "direct",
          shipping_cost_estimate: body.shipping_cost_estimate || 0,
          is_vault_certified: !!body.vault_item_id,
          status: "active",
          published_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return jsonResponse({ success: true, listing });
    }

    // PUT: Update listing
    if (req.method === "PUT" && action === "update-listing") {
      const body = await req.json();
      const listingId = body.id;

      const { data: member } = await supabase
        .from("vault_members")
        .select("id")
        .eq("client_cpf", clientCpf)
        .single();

      if (!member) throw new Error("Membro não encontrado");

      const { data: seller } = await supabase
        .from("vault_seller_profiles")
        .select("id")
        .eq("member_id", member.id)
        .single();

      if (!seller) throw new Error("Perfil de vendedor não encontrado");

      const { error } = await supabase
        .from("vault_marketplace_listings")
        .update({
          title: body.title,
          description: body.description,
          price: body.price,
          condition: body.condition,
          shipping_mode: body.shipping_mode,
          shipping_cost_estimate: body.shipping_cost_estimate,
          photos: body.photos,
          status: body.status,
        })
        .eq("id", listingId)
        .eq("seller_id", seller.id);

      if (error) throw error;

      return jsonResponse({ success: true });
    }

    // POST: Toggle favorite
    if (req.method === "POST" && action === "toggle-favorite") {
      const { listing_id } = await req.json();

      const { data: existing } = await supabase
        .from("vault_marketplace_favorites")
        .select("id")
        .eq("listing_id", listing_id)
        .eq("user_cpf", clientCpf)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("vault_marketplace_favorites")
          .delete()
          .eq("id", existing.id);
        return jsonResponse({ favorited: false });
      } else {
        await supabase
          .from("vault_marketplace_favorites")
          .insert({ listing_id, user_cpf: clientCpf });
        return jsonResponse({ favorited: true });
      }
    }

    // DELETE: Delete listing
    if (req.method === "DELETE" && action === "delete-listing") {
      const listingId = url.searchParams.get("id");
      if (!listingId) throw new Error("ID obrigatório");

      const { data: member } = await supabase
        .from("vault_members")
        .select("id")
        .eq("client_cpf", clientCpf)
        .single();

      const { data: seller } = await supabase
        .from("vault_seller_profiles")
        .select("id")
        .eq("member_id", member!.id)
        .single();

      const { error } = await supabase
        .from("vault_marketplace_listings")
        .delete()
        .eq("id", listingId)
        .eq("seller_id", seller!.id);

      if (error) throw error;

      return jsonResponse({ success: true });
    }

    // GET: Seller profile/stats
    if (req.method === "GET" && action === "seller-profile") {
      const { data: member } = await supabase
        .from("vault_members")
        .select("id")
        .eq("client_cpf", clientCpf)
        .single();

      if (!member) {
        return jsonResponse({ seller: null });
      }

      const { data: seller } = await supabase
        .from("vault_seller_profiles")
        .select("*")
        .eq("member_id", member.id)
        .maybeSingle();

      return jsonResponse({ seller });
    }

    // ===================== ORDERS =====================

    // POST: Create marketplace order (buy)
    if (req.method === "POST" && action === "create-order") {
      const body = await req.json();
      const listingId = body.listing_id;

      // Get listing
      const { data: listing, error: listingErr } = await supabase
        .from("vault_marketplace_listings")
        .select(`
          *,
          seller:vault_seller_profiles!inner(
            id,
            current_fee_percent,
            member:vault_members!inner(client_cpf)
          )
        `)
        .eq("id", listingId)
        .eq("status", "active")
        .single();

      if (listingErr || !listing) throw new Error("Anúncio não encontrado ou já vendido");

      // Check buyer is not the seller
      if (listing.seller.member.client_cpf === clientCpf) {
        throw new Error("Você não pode comprar seu próprio anúncio");
      }

      const salePrice = listing.price + (listing.shipping_cost_estimate || 0);
      const feePercent = listing.seller.current_fee_percent;
      const feeAmount = Math.round(listing.price * (feePercent / 100) * 100) / 100;
      const sellerPayout = listing.price - feeAmount;

      // Create order
      const { data: order, error: orderErr } = await supabase
        .from("vault_marketplace_orders")
        .insert({
          listing_id: listingId,
          buyer_cpf: clientCpf,
          buyer_name: body.buyer_name,
          buyer_email: body.buyer_email || null,
          buyer_phone: body.buyer_phone || null,
          buyer_address: body.buyer_address || null,
          seller_id: listing.seller.id,
          sale_price: salePrice,
          fee_percent: feePercent,
          fee_amount: feeAmount,
          seller_payout: sellerPayout,
          shipping_mode: listing.shipping_mode,
          shipping_cost: listing.shipping_cost_estimate || 0,
          status: "pending_payment",
          payment_method: body.payment_method || null,
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // Mark listing as reserved
      await supabase
        .from("vault_marketplace_listings")
        .update({ status: "reserved" })
        .eq("id", listingId);

      console.log(`Marketplace order created: ${order.order_code} by ${clientCpf}`);

      return jsonResponse({ success: true, order });
    }

    // PUT: Confirm payment on order
    if (req.method === "PUT" && action === "confirm-payment") {
      const body = await req.json();
      const orderId = body.order_id;

      const { error } = await supabase
        .from("vault_marketplace_orders")
        .update({
          status: "paid",
          payment_method: body.payment_method,
          payment_id: body.payment_id || null,
          mp_payment_id: body.mp_payment_id || null,
          pix_transaction_id: body.pix_transaction_id || null,
          paid_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .eq("buyer_cpf", clientCpf);

      if (error) throw error;

      console.log(`Payment confirmed for order ${orderId}`);
      return jsonResponse({ success: true });
    }

    // GET: My orders (as buyer)
    if (req.method === "GET" && action === "my-orders") {
      const { data: orders, error } = await supabase
        .from("vault_marketplace_orders")
        .select(`
          *,
          listing:vault_marketplace_listings!inner(
            title, brand, model, size, photos, condition, is_vault_certified
          )
        `)
        .eq("buyer_cpf", clientCpf)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return jsonResponse({ orders: orders || [] });
    }

    // GET: My sales (as seller)
    if (req.method === "GET" && action === "my-sales") {
      const { data: member } = await supabase
        .from("vault_members")
        .select("id")
        .eq("client_cpf", clientCpf)
        .single();

      if (!member) return jsonResponse({ orders: [] });

      const { data: seller } = await supabase
        .from("vault_seller_profiles")
        .select("id")
        .eq("member_id", member.id)
        .maybeSingle();

      if (!seller) return jsonResponse({ orders: [] });

      const { data: orders, error } = await supabase
        .from("vault_marketplace_orders")
        .select(`
          *,
          listing:vault_marketplace_listings!inner(
            title, brand, model, size, photos, condition
          )
        `)
        .eq("seller_id", seller.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return jsonResponse({ orders: orders || [] });
    }

    // PUT: Update order status (seller ships, admin confirms delivery/payout)
    if (req.method === "PUT" && action === "update-order-status") {
      const body = await req.json();
      const orderId = body.order_id;
      const newStatus = body.status;

      const updateData: any = { status: newStatus };

      if (newStatus === "shipped") {
        updateData.shipped_at = new Date().toISOString();
        updateData.tracking_code = body.tracking_code || null;
      } else if (newStatus === "delivered") {
        updateData.delivered_at = new Date().toISOString();
        // Calculate protection end (7 business days)
        const { data: protectionData } = await supabase.rpc("calculate_protection_end", {
          delivery_date: new Date().toISOString(),
        });
        if (protectionData) {
          updateData.protection_ends_at = protectionData;
        }
      } else if (newStatus === "completed") {
        updateData.payout_released_at = new Date().toISOString();
        updateData.payout_method = body.payout_method || "pix";
        updateData.payout_proof_url = body.payout_proof_url || null;
      } else if (newStatus === "cancelled") {
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancellation_reason = body.reason || null;
        // Re-activate the listing
        const { data: order } = await supabase
          .from("vault_marketplace_orders")
          .select("listing_id")
          .eq("id", orderId)
          .single();
        if (order) {
          await supabase
            .from("vault_marketplace_listings")
            .update({ status: "active" })
            .eq("id", order.listing_id);
        }
      } else if (newStatus === "disputed") {
        updateData.dispute_status = "open";
        updateData.dispute_reason = body.reason || null;
        updateData.dispute_opened_at = new Date().toISOString();
      }

      if (body.admin_notes) {
        updateData.admin_notes = body.admin_notes;
      }

      const { error } = await supabase
        .from("vault_marketplace_orders")
        .update(updateData)
        .eq("id", orderId);

      if (error) throw error;

      console.log(`Marketplace order ${orderId} updated to ${newStatus}`);
      return jsonResponse({ success: true });
    }

    // POST: Rate seller
    if (req.method === "POST" && action === "rate-seller") {
      const body = await req.json();
      const orderId = body.order_id;

      // Verify buyer
      const { data: order, error: orderErr } = await supabase
        .from("vault_marketplace_orders")
        .select("id, seller_id, status")
        .eq("id", orderId)
        .eq("buyer_cpf", clientCpf)
        .single();

      if (orderErr || !order) throw new Error("Pedido não encontrado");
      if (!["delivered", "completed"].includes(order.status)) {
        throw new Error("Só é possível avaliar após a entrega");
      }

      // Save rating
      const { error } = await supabase
        .from("vault_marketplace_orders")
        .update({
          buyer_rating: body.rating,
          buyer_review: body.review || null,
          buyer_rated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      // Update seller average rating
      const { data: allRatings } = await supabase
        .from("vault_marketplace_orders")
        .select("buyer_rating")
        .eq("seller_id", order.seller_id)
        .not("buyer_rating", "is", null);

      if (allRatings && allRatings.length > 0) {
        const avg = allRatings.reduce((sum: number, r: any) => sum + r.buyer_rating, 0) / allRatings.length;
        await supabase
          .from("vault_seller_profiles")
          .update({
            average_rating: Math.round(avg * 10) / 10,
            ratings_count: allRatings.length,
          })
          .eq("id", order.seller_id);
      }

      return jsonResponse({ success: true });
    }

    // GET: All marketplace orders (admin)
    if (req.method === "GET" && action === "admin-orders") {
      const status = url.searchParams.get("status");

      let query = supabase
        .from("vault_marketplace_orders")
        .select(`
          *,
          listing:vault_marketplace_listings!inner(
            title, brand, model, size, photos, condition, is_vault_certified
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data: orders, error } = await query;
      if (error) throw error;

      return jsonResponse({ orders: orders || [] });
    }

    return jsonResponse({ error: "Ação não encontrada" }, 404);
  } catch (error: any) {
    console.error("Marketplace error:", error);
    return jsonResponse({ error: error.message }, 500);
  }
});
