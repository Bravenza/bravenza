import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-client-cpf",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

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
    return new Response(JSON.stringify({ error: "CPF não informado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
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

      // Check favorites for current user
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

      return new Response(JSON.stringify({ listings: enriched, total: count }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

      // Increment view count
      await supabase
        .from("vault_marketplace_listings")
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq("id", listingId);

      // Check fav
      const { data: fav } = await supabase
        .from("vault_marketplace_favorites")
        .select("id")
        .eq("listing_id", listingId)
        .eq("user_cpf", clientCpf)
        .maybeSingle();

      return new Response(JSON.stringify({ ...data, is_favorited: !!fav }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET: My listings (as seller)
    if (req.method === "GET" && action === "my-listings") {
      // Get member + seller profile
      const { data: member } = await supabase
        .from("vault_members")
        .select("id")
        .eq("client_cpf", clientCpf)
        .single();

      if (!member) {
        return new Response(JSON.stringify({ listings: [], seller: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: seller } = await supabase
        .from("vault_seller_profiles")
        .select("*")
        .eq("member_id", member.id)
        .maybeSingle();

      if (!seller) {
        return new Response(JSON.stringify({ listings: [], seller: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: listings } = await supabase
        .from("vault_marketplace_listings")
        .select("*")
        .eq("seller_id", seller.id)
        .order("created_at", { ascending: false });

      return new Response(JSON.stringify({ listings: listings || [], seller }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST: Create listing
    if (req.method === "POST" && action === "create-listing") {
      const body = await req.json();

      // Get or create seller profile
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

      return new Response(JSON.stringify({ success: true, listing }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PUT: Update listing
    if (req.method === "PUT" && action === "update-listing") {
      const body = await req.json();
      const listingId = body.id;

      // Verify ownership
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

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

        await supabase.rpc("increment_field", {
          table_name: "vault_marketplace_listings",
          field_name: "favorites_count",
          row_id: listing_id,
          increment_by: -1,
        }).catch(() => {
          // Fallback: direct update
          supabase
            .from("vault_marketplace_listings")
            .update({ favorites_count: 0 })
            .eq("id", listing_id);
        });

        return new Response(JSON.stringify({ favorited: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        await supabase
          .from("vault_marketplace_favorites")
          .insert({ listing_id, user_cpf: clientCpf });

        return new Response(JSON.stringify({ favorited: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET: Seller profile/stats
    if (req.method === "GET" && action === "seller-profile") {
      const { data: member } = await supabase
        .from("vault_members")
        .select("id")
        .eq("client_cpf", clientCpf)
        .single();

      if (!member) {
        return new Response(JSON.stringify({ seller: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: seller } = await supabase
        .from("vault_seller_profiles")
        .select("*")
        .eq("member_id", member.id)
        .maybeSingle();

      return new Response(JSON.stringify({ seller }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação não encontrada" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Marketplace error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
