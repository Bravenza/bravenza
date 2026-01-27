import { Header } from "@/components/home/Header";
import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { BenefitsSection } from "@/components/home/BenefitsSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { CTASection } from "@/components/home/CTASection";
import { Footer } from "@/components/home/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        <HeroSection />
        <div id="como-funciona">
          <HowItWorksSection />
        </div>
        <BenefitsSection />
        <TestimonialsSection />
        <CTASection />
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
};

export default Index;
