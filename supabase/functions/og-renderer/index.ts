import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CRAWLER_UA =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|Slackbot|TelegramBot|Discordbot|Googlebot|bingbot|Applebot|Pinterest|Embedly|quora link preview|Iframely/i;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE = "https://bravenza.com.br";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");
    const path = url.searchParams.get("path") || "/";
    const ua = req.headers.get("user-agent") || "";

    // If not a crawler, redirect to the SPA
    if (!CRAWLER_UA.test(ua)) {
      const dest = slug ? `${SITE}/marketplace/${slug}` : `${SITE}${path}`;
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: dest },
      });
    }

    // For product pages with slug, fetch product data
    if (slug) {
      const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const { data: product } = await sb
        .from("marketplace_products")
        .select("brand, model, colorway, images, lowest_price, sku, description, slug, total_offers")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (!product) {
        return new Response(buildHTML({
          title: "Produto não encontrado | BRAVENZA",
          description: "O produto que você procura não está disponível.",
          url: `${SITE}/marketplace`,
          image: `${SITE}/og-image.png`,
        }), { headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } });
      }

      const name = `${product.brand} ${product.model}`;
      const image = product.images?.[0] || `${SITE}/og-image.png`;
      const priceText = product.lowest_price
        ? ` A partir de R$ ${product.lowest_price.toLocaleString("pt-BR")}.`
        : "";
      const canonical = `${SITE}/marketplace/${product.slug}`;

      return new Response(buildHTML({
        title: `${name} | BRAVENZA Marketplace`,
        description: `Compre ${name}${product.colorway ? ` (${product.colorway})` : ""} autenticado.${priceText} Inspeção e certificado inclusos.`,
        url: canonical,
        image,
        type: "product",
        extra: product.lowest_price
          ? `<meta property="product:price:amount" content="${product.lowest_price}" />\n    <meta property="product:price:currency" content="BRL" />`
          : "",
        jsonLd: buildProductJsonLd(product, canonical, image),
      }), { headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } });
    }

    // Generic pages (home, marketplace, etc.)
    const pageMeta = getPageMeta(path);
    return new Response(buildHTML(pageMeta), {
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    console.error("og-renderer error:", e);
    return new Response(buildHTML({
      title: "BRAVENZA — Sneakers Autenticados",
      description: "Marketplace premium de sneakers autenticados.",
      url: SITE,
      image: `${SITE}/og-image.png`,
    }), { headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } });
  }
});

/* ── helpers ── */

interface PageMeta {
  title: string;
  description: string;
  url: string;
  image: string;
  type?: string;
  extra?: string;
  jsonLd?: string;
}

function buildHTML(m: PageMeta): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8" />
    <title>${esc(m.title)}</title>
    <meta name="description" content="${esc(m.description)}" />
    <link rel="canonical" href="${esc(m.url)}" />
    <meta property="og:title" content="${esc(m.title)}" />
    <meta property="og:description" content="${esc(m.description)}" />
    <meta property="og:url" content="${esc(m.url)}" />
    <meta property="og:image" content="${esc(m.image)}" />
    <meta property="og:type" content="${m.type || "website"}" />
    <meta property="og:site_name" content="BRAVENZA" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(m.title)}" />
    <meta name="twitter:description" content="${esc(m.description)}" />
    <meta name="twitter:image" content="${esc(m.image)}" />
    ${m.extra || ""}
    ${m.jsonLd ? `<script type="application/ld+json">${m.jsonLd}</script>` : ""}
    <meta http-equiv="refresh" content="0;url=${esc(m.url)}" />
</head>
<body>
    <p>Redirecionando para <a href="${esc(m.url)}">${esc(m.title)}</a>...</p>
</body>
</html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildProductJsonLd(p: any, url: string, image: string): string {
  const ld: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${p.brand} ${p.model}`,
    brand: { "@type": "Brand", name: p.brand },
    url,
    image,
  };
  if (p.description) ld.description = p.description;
  if (p.sku) ld.sku = p.sku;
  if (p.lowest_price) {
    ld.offers = {
      "@type": p.total_offers > 1 ? "AggregateOffer" : "Offer",
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "BRAVENZA" },
      ...(p.total_offers > 1
        ? { lowPrice: p.lowest_price, offerCount: p.total_offers }
        : { price: p.lowest_price }),
    };
  }
  return JSON.stringify(ld);
}

function getPageMeta(path: string): PageMeta {
  const pages: Record<string, Omit<PageMeta, "image">> = {
    "/": {
      title: "BRAVENZA — Curadoria & Marketplace Premium de Sneakers",
      description: "Plataforma premium de curadoria sob demanda e marketplace de sneakers autenticados.",
      url: SITE,
    },
    "/marketplace": {
      title: "Marketplace | BRAVENZA — Sneakers Autenticados",
      description: "Compre e venda sneakers autenticados. Cada par é inspecionado e certificado.",
      url: `${SITE}/marketplace`,
    },
    "/vender": {
      title: "Quero Vender | BRAVENZA",
      description: "Venda seus sneakers na Bravenza: anuncie no Marketplace ou use o Bravenza Full.",
      url: `${SITE}/vender`,
    },
    "/faq": {
      title: "Perguntas Frequentes | BRAVENZA",
      description: "Tire suas dúvidas sobre compra, venda, autenticação e envio de sneakers.",
      url: `${SITE}/faq`,
    },
  };

  const meta = pages[path] || pages["/"]!;
  return { ...meta, image: `${SITE}/og-image.png` };
}
