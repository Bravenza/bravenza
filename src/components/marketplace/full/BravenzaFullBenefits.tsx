import { motion } from "framer-motion";
import {
  Clock, Camera, Shield, Star, Truck, CheckCircle2, Home, Zap,
} from "lucide-react";

const BENEFITS = [
  { icon: Clock, title: "Sem esforço", description: "Nós cuidamos de absolutamente tudo para você" },
  { icon: Camera, title: "Fotos profissionais", description: "Imagens de catálogo que vendem mais rápido" },
  { icon: Shield, title: "Selo Verified", description: "Autenticidade garantida com laudo digital" },
  { icon: Star, title: "Anúncio otimizado", description: "Criado pela equipe Bravenza para máxima conversão" },
  { icon: Truck, title: "Logística completa", description: "Do vendedor ao comprador, sem preocupação" },
  { icon: CheckCircle2, title: "Rastreamento total", description: "10 etapas visíveis em tempo real no app" },
  { icon: Home, title: "Mais espaço em casa", description: "Transforme sneakers parados em dinheiro" },
  { icon: Zap, title: "Venda mais rápido", description: "Selo Full ganha prioridade nas buscas" },
];

export function BravenzaFullBenefits() {
  return (
    <section className="py-20 md:py-32 bg-card/30 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />

      <div className="container mx-auto px-4 sm:px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold tracking-widest uppercase mb-3 block">Vantagens</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Por que escolher o <span className="text-gradient-gold">Full?</span>
          </h2>
          <p className="text-foreground/60 max-w-xl mx-auto text-lg">
            Envie seus sneakers para o Hub Bravenza, libere espaço em casa e deixe a venda com a gente.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group relative p-5 rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <b.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{b.title}</h3>
              <p className="text-xs text-foreground/60 leading-relaxed">{b.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
