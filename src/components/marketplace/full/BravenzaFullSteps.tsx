import { motion } from "framer-motion";
import {
  Package, Truck, Shield, Camera, Tag, DollarSign,
} from "lucide-react";

const STEPS = [
  {
    icon: Package,
    title: "Solicite o serviço",
    description: "Informe os detalhes do sneaker, envie fotos e sugira um preço. Nossa equipe avalia e envia as instruções de envio.",
  },
  {
    icon: Truck,
    title: "Envie ao Hub Bravenza",
    description: "Embale com cuidado e envie o sneaker para nosso Hub. Você acompanha cada etapa em tempo real pelo app.",
  },
  {
    icon: Shield,
    title: "Inspeção e autenticação",
    description: "Nossa equipe realiza uma inspeção detalhada com checklist de 6 pontos e emite o laudo digital de autenticidade.",
  },
  {
    icon: Camera,
    title: "Fotografia profissional",
    description: "Fotografamos o sneaker com padrão profissional, destacando cada detalhe para maximizar o apelo visual no anúncio.",
  },
  {
    icon: Tag,
    title: "Precificação e anúncio",
    description: "Criamos o anúncio otimizado no marketplace com base no preço sugerido e análise de mercado. Você aprova antes de publicar.",
  },
  {
    icon: DollarSign,
    title: "Venda e pagamento",
    description: "Quando vendido, cuidamos do envio ao comprador. Seu pagamento é liberado automaticamente após o prazo de proteção.",
  },
];

export function BravenzaFullSteps() {
  return (
    <section className="py-16 md:py-24 bg-card/30">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            Como <span className="text-gradient-gold">funciona</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Um processo simples e transparente em 6 etapas
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto grid gap-6 md:gap-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-4 md:gap-6 items-start"
            >
              <div className="flex-shrink-0 relative">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <step.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <div className="pt-1">
                <h3 className="font-semibold text-base md:text-lg mb-1">{step.title}</h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
