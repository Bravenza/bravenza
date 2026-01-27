import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPERFRETE_API_URL = "https://api.superfrete.com";

interface FreightQuoteRequest {
  action: "quote";
  from_cep: string;
  to_cep: string;
  weight: number; // em kg
  height: number; // em cm
  width: number; // em cm
  length: number; // em cm
  insurance_value?: number;
  token: string;
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
  token: string;
}

interface TrackingRequest {
  action: "tracking";
  tracking_code: string;
  token: string;
}

interface GetLabelRequest {
  action: "get_label";
  label_id: string;
  token: string;
}

interface CancelLabelRequest {
  action: "cancel_label";
  label_id: string;
  token: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, token } = body;

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token da API SuperFrete não configurado" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const headers = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "Bravenza/1.0",
    };

    console.log(`[SuperFrete] Action: ${action}`);

    switch (action) {
      case "quote": {
        const { from_cep, to_cep, weight, height, width, length, insurance_value } = body as FreightQuoteRequest;

        console.log(`[SuperFrete] Quote request: ${from_cep} -> ${to_cep}, ${weight}kg`);

        const payload = {
          from: { postal_code: from_cep.replace(/\D/g, "") },
          to: { postal_code: to_cep.replace(/\D/g, "") },
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
            state_abbr: from.state,
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
            state_abbr: to.state,
            postal_code: to.postal_code.replace(/\D/g, ""),
            country_id: "BR",
          },
          products: products,
          package: {
            weight: pkg.weight,
            height: pkg.height,
            width: pkg.width,
            length: pkg.length,
          },
          options: {
            insurance_value: insurance_value || 0,
            receipt: false,
            own_hand: false,
            non_commercial: true,
          },
        };

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
