import { Link } from "react-router-dom";
import { Package, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { TrackingForm } from "@/components/tracking/TrackingForm";
import { Button } from "@/components/ui/button";

const TrackingPortalPage = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Rastreamento Premium
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Rastrear <span className="text-gradient-gold">Pedido</span>
            </h1>

            <p className="text-muted-foreground max-w-md mx-auto">
              Insira o código do seu pedido e CPF para acompanhar o status da sua encomenda em tempo real.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="card-premium-gold p-8">
              <TrackingForm />
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center">
          <Logo size="sm" />
          <p className="text-sm text-muted-foreground mt-4">
            © 2022-{new Date().getFullYear()} BRAVENZA. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TrackingPortalPage;
