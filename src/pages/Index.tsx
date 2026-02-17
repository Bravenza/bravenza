import { Header } from "@/components/home/Header";
import { HeroSection } from "@/components/home/HeroSection";
import { BrandsCarousel } from "@/components/home/BrandsCarousel";
import { Footer } from "@/components/home/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { LocalBusinessSchema, ServiceSchema } from "@/components/seo/StructuredData";
import { Helmet } from "react-helmet-async";
import { LazySection } from "@/components/home/LazySection";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/** Lightweight skeleton shown while a lazy section's JS chunk loads */
function SectionSkeleton({ height = "400px" }: { height?: string }) {
  return (
    <div className="w-full px-4 py-12" style={{ minHeight: height }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-72 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// Lazy-load below-fold sections — they won't be in the initial bundle
const SocialProofBar = lazy(() => import("@/components/home/SocialProofBar").then(m => ({ default: m.SocialProofBar })));
const FeaturedModelsSection = lazy(() => import("@/components/home/FeaturedModelsSection"));
const HowItWorksSection = lazy(() => import("@/components/home/HowItWorksSection").then(m => ({ default: m.HowItWorksSection })));
const BenefitsSection = lazy(() => import("@/components/home/BenefitsSection").then(m => ({ default: m.BenefitsSection })));
const MarketplaceSection = lazy(() => import("@/components/home/MarketplaceSection").then(m => ({ default: m.MarketplaceSection })));
const VaultClubSection = lazy(() => import("@/components/home/VaultClubSection").then(m => ({ default: m.VaultClubSection })));
const ReferralSection = lazy(() => import("@/components/home/ReferralSection").then(m => ({ default: m.ReferralSection })));
const FeaturedReviews = lazy(() => import("@/components/home/FeaturedReviews").then(m => ({ default: m.FeaturedReviews })));
const TestimonialsSection = lazy(() => import("@/components/home/TestimonialsSection").then(m => ({ default: m.TestimonialsSection })));
const FAQSection = lazy(() => import("@/components/home/FAQSection").then(m => ({ default: m.FAQSection })));
const CTASection = lazy(() => import("@/components/home/CTASection").then(m => ({ default: m.CTASection })));

const Index = () => {
  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>BRAVENZA | Curadoria e Autenticação Premium de Sneakers</title>
        <meta name="description" content="Plataforma premium de curadoria sob demanda e autenticação de sneakers. Encontramos, verificamos e garantimos a autenticidade do sneaker que você procura." />
        <link rel="canonical" href="https://bravenza.com.br/" />
      </Helmet>
      
      {/* Structured Data */}
      <LocalBusinessSchema />
      <ServiceSchema 
        name="Curadoria e Autenticação de Sneakers"
        description="Plataforma premium de curadoria sob demanda e verificação de autenticidade de sneakers, conectando clientes a vendedores com segurança."
      />

      <div className="min-h-screen bg-background space-y-0">
        <Header />
        
        <main id="main-content" className="pt-16">
          {/* Above-the-fold — eagerly loaded */}
          <HeroSection />
          <BrandsCarousel />
          
          {/* Social Proof Bar */}
          <LazySection minHeight="150px">
            <Suspense fallback={<SectionSkeleton height="150px" />}>
              <SocialProofBar />
            </Suspense>
          </LazySection>
          
          {/* Featured Models */}
          <LazySection minHeight="400px">
            <Suspense fallback={<SectionSkeleton height="400px" />}>
              <FeaturedModelsSection />
            </Suspense>
          </LazySection>
          
          {/* How It Works */}
          <LazySection minHeight="500px">
            <Suspense fallback={<SectionSkeleton height="500px" />}>
              <div id="como-funciona">
                <HowItWorksSection />
              </div>
            </Suspense>
          </LazySection>
          
          {/* Benefits */}
          <LazySection minHeight="400px">
            <Suspense fallback={<SectionSkeleton height="400px" />}>
              <BenefitsSection />
            </Suspense>
          </LazySection>

          {/* Marketplace */}
          <LazySection minHeight="500px">
            <Suspense fallback={<SectionSkeleton height="500px" />}>
              <div id="marketplace">
                <MarketplaceSection />
              </div>
            </Suspense>
          </LazySection>

          {/* Vault Club */}
          <LazySection minHeight="500px">
            <Suspense fallback={<SectionSkeleton height="500px" />}>
              <div id="vault-club">
                <VaultClubSection />
              </div>
            </Suspense>
          </LazySection>
          
          {/* Referral */}
          <LazySection minHeight="400px">
            <Suspense fallback={<SectionSkeleton height="400px" />}>
              <div id="indicacao">
                <ReferralSection />
              </div>
            </Suspense>
          </LazySection>
          
          {/* Reviews */}
          <LazySection minHeight="300px">
            <Suspense fallback={<SectionSkeleton height="300px" />}>
              <FeaturedReviews />
            </Suspense>
          </LazySection>
          
          {/* Testimonials */}
          <LazySection minHeight="300px">
            <Suspense fallback={<SectionSkeleton height="300px" />}>
              <TestimonialsSection />
            </Suspense>
          </LazySection>
          
          {/* FAQ */}
          <LazySection minHeight="400px">
            <Suspense fallback={<SectionSkeleton height="400px" />}>
              <FAQSection />
            </Suspense>
          </LazySection>
          
          {/* Final CTA */}
          <LazySection minHeight="300px">
            <Suspense fallback={<SectionSkeleton height="300px" />}>
              <CTASection />
            </Suspense>
          </LazySection>
        </main>

        <Footer />
        <FloatingWhatsApp />
      </div>
    </>
  );
};

export default Index;
