import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASectionComponent = () => {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center card-glow p-10 md:p-14 relative overflow-hidden"
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          {/* Background glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold mb-5 tracking-tight">
              O tênis perfeito está{" "}
              <span className="text-gradient-gold">te esperando</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto text-sm md:text-base">
              Chega de procurar e não encontrar. Sua próxima aquisição começa aqui, 
              com segurança, transparência e garantia de originalidade.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link to="/solicitar">
                <Button size="lg" className="btn-gold w-full sm:w-auto group">
                  Solicitar orçamento grátis
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-xs md:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Resposta em até 24h</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Sem compromisso</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export const CTASection = memo(CTASectionComponent);
