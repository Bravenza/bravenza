import { Helmet } from "react-helmet-async";
import { ProductSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import type { ProductOffer } from "@/hooks/useMarketplaceCatalog";

interface ProductSEOProps {
  product: {
    brand: string;
    model: string;
    colorway: string | null;
    lowest_price: number | null;
    sku: string | null;
    description: string | null;
    slug: string | null;
    total_offers: number;
  };
  formattedName: string;
  images: string[];
  allOffers: ProductOffer[];
  reviewsAverage: number | null;
  reviewsTotal: number;
}

export function ProductSEO({ product, formattedName, images, allOffers, reviewsAverage, reviewsTotal }: ProductSEOProps) {
  const canonicalUrl = `https://bravenza.com.br/marketplace/${product.slug}`;

  return (
    <>
      <Helmet>
        <title>{`${formattedName} | BRAVENZA Marketplace`}</title>
        <meta name="description" content={`Compre ${formattedName}${product.colorway ? ` (${product.colorway})` : ""} autenticado no Marketplace BRAVENZA. ${product.lowest_price ? `A partir de R$ ${product.lowest_price.toLocaleString("pt-BR")}.` : ""} Inspeção e certificado inclusos.`} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={`${formattedName} — BRAVENZA`} />
        <meta property="og:description" content={`Sneaker autenticado no marketplace BRAVENZA.${product.lowest_price ? ` A partir de R$ ${product.lowest_price.toLocaleString("pt-BR")}.` : ""}`} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={canonicalUrl} />
        {images[0] && images[0] !== "/placeholder.svg" && <meta property="og:image" content={images[0]} />}
        <meta property="product:price:amount" content={String(product.lowest_price || "")} />
        <meta property="product:price:currency" content="BRL" />
      </Helmet>

      <ProductSchema
        name={formattedName}
        brand={product.brand}
        description={product.description || `${formattedName} — sneaker autenticado no marketplace BRAVENZA.`}
        image={images[0] !== "/placeholder.svg" ? images[0] : undefined}
        sku={product.sku || undefined}
        price={product.lowest_price || undefined}
        condition={allOffers.length > 0 ? allOffers[0].condition : undefined}
        url={canonicalUrl}
        ratingValue={reviewsAverage || undefined}
        reviewCount={reviewsTotal || undefined}
        offersCount={product.total_offers || undefined}
      />

      <BreadcrumbSchema items={[
        { name: "Marketplace", url: "https://bravenza.com.br/marketplace" },
        { name: product.brand, url: `https://bravenza.com.br/app?q=${encodeURIComponent(product.brand)}` },
        { name: product.model, url: canonicalUrl },
      ]} />
    </>
  );
}
