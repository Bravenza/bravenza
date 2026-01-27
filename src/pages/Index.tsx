import { Header } from "@/components/home/Header";
import { HeroSection } from "@/components/home/HeroSection";
import { BrandsCarousel } from "@/components/home/BrandsCarousel";
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
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        <HeroSection />
        <BrandsCarousel />
        <div id="como-funciona">
          <HowItWorksSection />
        </div>
        <BenefitsSection />
        <div id="indicacao">
          <ReferralSection />
        </div>
        <FeaturedReviews />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
};

export default Index;
