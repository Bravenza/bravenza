import { motion } from "framer-motion";
import {
  Clock, Camera, Shield, Star, Truck, CheckCircle2, Home,
} from "lucide-react";

const BENEFITS = [
  { icon: Clock, text: "Sem esforço: nós cuidamos de tudo" },
  { icon: Camera, text: "Fotos profissionais que vendem mais" },
  { icon: Shield, text: "Selo Verified de autenticidade" },
  { icon: Star, text: "Anúncio otimizado pela equipe Bravenza" },
  { icon: Truck, text: "Logística completa do vendedor ao comprador" },
  { icon: CheckCircle2, text: "Acompanhamento em tempo real de cada etapa" },
  { icon: Home, text: "Mais espaço em casa: transforme peças paradas em dinheiro" },
];

export function BravenzaFullBenefits() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            Por que escolher o <span className="text-gradient-gold">Full?</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Envie seus sneakers para o Hub Bravenza, libere espaço em casa e deixe a venda com a gente.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card/50"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <b.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm md:text-base font-medium">{b.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
