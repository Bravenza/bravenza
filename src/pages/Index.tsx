import { Header } from "@/components/home/Header";
import { HeroSection } from "@/components/home/HeroSection";
import { BrandsCarousel } from "@/components/home/BrandsCarousel";
import FeaturedModelsSection from "@/components/home/FeaturedModelsSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { BenefitsSection } from "@/components/home/BenefitsSection";
import { ReferralSection } from "@/components/home/ReferralSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { FeaturedReviews } from "@/components/home/FeaturedReviews";
import { FAQSection } from "@/components/home/FAQSection";
import { CTASection } from "@/components/home/CTASection";
import { Footer } from "@/components/home/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";

const Index = () => {
  return (
    <div className="min-h-screen bg-background space-y-0">
      <Header />
      
      <main className="pt-16">
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
  );
};

export default Index;
