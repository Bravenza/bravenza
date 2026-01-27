import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASectionComponent = () => {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center card-premium-gold p-12 md:p-16 relative overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              O sneaker perfeito está{" "}
              <span className="text-gradient-gold">te esperando</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Chega de procurar e não encontrar. Chega de pagar caro e receber réplica. 
              Sua próxima aquisição começa aqui, com segurança, transparência e garantia de originalidade.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link to="/solicitar">
                <Button size="lg" className="btn-gold text-lg px-10 py-6 w-full sm:w-auto">
                  Solicitar orçamento grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
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
