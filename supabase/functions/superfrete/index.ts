const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
};

const SUPERFRETE_API_URL = "https://api.superfrete.com";

// Default services for quoting (common BR services). SuperFrete may require a non-empty list.
const DEFAULT_QUOTE_SERVICES = [1, 2, 3];

interface FreightQuoteRequest {
  action: "quote";
  from_cep: string;
  to_cep: string;
  weight: number;
  height: number;
  width: number;
  length: number;
  insurance_value?: number;
  services?: number[] | string;
}

interface ListServicesRequest {
  action: "list_services";
}

interface CreateLabelRequest {
  action: "create_label";
  service_id: number;
  from: {
    name: string;
    phone: string;
    email: string;
    document: string;
    address: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    postal_code: string;
  };
  to: {
    name: string;
    phone: string;
    email?: string;
    document?: string;
    address: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    postal_code: string;
  };
  products: {
    name: string;
    quantity: number;
    unitary_value: number;
  }[];
  package: {
    weight: number;
    height: number;
    width: number;
    length: number;
  };
  insurance_value?: number;
}

interface TrackingRequest {
  action: "tracking";
  tracking_code: string;
}

interface GetLabelRequest {
  action: "get_label";
  label_id: string;
}

interface CancelLabelRequest {
  action: "cancel_label";
  label_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get token from environment (Supabase secret)
    const token = Deno.env.get("SUPERFRETE_API_TOKEN");
    
    if (!token) {
      console.error("[SuperFrete] Token not configured in environment");
      return new Response(
        JSON.stringify({ error: "Token da API SuperFrete não configurado no servidor" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action } = body;

    const headers = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "Bravenza/1.0",
    };

    console.log(`[SuperFrete] Action: ${action}`);

    switch (action) {
      case "list_services": {
        console.log("[SuperFrete] Listing services");

        const response = await fetch(`${SUPERFRETE_API_URL}/api/v0/services`, {
          method: "GET",
          headers,
        });

        const raw = await response.text();
        let data: unknown = raw;
        try {
          data = JSON.parse(raw);
        } catch {
          // keep raw text (likely HTML error page)
        }
        console.log(`[SuperFrete] List services response status: ${response.status}`);

        if (!response.ok) {
          console.error("[SuperFrete] List services error:", data);
          const message =
            typeof data === "object" &&
            data !== null &&
            "message" in data &&
            typeof (data as Record<string, unknown>).message === "string"
              ? String((data as Record<string, unknown>).message)
              : "Erro ao listar serviços";
          return new Response(
            JSON.stringify({ error: message, details: data }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case "quote": {
        const { from_cep, to_cep, weight, height, width, length, insurance_value, services } = body as FreightQuoteRequest;

        console.log(`[SuperFrete] Quote request: ${from_cep} -> ${to_cep}, ${weight}kg`);

        const serviceIds = (() => {
          if (typeof services === "string" && services.trim().length > 0) return services;
          const list = Array.isArray(services) && services.length > 0 ? services : DEFAULT_QUOTE_SERVICES;
          // SuperFrete backend expects a CSV string and internally does `split(',')`.
          return list.join(",");
        })();

        const payload = {
          from: { postal_code: from_cep.replace(/\D/g, "") },
          to: { postal_code: to_cep.replace(/\D/g, "") },
          // Some SuperFrete accounts require explicitly sending `services` and it must be non-empty.
          // Their API expects a CSV string (it calls `.split(',')` internally).
          services: serviceIds,
          package: {
            weight: weight,
            height: height,
            width: width,
            length: length,
          },
          options: {
            insurance_value: insurance_value || 0,
            receipt: false,
            own_hand: false,
          },
        };

        const response = await fetch(`${SUPERFRETE_API_URL}/api/v0/calculator`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        console.log(`[SuperFrete] Quote response status: ${response.status}`);

        if (!response.ok) {
          console.error(`[SuperFrete] Quote error:`, data);
          return new Response(
            JSON.stringify({ error: data.message || "Erro ao calcular frete", details: data }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case "create_label": {
        const { service_id, from, to, products, package: pkg, insurance_value } = body as CreateLabelRequest;

        console.log(`[SuperFrete] Creating label for service ${service_id}`);

        // A API SuperFrete requer "volumes" (não "package") conforme documentação:
        // https://superfrete.readme.io/reference/adicionar-frete-carrinho
        const payload = {
          service: service_id,
          from: {
            name: from.name,
            phone: from.phone.replace(/\D/g, ""),
            email: from.email,
            document: from.document.replace(/\D/g, ""),
            address: from.address,
            number: from.number,
            complement: from.complement || "",
            district: from.neighborhood,
            city: from.city,
            state_abbr: from.state.toUpperCase(),
            postal_code: from.postal_code.replace(/\D/g, ""),
            country_id: "BR",
          },
          to: {
            name: to.name,
            phone: to.phone.replace(/\D/g, ""),
            email: to.email || "",
            document: to.document?.replace(/\D/g, "") || "",
            address: to.address,
            number: to.number,
            complement: to.complement || "",
            district: to.neighborhood,
            city: to.city,
            state_abbr: to.state.toUpperCase(),
            postal_code: to.postal_code.replace(/\D/g, ""),
            country_id: "BR",
          },
          products: products,
          // Campo obrigatório: "volumes" (objeto com dimensões do pacote)
          volumes: {
            weight: Number(pkg.weight),
            height: Number(pkg.height),
            width: Number(pkg.width),
            length: Number(pkg.length),
          },
          options: {
            insurance_value: insurance_value || 0,
            receipt: false,
            own_hand: false,
            non_commercial: true,
          },
        };

        console.log(`[SuperFrete] Create label payload:`, JSON.stringify(payload));

        const response = await fetch(`${SUPERFRETE_API_URL}/api/v0/cart`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        console.log(`[SuperFrete] Create label response status: ${response.status}`);

        if (!response.ok) {
          console.error(`[SuperFrete] Create label error:`, data);
          return new Response(
            JSON.stringify({ error: data.message || "Erro ao criar etiqueta", details: data }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Se o carrinho foi criado, precisamos fazer o checkout
        if (data.id) {
          console.log(`[SuperFrete] Cart created, proceeding to checkout: ${data.id}`);
          
          const checkoutResponse = await fetch(`${SUPERFRETE_API_URL}/api/v0/checkout`, {
            method: "POST",
            headers,
            body: JSON.stringify({ orders: [data.id] }),
          });

          const checkoutData = await checkoutResponse.json();
          console.log(`[SuperFrete] Checkout response status: ${checkoutResponse.status}`);

          if (!checkoutResponse.ok) {
            console.error(`[SuperFrete] Checkout error:`, checkoutData);
            return new Response(
              JSON.stringify({ error: checkoutData.message || "Erro no checkout", details: checkoutData }),
              { status: checkoutResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ cart: data, checkout: checkoutData }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case "get_label": {
        const { label_id } = body as GetLabelRequest;

        console.log(`[SuperFrete] Getting label: ${label_id}`);

        const response = await fetch(`${SUPERFRETE_API_URL}/api/v0/order/${label_id}/print`, {
          method: "POST",
          headers,
          body: JSON.stringify({ mode: "public" }),
        });

        const data = await response.json();
        console.log(`[SuperFrete] Get label response status: ${response.status}`);

        if (!response.ok) {
          console.error(`[SuperFrete] Get label error:`, data);
          return new Response(
            JSON.stringify({ error: data.message || "Erro ao obter etiqueta", details: data }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case "cancel_label": {
        const { label_id } = body as CancelLabelRequest;

        console.log(`[SuperFrete] Canceling label: ${label_id}`);

        const response = await fetch(`${SUPERFRETE_API_URL}/api/v0/order/${label_id}/cancel`, {
          method: "POST",
          headers,
          body: JSON.stringify({ reason_id: 2, description: "Cancelamento solicitado pelo usuário" }),
        });

        const data = await response.json();
        console.log(`[SuperFrete] Cancel label response status: ${response.status}`);

        if (!response.ok) {
          console.error(`[SuperFrete] Cancel label error:`, data);
          return new Response(
            JSON.stringify({ error: data.message || "Erro ao cancelar etiqueta", details: data }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case "tracking": {
        const { tracking_code } = body as TrackingRequest;

        console.log(`[SuperFrete] Tracking: ${tracking_code}`);

        const response = await fetch(`${SUPERFRETE_API_URL}/api/v0/tracking/${tracking_code}`, {
          method: "GET",
          headers,
        });

        const data = await response.json();
        console.log(`[SuperFrete] Tracking response status: ${response.status}`);

        if (!response.ok) {
          console.error(`[SuperFrete] Tracking error:`, data);
          return new Response(
            JSON.stringify({ error: data.message || "Erro ao rastrear", details: data }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Ação desconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    console.error(`[SuperFrete] Error:`, error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
