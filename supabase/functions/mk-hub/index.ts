// Marketplace Hub - All marketplace actions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ch = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-client-cpf",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

function j(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...ch, "Content-Type": "application/json" } });
}

async function gm(sb: any, c: string) {
  const { data } = await sb.from("vault_members").select("id").eq("client_cpf", c).single();
  return data;
}

async function gs(sb: any, m: string) {
  const { data } = await sb.from("vault_seller_profiles").select("*").eq("member_id", m).maybeSingle();
  return data;
}

async function nt(sb: any, t: string, m: string, c: string, ri?: string, rt?: string) {
  try {
    await sb.from("notifications").insert({
      title: t, message: m, target: "client", target_client_cpf: c,
      type: "info", reference_id: ri || null, reference_type: rt || "marketplace",
    });
  } catch (_) {}
}

function gc() {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let r = "MKT-";
  for (let i = 0; i < 6; i++) r += c.charAt(Math.floor(Math.random() * c.length));
  return r;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: ch });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const cpf = req.headers.get("x-client-cpf");
  if (!cpf) return j({ error: "CPF obrigatório" }, 401);

  const url = new URL(req.url);
  const a = url.searchParams.get("action");
  const mt = req.method;

  console.log("mk-hub", a, mt);

  try {
    // ==================== LISTINGS (mklist) ====================

    if (mt === "GET" && a === "listings") {
      const pg = parseInt(url.searchParams.get("page") || "1"), lm = 20, of = (pg - 1) * lm;
      let q = sb.from("vault_marketplace_listings").select(
        `*, seller:vault_seller_profiles!inner(id, seller_cep, member:vault_members!inner(client_name, tier), average_rating, total_sales_count, current_fee_percent)`,
        { count: "exact" }
      ).eq("status", "active");
      const sr = url.searchParams.get("search"), br = url.searchParams.get("brand"),
        sz = url.searchParams.get("size"), cn = url.searchParams.get("condition"),
        pm = url.searchParams.get("price_min"), px = url.searchParams.get("price_max"),
        so = url.searchParams.get("sort") || "recent",
        fo = url.searchParams.get("favorites_only");
      if (fo === "true") {
        const { data: favs } = await sb.from("vault_marketplace_favorites").select("listing_id").eq("user_cpf", cpf);
        const favIds = (favs || []).map((f: any) => f.listing_id);
        if (favIds.length === 0) return j({ listings: [], total: 0 });
        q = q.in("id", favIds);
      }
      if (sr) q = q.or(`title.ilike.%${sr}%,brand.ilike.%${sr}%,model.ilike.%${sr}%`);
      if (br) q = q.ilike("brand", `%${br}%`);
      if (sz) q = q.eq("size", sz);
      if (cn) q = q.eq("condition", cn);
      if (pm) q = q.gte("price", parseFloat(pm));
      if (px) q = q.lte("price", parseFloat(px));
      if (so === "price_asc") q = q.order("price", { ascending: true });
      else if (so === "price_desc") q = q.order("price", { ascending: false });
      else if (so === "popular") q = q.order("views_count", { ascending: false });
      else q = q.order("published_at", { ascending: false });
      q = q.range(of, of + lm - 1);
      const { data, count, error } = await q;
      if (error) throw error;
      const ids = (data || []).map((l: any) => l.id);
      let fs = new Set<string>();
      if (ids.length > 0) {
        const { data: fv } = await sb.from("vault_marketplace_favorites").select("listing_id").eq("user_cpf", cpf).in("listing_id", ids);
        fs = new Set((fv || []).map((f: any) => f.listing_id));
      }
      return j({ listings: (data || []).map((l: any) => ({ ...l, is_favorited: fs.has(l.id) })), total: count });
    }

    if (mt === "GET" && a === "listing-detail") {
      const id = url.searchParams.get("id");
      if (!id) throw new Error("ID obrigatório");
      const { data, error } = await sb.from("vault_marketplace_listings").select(
        `*, seller:vault_seller_profiles!inner(id, seller_cep, member:vault_members!inner(client_name, tier), average_rating, total_sales_count, current_fee_percent, bio)`
      ).eq("id", id).single();
      if (error) throw error;
      await sb.from("vault_marketplace_listings").update({ views_count: (data.views_count || 0) + 1 }).eq("id", id);
      const { data: fv } = await sb.from("vault_marketplace_favorites").select("id").eq("listing_id", id).eq("user_cpf", cpf).maybeSingle();
      return j({ ...data, is_favorited: !!fv });
    }

    if (mt === "GET" && a === "my-listings") {
      const mb = await gm(sb, cpf);
      if (!mb) return j({ listings: [], seller: null });
      const sl = await gs(sb, mb.id);
      if (!sl) return j({ listings: [], seller: null });
      const { data } = await sb.from("vault_marketplace_listings").select("*").eq("seller_id", sl.id).order("created_at", { ascending: false });
      return j({ listings: data || [], seller: sl });
    }

    if (mt === "POST" && a === "create-listing") {
      const b = await req.json();
      const mb = await gm(sb, cpf);
      if (!mb) throw new Error("Membro não encontrado");
      let sl = await gs(sb, mb.id);
      if (!sl) {
        const { data: ns, error: se } = await sb.from("vault_seller_profiles").insert({ member_id: mb.id }).select().single();
        if (se) throw se;
        sl = ns;
      }
      const { data: li, error } = await sb.from("vault_marketplace_listings").insert({
        seller_id: sl.id, vault_item_id: b.vault_item_id || null, title: b.title,
        description: b.description || null, brand: b.brand || null, model: b.model || null,
        colorway: b.colorway || null, size: b.size || null, condition: b.condition || "usado_bom",
        photos: b.photos || [], price: b.price, original_purchase_price: b.original_purchase_price || null,
        shipping_mode: (b.price >= 2000) ? "bravenza" : (b.shipping_mode || "direct"), shipping_cost_estimate: b.shipping_cost_estimate || 0,
        is_vault_certified: !!b.vault_item_id, status: "active", published_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      return j({ success: true, listing: li });
    }

    if (mt === "PUT" && a === "update-listing") {
      const b = await req.json();
      const mb = await gm(sb, cpf);
      if (!mb) throw new Error("Membro não encontrado");
      const sl = await gs(sb, mb.id);
      if (!sl) throw new Error("Vendedor não encontrado");
      const { error } = await sb.from("vault_marketplace_listings").update({
        title: b.title, description: b.description, price: b.price, condition: b.condition,
        shipping_mode: (b.price >= 2000) ? "bravenza" : b.shipping_mode, shipping_cost_estimate: b.shipping_cost_estimate,
        photos: b.photos, status: b.status,
      }).eq("id", b.id).eq("seller_id", sl.id);
      if (error) throw error;
      return j({ success: true });
    }

    if (mt === "POST" && a === "toggle-favorite") {
      const { listing_id } = await req.json();
      const { data: ex } = await sb.from("vault_marketplace_favorites").select("id").eq("listing_id", listing_id).eq("user_cpf", cpf).maybeSingle();
      if (ex) {
        await sb.from("vault_marketplace_favorites").delete().eq("id", ex.id);
        return j({ favorited: false });
      }
      await sb.from("vault_marketplace_favorites").insert({ listing_id, user_cpf: cpf });
      return j({ favorited: true });
    }

    if (mt === "DELETE" && a === "delete-listing") {
      const id = url.searchParams.get("id");
      if (!id) throw new Error("ID obrigatório");
      const mb = await gm(sb, cpf);
      if (!mb) throw new Error("Membro não encontrado");
      const sl = await gs(sb, mb.id);
      if (!sl) throw new Error("Vendedor não encontrado");
      const { error } = await sb.from("vault_marketplace_listings").delete().eq("id", id).eq("seller_id", sl.id);
      if (error) throw error;
      return j({ success: true });
    }

    if (mt === "GET" && a === "seller-profile") {
      const mb = await gm(sb, cpf);
      if (!mb) return j({ seller: null });
      return j({ seller: await gs(sb, mb.id) });
    }

    if (mt === "GET" && a === "seller-public-profile") {
      const sid = url.searchParams.get("seller_id");
      if (!sid) throw new Error("seller_id obrigatório");
      const { data: sl } = await sb.from("vault_seller_profiles").select(
        `id, bio, total_sales_count, total_sales_value, average_rating, ratings_count, current_fee_percent, member:vault_members!inner(client_name, tier, created_at)`
      ).eq("id", sid).single();
      if (!sl) throw new Error("Vendedor não encontrado");
      const { data: ls } = await sb.from("vault_marketplace_listings").select("*").eq("seller_id", sid).eq("status", "active").order("published_at", { ascending: false });
      const { data: rv } = await sb.from("vault_marketplace_orders").select("buyer_name, buyer_rating, buyer_review, created_at").eq("seller_id", sid).not("buyer_rating", "is", null).order("created_at", { ascending: false }).limit(10);
      return j({ ...sl, listings: ls || [], recent_reviews: rv || [] });
    }

    // ==================== ORDERS (mkord) ====================

    if (mt === "POST" && a === "create-order") {
      const b = await req.json();
      const { data: li } = await sb.from("vault_marketplace_listings").select(
        `*, seller:vault_seller_profiles!inner(id, current_fee_percent, member:vault_members!inner(client_cpf, client_name))`
      ).eq("id", b.listing_id).eq("status", "active").single();
      if (!li) throw new Error("Anúncio não encontrado");
      if (li.seller?.member?.client_cpf === cpf) throw new Error("Não pode comprar próprio anúncio");
      const fp = li.seller?.current_fee_percent || 14;
      const fa = Math.round(li.price * fp) / 100;
      const sp = li.price - fa;
      const oc = gc();
      const { data: od, error } = await sb.from("vault_marketplace_orders").insert({
        order_code: oc, listing_id: li.id, buyer_cpf: cpf, buyer_name: b.buyer_name,
        seller_id: li.seller.id, sale_price: li.price, fee_percent: fp, fee_amount: fa,
        seller_payout: sp, shipping_mode: li.shipping_mode,
        shipping_cost: li.shipping_cost_estimate || 0, status: "pending_payment",
      }).select().single();
      if (error) throw error;
      await sb.from("vault_marketplace_listings").update({ status: "reserved" }).eq("id", li.id);
      await nt(sb, "🛒 Nova venda!", `${b.buyer_name} comprou "${li.title}".`, li.seller.member.client_cpf, od.id, "marketplace_order");
      return j({ success: true, order: od });
    }

    if (mt === "PUT" && a === "confirm-payment") {
      const b = await req.json();
      const pe = new Date();
      pe.setDate(pe.getDate() + 10);
      const { error } = await sb.from("vault_marketplace_orders").update({
        status: "paid", payment_method: b.payment_method, paid_at: new Date().toISOString(),
        protection_ends_at: pe.toISOString(),
      }).eq("id", b.order_id).eq("buyer_cpf", cpf);
      if (error) throw error;
      return j({ success: true });
    }

    if (mt === "GET" && a === "my-orders") {
      const { data, error } = await sb.from("vault_marketplace_orders").select(
        `*, listing:vault_marketplace_listings!inner(title, brand, model, size, photos, condition, is_vault_certified)`
      ).eq("buyer_cpf", cpf).order("created_at", { ascending: false });
      if (error) throw error;
      return j({ orders: data || [] });
    }

    if (mt === "GET" && a === "my-sales") {
      const { data: mb } = await sb.from("vault_members").select("id").eq("client_cpf", cpf).single();
      if (!mb) return j({ orders: [] });
      const { data: sl } = await sb.from("vault_seller_profiles").select("id").eq("member_id", mb.id).maybeSingle();
      if (!sl) return j({ orders: [] });
      const { data, error } = await sb.from("vault_marketplace_orders").select(
        `*, listing:vault_marketplace_listings!inner(title, brand, model, size, photos, condition)`
      ).eq("seller_id", sl.id).order("created_at", { ascending: false });
      if (error) throw error;
      return j({ orders: data || [] });
    }

    if (mt === "PUT" && a === "update-order-status") {
      const b = await req.json();
      const u: Record<string, any> = { status: b.status };
      if (b.status === "shipped") {
        u.shipped_at = new Date().toISOString();
        u.tracking_code = b.tracking_code || null;
      } else if (b.status === "delivered") {
        u.delivered_at = new Date().toISOString();
      } else if (b.status === "cancelled") {
        u.cancelled_at = new Date().toISOString();
        if (b.listing_id) await sb.from("vault_marketplace_listings").update({ status: "active" }).eq("id", b.listing_id);
      } else if (b.status === "payout_released") {
        u.payout_released_at = new Date().toISOString();
        u.payout_method = b.payout_method || "pix";
      }
      if (b.admin_notes) u.admin_notes = b.admin_notes;
      const { error } = await sb.from("vault_marketplace_orders").update(u).eq("id", b.order_id);
      if (error) throw error;
      return j({ success: true });
    }

    if (mt === "POST" && a === "open-dispute") {
      const b = await req.json();
      const { error } = await sb.from("vault_marketplace_orders").update({
        dispute_status: "open", admin_notes: b.reason || "Disputa aberta",
      }).eq("id", b.order_id).eq("buyer_cpf", cpf);
      if (error) throw error;
      return j({ success: true });
    }

    if (mt === "PUT" && a === "resolve-dispute") {
      const b = await req.json();
      const { error } = await sb.from("vault_marketplace_orders").update({
        dispute_status: b.resolution, admin_notes: b.admin_notes || null,
        status: b.new_status || "dispute_resolved",
      }).eq("id", b.order_id);
      if (error) throw error;
      return j({ success: true });
    }

    if (mt === "POST" && a === "rate-seller") {
      const b = await req.json();
      const { error } = await sb.from("vault_marketplace_orders").update({
        buyer_rating: b.rating, buyer_review: b.review || null,
      }).eq("id", b.order_id).eq("buyer_cpf", cpf);
      if (error) throw error;
      const { data: od } = await sb.from("vault_marketplace_orders").select("seller_id").eq("id", b.order_id).single();
      if (od) {
        const { data: ar } = await sb.from("vault_marketplace_orders").select("buyer_rating").eq("seller_id", od.seller_id).not("buyer_rating", "is", null);
        if (ar && ar.length > 0) {
          const avg = ar.reduce((s: number, r: any) => s + r.buyer_rating, 0) / ar.length;
          await sb.from("vault_seller_profiles").update({
            average_rating: Math.round(avg * 10) / 10, ratings_count: ar.length,
          }).eq("id", od.seller_id);
        }
      }
      return j({ success: true });
    }

    if (mt === "GET" && a === "admin-orders") {
      const st = url.searchParams.get("status");
      let q = sb.from("vault_marketplace_orders").select(
        `*, listing:vault_marketplace_listings!inner(title, brand, model, size, photos, condition)`
      ).order("created_at", { ascending: false });
      if (st && st !== "all") q = q.eq("status", st);
      const { data, error } = await q;
      if (error) throw error;
      return j({ orders: data || [] });
    }

    // ==================== CHAT (mkchat) ====================

    if (mt === "GET" && a === "chat-messages") {
      const oi = url.searchParams.get("order_id"), li = url.searchParams.get("listing_id");
      let q = sb.from("vault_marketplace_messages").select("*").order("created_at", { ascending: true });
      if (oi) q = q.eq("order_id", oi);
      else if (li) q = q.eq("listing_id", li);
      else throw new Error("order_id ou listing_id obrigatório");
      const { data, error } = await q;
      if (error) throw error;
      if (data && data.length > 0) {
        const ur = data.filter((m: any) => m.sender_cpf !== cpf && !m.read_at).map((m: any) => m.id);
        if (ur.length > 0) await sb.from("vault_marketplace_messages").update({ read_at: new Date().toISOString() }).in("id", ur);
      }
      return j({ messages: data || [] });
    }

    if (mt === "POST" && a === "send-message") {
      const b = await req.json();
      const { data: mg, error } = await sb.from("vault_marketplace_messages").insert({
        order_id: b.order_id || null, listing_id: b.listing_id || null,
        sender_cpf: cpf, sender_name: b.sender_name, message: b.message,
        is_admin: b.is_admin || false,
      }).select().single();
      if (error) throw error;
      if (b.order_id) {
        const { data: od } = await sb.from("vault_marketplace_orders").select(
          `buyer_cpf, listing:vault_marketplace_listings!inner(title), seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf))`
        ).eq("id", b.order_id).single();
        if (od) {
          const to = cpf === od.buyer_cpf ? od.seller?.member?.client_cpf : od.buyer_cpf;
          if (to) await nt(sb, "💬 Nova mensagem", `Mensagem sobre "${od.listing?.title}".`, to, b.order_id, "marketplace_chat");
        }
      }
      return j({ success: true, message: mg });
    }

    // ==================== OFFERS (mkoff) ====================

    if (mt === "POST" && a === "make-offer") {
      const b = await req.json();
      const { data: li } = await sb.from("vault_marketplace_listings").select(
        `id, title, seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf))`
      ).eq("id", b.listing_id).eq("status", "active").single();
      if (!li) throw new Error("Anúncio não encontrado");
      if (li.seller?.member?.client_cpf === cpf) throw new Error("Não pode ofertar próprio anúncio");
      const { data: of2, error } = await sb.from("vault_marketplace_offers").insert({
        listing_id: b.listing_id, buyer_cpf: cpf, buyer_name: b.buyer_name || "Comprador",
        offer_price: b.offer_price, message: b.message || null,
      }).select().single();
      if (error) throw error;
      await nt(sb, "💰 Nova oferta!", `R$ ${b.offer_price.toFixed(2)} por "${li.title}".`, li.seller.member.client_cpf, li.id, "marketplace_offer");
      return j({ success: true, offer: of2 });
    }

    if (mt === "GET" && a === "listing-offers") {
      const lid = url.searchParams.get("listing_id");
      if (!lid) throw new Error("listing_id obrigatório");
      const { data, error } = await sb.from("vault_marketplace_offers").select("*").eq("listing_id", lid).order("created_at", { ascending: false });
      if (error) throw error;
      return j({ offers: data || [] });
    }

    if (mt === "GET" && a === "my-offers") {
      const { data, error } = await sb.from("vault_marketplace_offers").select(
        `*, listing:vault_marketplace_listings!inner(title, photos, price)`
      ).eq("buyer_cpf", cpf).order("created_at", { ascending: false });
      if (error) throw error;
      return j({ offers: data || [] });
    }

    if (mt === "PUT" && a === "respond-offer") {
      const b = await req.json();
      const { data: of2 } = await sb.from("vault_marketplace_offers").select(
        `id, listing_id, buyer_cpf, offer_price, listing:vault_marketplace_listings!inner(title)`
      ).eq("id", b.offer_id).single();
      if (!of2) throw new Error("Oferta não encontrada");
      const u: Record<string, any> = { responded_at: new Date().toISOString() };
      if (b.response === "accept") {
        u.status = "accepted";
        await nt(sb, "✅ Oferta aceita!", `Oferta por "${of2.listing?.title}" aceita!`, of2.buyer_cpf, of2.listing_id, "marketplace_offer");
      } else if (b.response === "reject") {
        u.status = "rejected";
        await nt(sb, "❌ Recusada", `Oferta por "${of2.listing?.title}" recusada.`, of2.buyer_cpf, of2.listing_id, "marketplace_offer");
      } else if (b.response === "counter") {
        u.status = "counter";
        u.counter_price = b.counter_price;
        u.counter_message = b.counter_message || null;
        await nt(sb, "🔄 Contra-proposta!", `R$ ${b.counter_price?.toFixed(2)} por "${of2.listing?.title}".`, of2.buyer_cpf, of2.listing_id, "marketplace_offer");
      }
      const { error } = await sb.from("vault_marketplace_offers").update(u).eq("id", b.offer_id);
      if (error) throw error;
      return j({ success: true });
    }

    // ==================== FREIGHT QUOTE ====================
    if (mt === "POST" && a === "freight-quote") {
      const b = await req.json();
      const { listing_id, buyer_cep } = b;
      if (!listing_id || !buyer_cep) throw new Error("listing_id e buyer_cep obrigatórios");

      // Get listing with seller info
      const { data: listing } = await sb.from("vault_marketplace_listings").select(
        `*, seller:vault_seller_profiles!inner(seller_cep)`
      ).eq("id", listing_id).single();
      if (!listing) throw new Error("Anúncio não encontrado");

      const sellerCep = listing.seller?.seller_cep;
      const isBravenza = listing.shipping_mode === "bravenza";

      // Get Bravenza warehouse CEP
      const { data: whSetting } = await sb.from("system_settings").select("value").eq("key", "bravenza_warehouse_cep").maybeSingle();
      const bravenzaCep = whSetting?.value ? String(whSetting.value).replace(/"/g, "") : "90040191";

      // Default package for sneakers
      const pkg = { weight: 1.2, height: 15, width: 35, length: 30 };
      const insuranceValue = listing.price || 0;

      // SuperFrete API
      const sfToken = Deno.env.get("SUPERFRETE_API_TOKEN");
      if (!sfToken) throw new Error("Token SuperFrete não configurado");

      const sfHeaders = {
        "Authorization": `Bearer ${sfToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Bravenza/1.0",
      };

      const quotePayload = (fromCep: string, toCep: string) => ({
        from: { postal_code: fromCep.replace(/\D/g, "") },
        to: { postal_code: toCep.replace(/\D/g, "") },
        services: "1,2,3",
        package: pkg,
        options: { insurance_value: insuranceValue, receipt: false, own_hand: false },
      });

      const doQuote = async (fromCep: string, toCep: string) => {
        const res = await fetch("https://api.superfrete.com/api/v0/calculator", {
          method: "POST",
          headers: sfHeaders,
          body: JSON.stringify(quotePayload(fromCep, toCep)),
        });
        const data = await res.json();
        if (!res.ok) {
          console.error("SuperFrete quote error:", data);
          return [];
        }
        return Array.isArray(data) ? data : [];
      };

      let quotes: any[] = [];
      let legs: any = null;

      if (isBravenza) {
        // Two-leg: seller → Bravenza, then Bravenza → buyer
        const fromCep = sellerCep || bravenzaCep;
        const leg1 = await doQuote(fromCep, bravenzaCep);
        const leg2 = await doQuote(bravenzaCep, buyer_cep);

        // Combine: for each service, sum prices from both legs
        const leg2Map: Record<number, any> = {};
        for (const q of leg2) { if (q.id) leg2Map[q.id] = q; }

        for (const q1 of leg1) {
          const q2 = leg2Map[q1.id];
          if (q2 && !q1.error && !q2.error) {
            const BRAVENZA_PROCESSING_DAYS = 5;
            quotes.push({
              ...q1,
              price: (parseFloat(q1.price || "0") + parseFloat(q2.price || "0")).toFixed(2),
              delivery_time: (q1.delivery_time || 0) + BRAVENZA_PROCESSING_DAYS + (q2.delivery_time || 0),
              legs: {
                seller_to_bravenza: { price: q1.price, delivery_time: q1.delivery_time },
                bravenza_processing: { delivery_time: BRAVENZA_PROCESSING_DAYS },
                bravenza_to_buyer: { price: q2.price, delivery_time: q2.delivery_time },
              },
            });
          }
        }
        legs = { mode: "bravenza", seller_cep: fromCep, warehouse_cep: bravenzaCep, buyer_cep: buyer_cep };
      } else {
        // Direct: seller → buyer
        const fromCep = sellerCep || bravenzaCep;
        quotes = await doQuote(fromCep, buyer_cep);
        quotes = quotes.filter((q: any) => !q.error);
        legs = { mode: "direct", seller_cep: fromCep, buyer_cep: buyer_cep };
      }

      return j({ quotes, legs, shipping_mode: listing.shipping_mode });
    }

    // ==================== CATALOG ====================

    if (mt === "GET" && a === "catalog-products") {
      const pg = parseInt(url.searchParams.get("page") || "1"), lm = 24, of = (pg - 1) * lm;
      let q = sb.from("marketplace_products").select("*", { count: "exact" }).eq("is_active", true);
      const sr = url.searchParams.get("search"), br = url.searchParams.get("brand"), cat = url.searchParams.get("category");
      if (sr) q = q.or(`brand.ilike.%${sr}%,model.ilike.%${sr}%,colorway.ilike.%${sr}%`);
      if (br) q = q.ilike("brand", `%${br}%`);
      if (cat) q = q.eq("category", cat);
      q = q.order("total_offers", { ascending: false }).order("created_at", { ascending: false });
      q = q.range(of, of + lm - 1);
      const { data, count, error } = await q;
      if (error) throw error;
      return j({ products: data || [], total: count });
    }

    if (mt === "GET" && a === "catalog-product") {
      const slug = url.searchParams.get("slug");
      if (!slug) throw new Error("slug obrigatório");
      const { data: prod, error } = await sb.from("marketplace_products").select("*").eq("slug", slug).eq("is_active", true).single();
      if (error || !prod) throw new Error("Produto não encontrado");
      // Get distinct sizes with active offers
      const { data: offersRaw } = await sb.from("marketplace_offers").select("size").eq("product_id", prod.id).eq("status", "active");
      const sizes = [...new Set((offersRaw || []).map((o: any) => o.size))].sort((a, b) => {
        const na = parseFloat(a), nb = parseFloat(b);
        return isNaN(na) || isNaN(nb) ? a.localeCompare(b) : na - nb;
      });
      // Get all active offers with seller info
      const { data: offers } = await sb.from("marketplace_offers").select(
        `*, seller:vault_seller_profiles!inner(id, seller_cep, average_rating, total_sales_count, current_fee_percent, member:vault_members!inner(client_name, tier))`
      ).eq("product_id", prod.id).eq("status", "active").order("price", { ascending: true });
      return j({ product: prod, sizes, offers: offers || [] });
    }

    if (mt === "GET" && a === "catalog-offers") {
      const pid = url.searchParams.get("product_id"), sz = url.searchParams.get("size");
      if (!pid) throw new Error("product_id obrigatório");
      let q = sb.from("marketplace_offers").select(
        `*, seller:vault_seller_profiles!inner(id, seller_cep, average_rating, total_sales_count, current_fee_percent, member:vault_members!inner(client_name, tier))`
      ).eq("product_id", pid).eq("status", "active");
      if (sz) q = q.eq("size", sz);
      q = q.order("price", { ascending: true });
      const { data, error } = await q;
      if (error) throw error;
      return j({ offers: data || [] });
    }

    if (mt === "GET" && a === "catalog-search") {
      const q = url.searchParams.get("q") || "";
      if (!q || q.length < 2) return j({ products: [] });
      const { data } = await sb.from("marketplace_products").select("id, slug, brand, model, colorway, images, lowest_price, total_offers")
        .eq("is_active", true)
        .or(`brand.ilike.%${q}%,model.ilike.%${q}%,colorway.ilike.%${q}%`)
        .order("total_offers", { ascending: false })
        .limit(10);
      return j({ products: data || [] });
    }

    if (mt === "POST" && a === "catalog-create-product") {
      const b = await req.json();
      if (!b.brand || !b.model) throw new Error("brand e model obrigatórios");
      // Check if product already exists
      const { data: existing } = await sb.from("marketplace_products")
        .select("id, slug")
        .ilike("brand", b.brand)
        .ilike("model", b.model)
        .eq("is_active", true)
        .maybeSingle();
      if (existing) return j({ product: existing, already_exists: true });
      const mb = await gm(sb, cpf);
      const { data: prod, error } = await sb.from("marketplace_products").insert({
        brand: b.brand,
        model: b.model,
        colorway: b.colorway || null,
        sku: b.sku || null,
        category: b.category || "sneakers",
        images: b.images || [],
        description: b.description || null,
        created_by_seller_id: mb?.id || null,
      }).select().single();
      if (error) throw error;
      return j({ product: prod, already_exists: false });
    }

    if (mt === "POST" && a === "catalog-create-offer") {
      const b = await req.json();
      if (!b.product_id || !b.size || !b.price) throw new Error("product_id, size e price obrigatórios");
      const mb = await gm(sb, cpf);
      if (!mb) throw new Error("Membro não encontrado");
      let sl = await gs(sb, mb.id);
      if (!sl) {
        const { data: ns, error: se } = await sb.from("vault_seller_profiles").insert({ member_id: mb.id }).select().single();
        if (se) throw se;
        sl = ns;
      }
      // Also create a legacy listing for backward compatibility
      const { data: li } = await sb.from("vault_marketplace_listings").insert({
        seller_id: sl.id,
        vault_item_id: b.vault_item_id || null,
        title: `${b.brand || ""} ${b.model || ""} ${b.size || ""}`.trim(),
        description: b.description || null,
        brand: b.brand || null,
        model: b.model || null,
        size: b.size,
        condition: b.condition || "novo",
        photos: b.photos || [],
        price: b.price,
        original_purchase_price: b.original_purchase_price || null,
        shipping_mode: b.price >= 2000 ? "bravenza" : (b.shipping_mode || "direct"),
        shipping_cost_estimate: 0,
        is_vault_certified: !!b.vault_item_id,
        status: "active",
        published_at: new Date().toISOString(),
        product_id: b.product_id,
      }).select().single();
      const { data: offer, error } = await sb.from("marketplace_offers").insert({
        product_id: b.product_id,
        seller_id: sl.id,
        listing_id: li?.id || null,
        size: b.size,
        condition: b.condition || "novo",
        price: b.price,
        original_purchase_price: b.original_purchase_price || null,
        description: b.description || null,
        defects: b.defects || null,
        photos: b.photos || [],
        proof_photos: b.proof_photos || [],
        has_receipt: b.has_receipt || false,
        shipping_mode: b.price >= 2000 ? "bravenza" : (b.shipping_mode || "direct"),
        status: "active",
        published_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      return j({ offer, listing: li });
    }

    // ==================== WATCHLIST ====================

    if (mt === "GET" && a === "watchlist-check") {
      const pid = url.searchParams.get("product_id"), sz = url.searchParams.get("size") || "";
      if (!pid) throw new Error("product_id obrigatório");
      const { data } = await sb.from("marketplace_watchlist").select("id, max_price, is_active")
        .eq("product_id", pid).eq("size", sz).eq("user_cpf", cpf).eq("is_active", true).maybeSingle();
      return j({ active: !!data, max_price: data?.max_price || null });
    }

    if (mt === "POST" && a === "watchlist-toggle") {
      const b = await req.json();
      const { product_id, size, max_price } = b;
      if (!product_id) throw new Error("product_id obrigatório");
      const sz = size || "";
      // Check existing
      const { data: ex } = await sb.from("marketplace_watchlist").select("id, is_active")
        .eq("product_id", product_id).eq("size", sz).eq("user_cpf", cpf).maybeSingle();
      if (ex) {
        if (ex.is_active) {
          // Deactivate
          await sb.from("marketplace_watchlist").update({ is_active: false }).eq("id", ex.id);
          return j({ active: false, max_price: null });
        } else {
          // Reactivate
          await sb.from("marketplace_watchlist").update({ is_active: true, max_price: max_price || null }).eq("id", ex.id);
          return j({ active: true, max_price: max_price || null });
        }
      }
      // Create new
      await sb.from("marketplace_watchlist").insert({
        product_id, size: sz, user_cpf: cpf, max_price: max_price || null,
        is_active: true, notify_email: true, notify_push: true,
      });
      return j({ active: true, max_price: max_price || null });
    }

    // ==================== PRODUCT COMMENTS ====================

    if (mt === "GET" && a === "product-comments") {
      const pid = url.searchParams.get("product_id");
      if (!pid) throw new Error("product_id obrigatório");
      const { data, error } = await sb.from("marketplace_product_comments").select("*")
        .eq("product_id", pid).eq("is_visible", true).order("created_at", { ascending: true });
      if (error) throw error;
      return j({ comments: data || [] });
    }

    if (mt === "POST" && a === "product-comment") {
      const b = await req.json();
      if (!b.product_id || !b.content) throw new Error("product_id e content obrigatórios");
      // Get user name
      const { data: member } = await sb.from("vault_members").select("client_name").eq("client_cpf", cpf).maybeSingle();
      const userName = member?.client_name || "Usuário";
      const { data: comment, error } = await sb.from("marketplace_product_comments").insert({
        product_id: b.product_id,
        user_cpf: cpf,
        user_name: userName,
        content: b.content,
        parent_id: b.parent_id || null,
        is_seller_reply: false,
      }).select().single();
      if (error) throw error;
      return j({ comment });
    }

    // ==================== AUTO PAYOUT CHECK ====================

    if (mt === "GET" && a === "check-auto-payout") {
      // Find orders where protection has expired and payout not yet released
      const { data: orders, error } = await sb.from("vault_marketplace_orders").select("id, order_code, seller_id, seller_payout, protection_ends_at")
        .eq("status", "delivered").is("payout_released_at", null).is("dispute_status", null);
      if (error) throw error;
      const now = new Date();
      const eligible = (orders || []).filter((o: any) => o.protection_ends_at && new Date(o.protection_ends_at) < now);
      // Mark as payout_pending
      for (const o of eligible) {
        await sb.from("vault_marketplace_orders").update({
          status: "payout_pending",
        }).eq("id", o.id);
        // Notify seller
        const { data: sl } = await sb.from("vault_seller_profiles").select("member:vault_members!inner(client_cpf)").eq("id", o.seller_id).single();
        if (sl?.member?.client_cpf) {
          await nt(sb, "💰 Pagamento liberado!", `Pedido ${o.order_code} — R$ ${o.seller_payout.toFixed(2)} será transferido.`, sl.member.client_cpf, o.id, "marketplace_payout");
        }
      }
      return j({ checked: (orders || []).length, eligible: eligible.length });
    }

    return j({ error: "Ação não encontrada" }, 404);
  } catch (e: any) {
    console.error("vault-marketplace error:", e);
    return j({ error: e.message }, 500);
  }
});
