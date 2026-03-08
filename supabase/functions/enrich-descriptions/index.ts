import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, authErrorResponse } from "../_shared/auth-guard.ts";

// ─── Configurações ─────────────────────────────────────────────────────────────
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const AI_MODEL = "google/gemini-2.5-flash";
const BATCH_SIZE = 10;
const CONCURRENCY = 3;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Tipos ─────────────────────────────────────────────────────────────────────
interface SneakerModel {
  id: string;
  sku: string;
  model_name_pt: string;
  model_name_en: string | null;
  description_pt: string;
  description_en: string | null;
  colorway: string | null;
  brand_id: string;
  brands: { name: string } | null;
  silhouettes: { name: string } | null;
  msrp: number | null;
  release_date: string | null;
}

interface EnrichResult {
  success: number;
  failed: number;
  errors: string[];
  processed: { sku: string; preview: string }[];
}

// ─── Prompt editorial/lifestyle para reescrita ────────────────────────────────
function buildPrompt(product: SneakerModel): string {
  const hasOriginal = product.description_pt && product.description_pt.trim().length >= 20;
  const brand = product.brands?.name || "Desconhecida";
  const silhouette = product.silhouettes?.name || "";
  const name = product.model_name_pt || product.model_name_en || product.sku;
  const colorway = product.colorway || "—";
  const msrp = product.msrp ? `R$${product.msrp}` : "";
  const release = product.release_date || "";
  const enDesc = product.description_en || "";

  if (hasOriginal) {
    return `Você é redator editorial de uma plataforma premium de sneakers chamada Bravenza.

Reescreva a descrição abaixo com tom editorial e lifestyle — evocativo mas muito conciso.
Máximo 2 parágrafos curtos (3-4 frases no total). Preserve fatos técnicos essenciais (materiais, tecnologias, colaborações).
Escreva em português brasileiro. NÃO adicione emojis. NÃO use bullet points. Seja direto e breve.
Retorne APENAS a descrição reescrita, sem prefácio ou explicação.

Produto: ${name}
Marca: ${brand}
Silhueta: ${silhouette}
Colorway: ${colorway}
MSRP: ${msrp}
Lançamento: ${release}
Descrição original:
${product.description_pt}`;
  }

  // Sem descrição original → criar do zero
  return `Você é redator editorial de uma plataforma premium de sneakers chamada Bravenza.

Crie uma descrição editorial e lifestyle em português brasileiro para o sneaker abaixo.
Use seu conhecimento sobre o modelo, marca e silhueta para escrever algo envolvente e informativo.
Mencione materiais, tecnologias de amortecimento, história/contexto cultural e detalhes de design quando relevante.
Tom editorial, apaixonado, mas muito conciso. Máximo 2 parágrafos curtos (3-4 frases no total). Seja direto e breve.
NÃO adicione emojis. NÃO use bullet points.
Retorne APENAS a descrição, sem prefácio ou explicação.

Produto: ${name}
Marca: ${brand}
Silhueta: ${silhouette}
Colorway: ${colorway}
SKU: ${product.sku}
MSRP: ${msrp}
Lançamento: ${release}
${enDesc ? `Descrição EN (referência): ${enDesc}` : ""}`;
}

// ─── Chama a IA via Lovable Gateway ───────────────────────────────────────────
async function rewriteDescription(
  product: SneakerModel,
  apiKey: string
): Promise<string | null> {
  try {
    const res = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0.7,
        max_tokens: 300,
        messages: [{ role: "user", content: buildPrompt(product) }],
      }),
    });

    if (res.status === 429) {
      console.warn("Rate limited — aguardando…");
      return null;
    }
    if (res.status === 402) {
      console.error("Créditos esgotados");
      return null;
    }
    if (!res.ok) {
      const t = await res.text();
      console.error(`AI error ${res.status}: ${t}`);
      return null;
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (e: any) {
    console.error(`rewriteDescription error for ${product.sku}:`, e.message);
    return null;
  }
}

// ─── Processa um batch com concorrência controlada ───────────────────────────
async function processBatch(
  products: SneakerModel[],
  apiKey: string,
  sb: any
): Promise<EnrichResult> {
  const result: EnrichResult = { success: 0, failed: 0, errors: [], processed: [] };

  // Semáforo simples
  let running = 0;
  const queue = [...products];
  const promises: Promise<void>[] = [];

  const processOne = async (product: SneakerModel) => {
    // Chama a IA — tanto para reescrita quanto para criação do zero
    const newDesc = await rewriteDescription(product, apiKey);
    if (newDesc) {
      const { error } = await sb
        .from("sneaker_models")
        .update({
          description_pt: newDesc,
          translation_status: "review",
          translation_error: null,
        })
        .eq("id", product.id);
      if (error) {
        result.failed++;
        result.errors.push(`${product.sku}: update error — ${error.message}`);
      } else {
        result.success++;
        result.processed.push({ sku: product.sku, preview: newDesc.slice(0, 120) });
      }
    } else {
      const { error } = await sb
        .from("sneaker_models")
        .update({
          translation_status: "error",
          translation_error: "AI não retornou descrição",
        })
        .eq("id", product.id);
      result.failed++;
      result.errors.push(`${product.sku}: AI retornou vazio`);
    }
  };

  // Executa com concorrência limitada
  const runNext = async (): Promise<void> => {
    while (queue.length > 0) {
      const item = queue.shift()!;
      await processOne(item);
    }
  };

  const workers = Array.from({ length: Math.min(CONCURRENCY, products.length) }, () =>
    runNext()
  );
  await Promise.all(workers);

  return result;
}

// ─── Handler principal ───────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer "))
      return new Response(
        JSON.stringify({ error: "Auth required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    const anonSb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const {
      data: { user },
      error: userErr,
    } = await anonSb.auth.getUser();
    if (userErr || !user)
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    const { data: adm } = await sb
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!adm)
      return new Response(
        JSON.stringify({ error: "Admin only" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey)
      return new Response(
        JSON.stringify({ ok: false, error: "LOVABLE_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    // Busca produtos pendentes
    const { data: candidates, error: fetchErr } = await sb
      .from("sneaker_models")
      .select("id, sku, model_name_pt, model_name_en, description_pt, description_en, colorway, brand_id, msrp, release_date, brands:brand_id(name), silhouettes:silhouette_id(name)")
      .in("translation_status", ["pending", "skipped", "translated"])
      .order("created_at", { ascending: false })
      .limit(BATCH_SIZE);

    if (fetchErr)
      return new Response(
        JSON.stringify({ ok: false, error: fetchErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    if (!candidates || candidates.length === 0) {
      return new Response(
        JSON.stringify({
          ok: true,
          success: 0,
          failed: 0,
          errors: [],
          processed: [],
          remaining: 0,
          message: "Nenhum produto pendente encontrado.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Processa batch
    const result = await processBatch(candidates as SneakerModel[], lovableKey, sb);

    // Conta restantes
    const { count: remaining } = await sb
      .from("sneaker_models")
      .select("id", { count: "exact", head: true })
      .in("translation_status", ["pending", "skipped", "translated"]);

    return new Response(
      JSON.stringify({
        ok: true,
        ...result,
        remaining: remaining || 0,
        has_more: (remaining || 0) > 0 && result.success > 0,
        message: `${result.success} descrições reescritas, ${result.failed} falhas.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("enrich-descriptions error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
