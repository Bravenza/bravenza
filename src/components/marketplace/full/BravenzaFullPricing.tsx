import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, TrendingDown } from "lucide-react";

export function BravenzaFullPricing() {
  return (
    <section className="py-16 md:py-24 bg-card/30">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-lg mx-auto text-center"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
            Transparente e <span className="text-gradient-gold">simples</span>
          </h2>

          <div className="rounded-2xl border border-primary/20 bg-card p-8 md:p-10">
            <p className="text-5xl md:text-6xl font-display font-bold text-primary mb-2">22%</p>
            <p className="text-muted-foreground mb-4">sobre o valor da venda</p>

            {/* Competitive advantage callout */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <TrendingDown className="h-4 w-4 text-accent-foreground" />
              <span className="text-xs font-medium text-accent-foreground">
                Até 7% mais barato que concorrentes
              </span>
            </div>

            <ul className="text-sm text-left space-y-3 mb-8">
              {[
                "Sem taxas antecipadas ou mensalidades",
                "Inclui autenticação, fotos e anúncio",
                "Inclui envio ao comprador",
                "Pagamento liberado automaticamente",
                "Você só paga quando vende",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link to="/app/loja">
              <Button className="w-full btn-gold" size="lg">
                Começar agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
