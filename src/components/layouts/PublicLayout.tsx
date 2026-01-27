import { ReactNode, memo } from "react";
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";

interface PublicLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  className?: string;
}

const PublicLayoutComponent = ({ 
  children, 
  showHeader = true,
  className = "" 
}: PublicLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showHeader && <Header />}
      
      <main className={`flex-1 ${showHeader ? "pt-16" : ""} ${className}`}>
        {children}
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
};

export const PublicLayout = memo(PublicLayoutComponent);
export default PublicLayout;
