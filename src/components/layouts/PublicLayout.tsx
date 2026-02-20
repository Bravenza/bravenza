import { ReactNode, memo, lazy, Suspense } from "react";
import { Header } from "@/components/home/Header";

const Footer = lazy(() => import("@/components/home/Footer").then(m => ({ default: m.Footer })));
const FloatingWhatsApp = lazy(() => import("@/components/FloatingWhatsApp").then(m => ({ default: m.FloatingWhatsApp })));

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
      
      <main id="main-content" className={`flex-1 ${showHeader ? "pt-16" : ""} ${className}`}>
        {children}
      </main>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
      <Suspense fallback={null}>
        <FloatingWhatsApp />
      </Suspense>
    </div>
  );
};

export const PublicLayout = memo(PublicLayoutComponent);
export default PublicLayout;
