import { memo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, DollarSign, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const benefits = [
  { icon: ShieldCheck, text: "Autenticação inclusa" },
  { icon: DollarSign, text: "Receba em até 3 dias" },
  { icon: Zap, text: "Anuncie em minutos" },
];

export const SellCTASection = memo(function SellCTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-card to-primary/4" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl bg-card/90 backdrop-blur-sm border border-primary/15 p-8 md:p-12 lg:p-16 overflow-hidden shadow-2xl shadow-primary/5"
          >
            {/* Decorative ring */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full border border-primary/10 opacity-50" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full border border-primary/8 opacity-30" />

            <div className="relative z-10 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
              >
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Para vendedores</span>
              </motion.div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight mb-4 font-display">
                Transforme seu acervo em{" "}
                <span className="text-gradient-gold">oportunidade</span>
              </h2>

              <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
                Venda seus sneakers para uma comunidade que valoriza autenticidade.
                Cada peça passa pela nossa curadoria profissional.
              </p>

              {/* Benefits */}
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-10">
                {benefits.map((b, i) => (
                  <motion.div
                    key={b.text}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <b.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{b.text}</span>
                  </motion.div>
                ))}
              </div>

              <Button
                size="lg"
                className="btn-gold rounded-full h-14 px-10 text-base font-bold gap-2 shadow-lg shadow-primary/20"
                onClick={() => navigate("/marketplace/minha-loja")}
              >
                Começar a vender
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
});
