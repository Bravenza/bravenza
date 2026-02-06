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

async function createNotification(
  supabase: any,
  title: string,
  message: string,
  targetCpf: string,
  referenceId?: string,
  referenceType?: string
) {
  try {
    await supabase.from("notifications").insert({
      title,
      message,
      target: "client",
      target_client_cpf: targetCpf,
      type: "info",
      reference_id: referenceId || null,
      reference_type: referenceType || "marketplace",
    });
  } catch (e) {
    console.error("Notification error:", e);
  }
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

    // GET: List active listings with advanced search
    if (req.method === "GET" && action === "listings") {
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = 20;
      const offset = (page - 1) * limit;
      const brand = url.searchParams.get("brand");
      const size = url.searchParams.get("size");
      const condition = url.searchParams.get("condition");
      const priceMin = url.searchParams.get("price_min");
      const priceMax = url.searchParams.get("price_max");
      const search = url.searchParams.get("search");
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

      if (search) {
        query = query.or(`title.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%,colorway.ilike.%${search}%`);
      }
      if (brand) query = query.ilike("brand", `%${brand}%`);
      if (size) query = query.eq("size", size);
      if (condition) query = query.eq("condition", condition);
      if (priceMin) query = query.gte("price", parseFloat(priceMin));
      if (priceMax) query = query.lte("price", parseFloat(priceMax));

      if (sort === "price_asc") query = query.order("price", { ascending: true });
      else if (sort === "price_desc") query = query.order("price", { ascending: false });
      else if (sort === "popular") query = query.order("views_count", { ascending: false });
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

      if (!member) return jsonResponse({ listings: [], seller: null });

      const { data: seller } = await supabase
        .from("vault_seller_profiles")
        .select("*")
        .eq("member_id", member.id)
        .maybeSingle();

      if (!seller) return jsonResponse({ listings: [], seller: null });

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
        await supabase.from("vault_marketplace_favorites").delete().eq("id", existing.id);
        return jsonResponse({ favorited: false });
      } else {
        await supabase.from("vault_marketplace_favorites").insert({ listing_id, user_cpf: clientCpf });
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

      if (!member) return jsonResponse({ seller: null });

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

      const { data: listing, error: listingErr } = await supabase
        .from("vault_marketplace_listings")
        .select(`
          *,
          seller:vault_seller_profiles!inner(
            id,
            current_fee_percent,
            member:vault_members!inner(client_cpf, client_name)
          )
        `)
        .eq("id", listingId)
        .eq("status", "active")
        .single();

      if (listingErr || !listing) throw new Error("Anúncio não encontrado ou já vendido");

      if (listing.seller.member.client_cpf === clientCpf) {
        throw new Error("Você não pode comprar seu próprio anúncio");
      }

      const salePrice = listing.price + (listing.shipping_cost_estimate || 0);
      const feePercent = listing.seller.current_fee_percent;
      const feeAmount = Math.round(listing.price * (feePercent / 100) * 100) / 100;
      const sellerPayout = listing.price - feeAmount;

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

      await supabase
        .from("vault_marketplace_listings")
        .update({ status: "reserved" })
        .eq("id", listingId);

      // Notify seller
      await createNotification(
        supabase,
        "🛒 Nova venda no Marketplace!",
        `${body.buyer_name} quer comprar "${listing.title}". Aguardando pagamento.`,
        listing.seller.member.client_cpf,
        order.id,
        "marketplace_order"
      );

      console.log(`Marketplace order created: ${order.order_code} by ${clientCpf}`);
      return jsonResponse({ success: true, order });
    }

    // PUT: Confirm payment on order
    if (req.method === "PUT" && action === "confirm-payment") {
      const body = await req.json();
      const orderId = body.order_id;

      const { data: order } = await supabase
        .from("vault_marketplace_orders")
        .select(`
          id, seller_id,
          listing:vault_marketplace_listings!inner(title),
          seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf))
        `)
        .eq("id", orderId)
        .eq("buyer_cpf", clientCpf)
        .single();

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

      // Notify seller about payment
      if (order) {
        await createNotification(
          supabase,
          "💰 Pagamento confirmado!",
          `O pagamento de "${order.listing?.title}" foi confirmado. Envie o produto!`,
          order.seller?.member?.client_cpf,
          orderId,
          "marketplace_order"
        );
      }

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

    // PUT: Update order status
    if (req.method === "PUT" && action === "update-order-status") {
      const body = await req.json();
      const orderId = body.order_id;
      const newStatus = body.status;

      // Get order details for notifications
      const { data: orderDetail } = await supabase
        .from("vault_marketplace_orders")
        .select(`
          id, buyer_cpf, buyer_name, order_code,
          listing:vault_marketplace_listings!inner(title),
          seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf, client_name))
        `)
        .eq("id", orderId)
        .single();

      const updateData: any = { status: newStatus };

      if (newStatus === "shipped") {
        updateData.shipped_at = new Date().toISOString();
        updateData.tracking_code = body.tracking_code || null;
        // Notify buyer
        if (orderDetail) {
          await createNotification(
            supabase,
            "📦 Seu pedido foi enviado!",
            `O pedido "${orderDetail.listing?.title}" foi enviado.${body.tracking_code ? ` Rastreio: ${body.tracking_code}` : ""}`,
            orderDetail.buyer_cpf,
            orderId,
            "marketplace_order"
          );
        }
      } else if (newStatus === "delivered") {
        updateData.delivered_at = new Date().toISOString();
        const { data: protectionData } = await supabase.rpc("calculate_protection_end", {
          delivery_date: new Date().toISOString(),
        });
        if (protectionData) updateData.protection_ends_at = protectionData;
        // Notify both
        if (orderDetail) {
          await createNotification(supabase, "✅ Pedido entregue!", `"${orderDetail.listing?.title}" foi entregue. Você tem 7 dias úteis para reportar problemas.`, orderDetail.buyer_cpf, orderId, "marketplace_order");
          await createNotification(supabase, "✅ Entrega confirmada!", `"${orderDetail.listing?.title}" foi entregue ao comprador. O repasse será liberado após o período de proteção.`, orderDetail.seller?.member?.client_cpf, orderId, "marketplace_order");
        }
      } else if (newStatus === "completed") {
        updateData.payout_released_at = new Date().toISOString();
        updateData.payout_method = body.payout_method || "pix";
        updateData.payout_proof_url = body.payout_proof_url || null;
        if (orderDetail) {
          await createNotification(supabase, "💸 Repasse liberado!", `O valor da venda de "${orderDetail.listing?.title}" foi liberado via ${body.payout_method || "PIX"}.`, orderDetail.seller?.member?.client_cpf, orderId, "marketplace_order");
        }
      } else if (newStatus === "cancelled") {
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancellation_reason = body.reason || null;
        const { data: cancelOrder } = await supabase
          .from("vault_marketplace_orders")
          .select("listing_id")
          .eq("id", orderId)
          .single();
        if (cancelOrder) {
          await supabase
            .from("vault_marketplace_listings")
            .update({ status: "active" })
            .eq("id", cancelOrder.listing_id);
        }
        if (orderDetail) {
          await createNotification(supabase, "❌ Pedido cancelado", `O pedido "${orderDetail.listing?.title}" foi cancelado.`, orderDetail.buyer_cpf, orderId, "marketplace_order");
        }
      } else if (newStatus === "disputed") {
        updateData.dispute_status = "open";
        updateData.dispute_reason = body.reason || null;
        updateData.dispute_opened_at = new Date().toISOString();
        // Notify admin + seller
        if (orderDetail) {
          await createNotification(supabase, "⚠️ Disputa aberta", `O comprador ${orderDetail.buyer_name} abriu uma disputa no pedido "${orderDetail.listing?.title}".`, orderDetail.seller?.member?.client_cpf, orderId, "marketplace_order");
        }
      }

      if (body.admin_notes) updateData.admin_notes = body.admin_notes;

      const { error } = await supabase
        .from("vault_marketplace_orders")
        .update(updateData)
        .eq("id", orderId);

      if (error) throw error;

      console.log(`Marketplace order ${orderId} updated to ${newStatus}`);
      return jsonResponse({ success: true });
    }

    // PUT: Resolve dispute (admin)
    if (req.method === "PUT" && action === "resolve-dispute") {
      const body = await req.json();
      const orderId = body.order_id;

      const { data: order } = await supabase
        .from("vault_marketplace_orders")
        .select(`
          id, buyer_cpf, seller_id,
          listing:vault_marketplace_listings!inner(title),
          seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf))
        `)
        .eq("id", orderId)
        .single();

      const updateData: any = {
        dispute_status: "resolved",
        dispute_resolved_at: new Date().toISOString(),
        dispute_resolution: body.resolution,
        admin_notes: body.admin_notes || null,
      };

      if (body.resolution === "refund_buyer") {
        updateData.status = "cancelled";
        updateData.cancelled_at = new Date().toISOString();
        updateData.dispute_refund_amount = body.refund_amount || 0;
        // Re-activate listing
        if (order) {
          const { data: lo } = await supabase.from("vault_marketplace_orders").select("listing_id").eq("id", orderId).single();
          if (lo) await supabase.from("vault_marketplace_listings").update({ status: "active" }).eq("id", lo.listing_id);
        }
      } else if (body.resolution === "favor_seller") {
        updateData.status = "completed";
        updateData.payout_released_at = new Date().toISOString();
        updateData.payout_method = "pix";
      } else {
        // partial_refund or other
        updateData.dispute_refund_amount = body.refund_amount || 0;
      }

      const { error } = await supabase
        .from("vault_marketplace_orders")
        .update(updateData)
        .eq("id", orderId);

      if (error) throw error;

      // Notify both parties
      if (order) {
        await createNotification(supabase, "📋 Disputa resolvida", `A disputa de "${order.listing?.title}" foi resolvida: ${body.resolution === "refund_buyer" ? "reembolso ao comprador" : body.resolution === "favor_seller" ? "decisão a favor do vendedor" : "acordo parcial"}.`, order.buyer_cpf, orderId, "marketplace_order");
        await createNotification(supabase, "📋 Disputa resolvida", `A disputa de "${order.listing?.title}" foi resolvida.`, order.seller?.member?.client_cpf, orderId, "marketplace_order");
      }

      return jsonResponse({ success: true });
    }

    // POST: Rate seller
    if (req.method === "POST" && action === "rate-seller") {
      const body = await req.json();
      const orderId = body.order_id;

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

      const { error } = await supabase
        .from("vault_marketplace_orders")
        .update({
          buyer_rating: body.rating,
          buyer_review: body.review || null,
          buyer_rated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      const { data: allRatings } = await supabase
        .from("vault_marketplace_orders")
        .select("buyer_rating")
        .eq("seller_id", order.seller_id)
        .not("buyer_rating", "is", null);

      if (allRatings && allRatings.length > 0) {
        const avg = allRatings.reduce((sum: number, r: any) => sum + r.buyer_rating, 0) / allRatings.length;
        await supabase
          .from("vault_seller_profiles")
          .update({ average_rating: Math.round(avg * 10) / 10, ratings_count: allRatings.length })
          .eq("id", order.seller_id);
      }

      return jsonResponse({ success: true });
    }

    // ===================== CHAT =====================

    // GET: Chat messages for an order or listing
    if (req.method === "GET" && action === "chat-messages") {
      const orderId = url.searchParams.get("order_id");
      const listingId = url.searchParams.get("listing_id");

      let query = supabase
        .from("vault_marketplace_messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (orderId) query = query.eq("order_id", orderId);
      else if (listingId) query = query.eq("listing_id", listingId);
      else throw new Error("order_id ou listing_id obrigatório");

      const { data, error } = await query;
      if (error) throw error;

      // Mark messages as read
      if (data && data.length > 0) {
        const unreadIds = data.filter((m: any) => m.sender_cpf !== clientCpf && !m.read_at).map((m: any) => m.id);
        if (unreadIds.length > 0) {
          await supabase
            .from("vault_marketplace_messages")
            .update({ read_at: new Date().toISOString() })
            .in("id", unreadIds);
        }
      }

      return jsonResponse({ messages: data || [] });
    }

    // POST: Send chat message
    if (req.method === "POST" && action === "send-message") {
      const body = await req.json();

      const { data: msg, error } = await supabase
        .from("vault_marketplace_messages")
        .insert({
          order_id: body.order_id || null,
          listing_id: body.listing_id || null,
          sender_cpf: clientCpf,
          sender_name: body.sender_name,
          message: body.message,
          is_admin: body.is_admin || false,
        })
        .select()
        .single();

      if (error) throw error;

      // Notify the other party
      if (body.order_id) {
        const { data: order } = await supabase
          .from("vault_marketplace_orders")
          .select(`
            buyer_cpf, buyer_name,
            listing:vault_marketplace_listings!inner(title),
            seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf, client_name))
          `)
          .eq("id", body.order_id)
          .single();

        if (order) {
          const recipientCpf = clientCpf === order.buyer_cpf
            ? order.seller?.member?.client_cpf
            : order.buyer_cpf;
          const senderName = clientCpf === order.buyer_cpf ? order.buyer_name : order.seller?.member?.client_name;
          if (recipientCpf) {
            await createNotification(supabase, "💬 Nova mensagem", `${senderName} enviou uma mensagem sobre "${order.listing?.title}".`, recipientCpf, body.order_id, "marketplace_chat");
          }
        }
      }

      return jsonResponse({ success: true, message: msg });
    }

    // POST: Open dispute
    if (req.method === "POST" && action === "open-dispute") {
      const body = await req.json();
      const orderId = body.order_id;

      // Verify buyer owns order and it's delivered
      const { data: order, error: oErr } = await supabase
        .from("vault_marketplace_orders")
        .select(`
          id, status, protection_ends_at, buyer_name,
          listing:vault_marketplace_listings!inner(title),
          seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf))
        `)
        .eq("id", orderId)
        .eq("buyer_cpf", clientCpf)
        .single();

      if (oErr || !order) throw new Error("Pedido não encontrado");
      if (order.status !== "delivered") throw new Error("Disputas só podem ser abertas após a entrega");

      // Check protection window
      if (order.protection_ends_at && new Date(order.protection_ends_at) < new Date()) {
        throw new Error("O período de proteção já expirou");
      }

      const { error } = await supabase
        .from("vault_marketplace_orders")
        .update({
          status: "disputed",
          dispute_status: "open",
          dispute_reason: body.reason,
          dispute_opened_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      // Notify seller
      if (order.seller?.member?.client_cpf) {
        await createNotification(supabase, "⚠️ Disputa aberta", `O comprador ${order.buyer_name} abriu uma disputa: "${body.reason}"`, order.seller.member.client_cpf, orderId, "marketplace_order");
      }

      // Create system message in chat
      await supabase.from("vault_marketplace_messages").insert({
        order_id: orderId,
        sender_cpf: clientCpf,
        sender_name: "Sistema",
        message: `⚠️ Disputa aberta: ${body.reason}`,
        is_admin: false,
      });

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

      if (status && status !== "all") query = query.eq("status", status);

      const { data: orders, error } = await query;
      if (error) throw error;

      return jsonResponse({ orders: orders || [] });
    }

    // ===================== SELLER PUBLIC PROFILE =====================

    if (req.method === "GET" && action === "seller-public-profile") {
      const sellerId = url.searchParams.get("seller_id");
      if (!sellerId) throw new Error("seller_id obrigatório");

      const { data: seller } = await supabase
        .from("vault_seller_profiles")
        .select(`
          id, bio, total_sales_count, total_sales_value, average_rating, ratings_count, current_fee_percent,
          member:vault_members!inner(client_name, tier, created_at)
        `)
        .eq("id", sellerId)
        .single();

      if (!seller) throw new Error("Vendedor não encontrado");

      // Active listings
      const { data: listings } = await supabase
        .from("vault_marketplace_listings")
        .select("*")
        .eq("seller_id", sellerId)
        .eq("status", "active")
        .order("published_at", { ascending: false });

      // Recent reviews
      const { data: reviews } = await supabase
        .from("vault_marketplace_orders")
        .select("buyer_name, buyer_rating, buyer_review, created_at")
        .eq("seller_id", sellerId)
        .not("buyer_rating", "is", null)
        .order("created_at", { ascending: false })
        .limit(10);

      return jsonResponse({
        ...seller,
        listings: listings || [],
        recent_reviews: reviews || [],
      });
    }

    // ===================== OFFERS =====================

    // POST: Make offer
    if (req.method === "POST" && action === "make-offer") {
      const body = await req.json();

      const { data: listing } = await supabase
        .from("vault_marketplace_listings")
        .select(`
          id, title, price, seller_id,
          seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf))
        `)
        .eq("id", body.listing_id)
        .eq("status", "active")
        .single();

      if (!listing) throw new Error("Anúncio não encontrado");
      if (listing.seller?.member?.client_cpf === clientCpf) throw new Error("Não pode fazer oferta no próprio anúncio");

      const { data: offer, error } = await supabase
        .from("vault_marketplace_offers")
        .insert({
          listing_id: body.listing_id,
          buyer_cpf: clientCpf,
          buyer_name: body.buyer_name || "Comprador",
          offer_price: body.offer_price,
          message: body.message || null,
        })
        .select()
        .single();

      if (error) throw error;

      await createNotification(supabase, "💰 Nova oferta recebida!", `${body.buyer_name || "Um comprador"} ofereceu R$ ${body.offer_price.toFixed(2)} por "${listing.title}".`, listing.seller.member.client_cpf, listing.id, "marketplace_offer");

      return jsonResponse({ success: true, offer });
    }

    // GET: Offers for a listing (seller)
    if (req.method === "GET" && action === "listing-offers") {
      const listingId = url.searchParams.get("listing_id");
      if (!listingId) throw new Error("listing_id obrigatório");

      const { data: offers, error } = await supabase
        .from("vault_marketplace_offers")
        .select("*")
        .eq("listing_id", listingId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return jsonResponse({ offers: offers || [] });
    }

    // GET: My sent offers (buyer)
    if (req.method === "GET" && action === "my-offers") {
      const { data: offers, error } = await supabase
        .from("vault_marketplace_offers")
        .select(`
          *,
          listing:vault_marketplace_listings!inner(title, photos, price)
        `)
        .eq("buyer_cpf", clientCpf)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return jsonResponse({ offers: offers || [] });
    }

    // PUT: Respond to offer (seller: accept/reject/counter)
    if (req.method === "PUT" && action === "respond-offer") {
      const body = await req.json();
      const offerId = body.offer_id;
      const responseAction = body.response; // accept, reject, counter

      const { data: offer } = await supabase
        .from("vault_marketplace_offers")
        .select(`
          id, listing_id, buyer_cpf, buyer_name, offer_price,
          listing:vault_marketplace_listings!inner(title, seller_id)
        `)
        .eq("id", offerId)
        .single();

      if (!offer) throw new Error("Oferta não encontrada");

      const updateData: any = { responded_at: new Date().toISOString() };

      if (responseAction === "accept") {
        updateData.status = "accepted";
        // Notify buyer
        await createNotification(supabase, "✅ Oferta aceita!", `Sua oferta de R$ ${offer.offer_price.toFixed(2)} por "${offer.listing?.title}" foi aceita! Finalize a compra.`, offer.buyer_cpf, offer.listing_id, "marketplace_offer");
      } else if (responseAction === "reject") {
        updateData.status = "rejected";
        await createNotification(supabase, "❌ Oferta recusada", `Sua oferta por "${offer.listing?.title}" foi recusada pelo vendedor.`, offer.buyer_cpf, offer.listing_id, "marketplace_offer");
      } else if (responseAction === "counter") {
        updateData.status = "counter";
        updateData.counter_price = body.counter_price;
        updateData.counter_message = body.counter_message || null;
        await createNotification(supabase, "🔄 Contra-proposta!", `O vendedor fez uma contra-proposta de R$ ${body.counter_price?.toFixed(2)} por "${offer.listing?.title}".`, offer.buyer_cpf, offer.listing_id, "marketplace_offer");
      }

      const { error } = await supabase
        .from("vault_marketplace_offers")
        .update(updateData)
        .eq("id", offerId);

      if (error) throw error;
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Ação não encontrada" }, 404);
  } catch (error: any) {
    console.error("Marketplace error:", error);
    return jsonResponse({ error: error.message }, 500);
  }
});
