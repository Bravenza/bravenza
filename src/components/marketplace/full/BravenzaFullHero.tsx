import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight } from "lucide-react";

export function BravenzaFullHero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="container mx-auto px-4 sm:px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Nível 3 de verificação</span>
          </div>

          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Envie seu sneaker.{" "}
            <span className="text-gradient-gold">Nós fazemos o resto.</span>
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            O Bravenza Full é o modelo de consignação onde cuidamos de tudo:
            autenticação, fotografia profissional, anúncio otimizado e envio ao comprador.
            Você só precisa enviar o sneaker.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/app/loja">
              <Button size="xl" className="btn-gold w-full sm:w-auto group">
                Solicitar agora
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          <p className="text-muted-foreground/60 text-sm mt-4">
            Comissão de apenas 22% sobre o valor da venda. Sem taxas antecipadas.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
