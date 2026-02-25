import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, TrendingDown, Sparkles } from "lucide-react";

export function BravenzaFullPricing() {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />

      <div className="container mx-auto px-4 sm:px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-primary text-sm font-semibold tracking-widest uppercase mb-3 block">Preço</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Transparente e <span className="text-gradient-gold">simples</span>
          </h2>
          <p className="text-foreground/60 max-w-md mx-auto text-lg">
            Você só paga quando seu sneaker é vendido. Sem surpresas.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-md mx-auto"
        >
          <div className="relative rounded-3xl border-2 border-primary/30 bg-card p-8 md:p-10 shadow-xl shadow-primary/5">
            {/* Top badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-lg">
                <Sparkles className="h-3.5 w-3.5" />
                Melhor custo do mercado
              </div>
            </div>

            <div className="text-center mb-6 pt-2">
              <p className="text-6xl md:text-7xl font-display font-bold text-primary mb-1">22%</p>
              <p className="text-foreground/60 text-lg">sobre o valor da venda</p>
            </div>

            {/* Competitive advantage */}
            <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 mb-8">
              <TrendingDown className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Até 7% mais barato que concorrentes
              </span>
            </div>

            <ul className="space-y-3.5 mb-8">
              {[
                "Sem taxas antecipadas ou mensalidades",
                "Inclui autenticação com laudo digital",
                "Fotografia profissional de catálogo",
                "Anúncio otimizado pela equipe",
                "Envio ao comprador incluso",
                "Pagamento liberado automaticamente",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>

            <Link to="/app/loja">
              <Button className="w-full btn-gold text-base" size="xl">
                Começar agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
