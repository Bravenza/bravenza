import { Header } from "@/components/home/Header";
import { HeroSection } from "@/components/home/HeroSection";
import { BrandsCarousel } from "@/components/home/BrandsCarousel";
import FeaturedModelsSection from "@/components/home/FeaturedModelsSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { BenefitsSection } from "@/components/home/BenefitsSection";
import { VaultClubSection } from "@/components/home/VaultClubSection";
import { ReferralSection } from "@/components/home/ReferralSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { FeaturedReviews } from "@/components/home/FeaturedReviews";
import { FAQSection } from "@/components/home/FAQSection";
import { CTASection } from "@/components/home/CTASection";
import { Footer } from "@/components/home/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { LocalBusinessSchema, ServiceSchema } from "@/components/seo/StructuredData";
import { Helmet } from "react-helmet-async";

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
          {/* Hero Section - Full viewport height */}
          <HeroSection />
          
          {/* Brands Carousel */}
          <BrandsCarousel />
          
          {/* Featured Models */}
          <FeaturedModelsSection />
          
          {/* How It Works */}
          <div id="como-funciona">
            <HowItWorksSection />
          </div>
          
          {/* Benefits Section */}
          <BenefitsSection />

          {/* Vault Club Section */}
          <div id="vault-club">
            <VaultClubSection />
          </div>
          
          {/* Referral Section */}
          <div id="indicacao">
            <ReferralSection />
          </div>
          
          {/* Featured Reviews */}
          <FeaturedReviews />
          
          {/* Testimonials */}
          <TestimonialsSection />
          
          {/* FAQ Section */}
          <FAQSection />
          
          {/* Final CTA */}
          <CTASection />
        </main>

        <Footer />
        <FloatingWhatsApp />
      </div>
    </>
  );
};

export default Index;
