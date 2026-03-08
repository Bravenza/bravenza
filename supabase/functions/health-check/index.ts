import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "down";
  latency_ms: number | null;
  detail?: string;
}

async function checkService(
  name: string,
  fn: () => Promise<void>
): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    await fn();
    return { name, status: "operational", latency_ms: Date.now() - start };
  } catch (err: unknown) {
    const elapsed = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    // If it responded but with an error, consider degraded
    const status = elapsed < 5000 ? "degraded" : "down";
    return { name, status, latency_ms: elapsed, detail: msg };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const checks = await Promise.all([
    // 1. Supabase Database
    checkService("database", async () => {
      const sb = createClient(supabaseUrl, supabaseKey);
      const { error } = await sb.from("faqs").select("id").limit(1);
      if (error) throw new Error(error.message);
    }),

    // 2. Supabase Auth
    checkService("auth", async () => {
      const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: { apikey: supabaseKey },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }),

    // 3. Supabase Storage
    checkService("storage", async () => {
      const res = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }),

    // 4. MercadoPago
    checkService("mercadopago", async () => {
      const token = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
      if (!token) throw new Error("Token não configurado");
      const res = await fetch(
        "https://api.mercadopago.com/v1/payment_methods",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }),

    // 6. SuperFrete
    checkService("superfrete", async () => {
      const token = Deno.env.get("SUPERFRETE_TOKEN");
      if (!token) throw new Error("Token não configurado");
      const res = await fetch("https://api.superfrete.com/api/v0/calculator", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: { postal_code: "01001000" },
          to: { postal_code: "20040020" },
          package: { height: 10, width: 10, length: 10, weight: 0.5 },
        }),
      });
      // Even 4xx means API is reachable
      if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
    }),

    // 7. Twilio (WhatsApp)
    checkService("twilio", async () => {
      const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const token = Deno.env.get("TWILIO_AUTH_TOKEN");
      if (!sid || !token) throw new Error("Credenciais não configuradas");
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
        headers: { Authorization: "Basic " + btoa(`${sid}:${token}`) },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }),

    // 8. Resend (Email)
    checkService("resend", async () => {
      const key = Deno.env.get("RESEND_API_KEY");
      if (!key) throw new Error("Chave não configurada");
      const res = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }),
  ]);

  const overall = checks.every((c) => c.status === "operational")
    ? "operational"
    : checks.some((c) => c.status === "down")
    ? "down"
    : "degraded";

  return new Response(
    JSON.stringify({ overall, services: checks, checked_at: new Date().toISOString() }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
