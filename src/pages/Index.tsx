import { Header } from "@/components/home/Header";
import { HeroSection } from "@/components/home/HeroSection";
import { BrandsCarousel } from "@/components/home/BrandsCarousel";
import { Footer } from "@/components/home/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { LocalBusinessSchema, ServiceSchema } from "@/components/seo/StructuredData";
import { Helmet } from "react-helmet-async";
import { LazySection } from "@/components/home/LazySection";
import { lazy, Suspense } from "react";

// Lazy-load below-fold sections — they won't be in the initial bundle
const FeaturedModelsSection = lazy(() => import("@/components/home/FeaturedModelsSection"));
const HowItWorksSection = lazy(() => import("@/components/home/HowItWorksSection").then(m => ({ default: m.HowItWorksSection })));
const BenefitsSection = lazy(() => import("@/components/home/BenefitsSection").then(m => ({ default: m.BenefitsSection })));
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
        <meta name="description" content="Plataforma premium de curadoria sob demanda e autenticação de sneakers. Encontramos, verificamos e garantimos a autenticidade do tênis que você procura." />
        <link rel="canonical" href="https://bravenza.lovable.app/" />
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
          
          {/* Below-the-fold — lazy rendered + lazy imported */}
          <Suspense fallback={null}>
            <LazySection minHeight="400px">
              <FeaturedModelsSection />
            </LazySection>
            
            <LazySection minHeight="500px">
              <div id="como-funciona">
                <HowItWorksSection />
              </div>
            </LazySection>
            
            <LazySection minHeight="400px">
              <BenefitsSection />
            </LazySection>

            <LazySection minHeight="500px">
              <div id="vault-club">
                <VaultClubSection />
              </div>
            </LazySection>
            
            <LazySection minHeight="400px">
              <div id="indicacao">
                <ReferralSection />
              </div>
            </LazySection>
            
            <LazySection minHeight="300px">
              <FeaturedReviews />
            </LazySection>
            
            <LazySection minHeight="300px">
              <TestimonialsSection />
            </LazySection>
            
            <LazySection minHeight="400px">
              <FAQSection />
            </LazySection>
            
            <LazySection minHeight="300px">
              <CTASection />
            </LazySection>
          </Suspense>
        </main>

        <Footer />
        <FloatingWhatsApp />
      </div>
    </>
  );
};

export default Index;
