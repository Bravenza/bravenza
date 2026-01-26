import { Link } from "react-router-dom";
import { Package, Shield, Clock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { TrackingForm } from "@/components/tracking/TrackingForm";
import { Button } from "@/components/ui/button";

const Index = () => {
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
          <Logo size="md" />
          <Link to="/admin/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Área Administrativa
            </Button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left side - Hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Rastreamento Premium
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Acompanhe seu{" "}
                <span className="text-gradient-gold">pedido</span> em tempo real
              </h1>

              <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0">
                Insira o código do seu pedido e CPF para acessar informações
                detalhadas sobre o status da sua encomenda.
              </p>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center p-3">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Seguro</span>
                </div>
                <div className="text-center p-3">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Tempo Real
                  </span>
                </div>
                <div className="text-center p-3">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Detalhado
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Right side - Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="card-premium-gold p-8 md:p-10">
                <h2 className="text-2xl font-bold mb-2 text-center">
                  Rastrear Pedido
                </h2>
                <p className="text-muted-foreground text-center mb-8">
                  Insira suas informações abaixo
                </p>
                <TrackingForm />
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center">
          <Logo size="sm" />
          <p className="text-sm text-muted-foreground mt-4">
            © {new Date().getFullYear()} BRAVENZA. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
