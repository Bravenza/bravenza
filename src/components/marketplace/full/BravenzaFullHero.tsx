import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, Star } from "lucide-react";
import heroImage from "@/assets/full-hero.jpg";

export function BravenzaFullHero() {
  return (
    <section className="relative overflow-hidden">
      {/* Full-bleed hero image with overlay */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Sneaker premium em pedestal de autenticação"
          className="w-full h-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-background/40" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative py-24 md:py-36 lg:py-44">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 backdrop-blur-sm"
          >
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Menos trabalho. Mais vendas.</span>
          </motion.div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Envie seu sneaker.
            <br />
            <span className="text-gradient-gold">Nós fazemos o resto.</span>
          </h1>

          <p className="text-foreground/70 text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
            Consignação premium com autenticação, fotografia profissional, anúncio otimizado e envio ao comprador. Você só envia o sneaker.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Link to="/app/loja">
              <Button size="xl" className="btn-gold group text-base">
                Solicitar agora
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-sm text-foreground/70">
              <div className="flex -space-x-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <span>Apenas 22% de comissão</span>
            </div>
          </div>

          {/* Trust metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-6 mt-12 pt-8 border-t border-border/30"
          >
            {[
              { value: "6 etapas", label: "simples" },
              { value: "22%", label: "comissão fixa" },
              { value: "Zero", label: "taxas antecipadas" },
            ].map((stat, i) => (
              <div key={i} className="text-left">
                <p className="text-xl md:text-2xl font-display font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-foreground/60">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
