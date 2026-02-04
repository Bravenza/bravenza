import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Crown, Shield, Truck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSectionComponent = () => {
  return (
    <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden">
      {/* Tech grid background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40" />
      
      {/* Radial glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Main center glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-radial-glow" />
        
        {/* Accent glows */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute top-20 right-[20%] w-2 h-2 rounded-full bg-primary shadow-[0_0_40px_15px_hsl(45,100%,50%,0.2)]"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 2, delay: 0.8 }}
          className="absolute bottom-40 left-[15%] w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_30px_10px_hsl(45,100%,50%,0.15)]"
        />
        
        {/* Geometric lines */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="absolute top-[25%] left-0 w-32 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent origin-left"
        />
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="absolute bottom-[30%] right-0 w-40 h-px bg-gradient-to-l from-transparent via-primary/20 to-transparent origin-right"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 backdrop-blur-sm mb-8">
              <Crown className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary tracking-wide">
                A elite da importação de tênis
              </span>
            </div>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 tracking-tighter leading-[1.05]"
          >
            O tênis que você deseja
            <br />
            <span className="text-gradient-gold">existe.</span>
            <span className="text-muted-foreground font-normal"> E nós trazemos.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Acesso exclusivo aos tênis mais raros do mundo. Localizamos, 
            inspecionamos e entregamos em suas mãos com{" "}
            <span className="text-foreground font-medium">garantia de autenticidade</span> e 
            rastreamento completo.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link to="/solicitar">
              <Button size="xl" className="btn-gold w-full sm:w-auto group">
                Quero meu orçamento grátis
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/rastreio">
              <Button 
                variant="outline" 
                size="xl" 
                className="w-full sm:w-auto border-primary/20 hover:bg-primary/5 hover:border-primary/40"
              >
                Rastrear meu pedido
              </Button>
            </Link>
          </motion.div>

          {/* Trust indicators - Tech style cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-3 gap-3 md:gap-6 max-w-xl mx-auto"
          >
            {[
              { icon: Shield, label: "100% Autêntico" },
              { icon: Truck, label: "Rastreio total" },
              { icon: CreditCard, label: "Até 12x" },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                className="flex flex-col items-center gap-2 p-3 md:p-4 rounded-md bg-card/50 border border-border/50 backdrop-blur-sm"
              >
                <item.icon className="h-5 w-5 text-primary" />
                <span className="text-xs md:text-sm font-medium text-muted-foreground">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
};

export const HeroSection = memo(HeroSectionComponent);
