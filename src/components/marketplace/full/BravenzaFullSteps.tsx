import { motion } from "framer-motion";
import {
  Package, Truck, Shield, Camera, Tag, DollarSign,
} from "lucide-react";
import inspectionImage from "@/assets/full-inspection.jpg";
import processImage from "@/assets/full-process.jpg";

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
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 md:mb-20"
        >
          <span className="text-primary text-sm font-semibold tracking-widest uppercase mb-3 block">Processo</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Como <span className="text-gradient-gold">funciona</span>
          </h2>
          <p className="text-foreground/60 max-w-xl mx-auto text-lg">
            Um processo simples e transparente em 6 etapas
          </p>
        </motion.div>

        {/* Split layout: steps + images */}
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Steps column */}
          <div className="space-y-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-4 md:gap-5 items-start group"
              >
                <div className="flex-shrink-0 relative">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center transition-all group-hover:bg-primary/20 group-hover:scale-105">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-lg">
                    {i + 1}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 w-px h-6 bg-border/50" />
                  )}
                </div>
                <div className="pt-0.5">
                  <h3 className="font-semibold text-base md:text-lg mb-1">{step.title}</h3>
                  <p className="text-foreground/60 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Images column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              <img
                src={inspectionImage}
                alt="Inspeção profissional de sneaker"
                className="rounded-2xl shadow-2xl w-full aspect-square object-cover"
                loading="lazy"
              />
              {/* Floating card overlay */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="absolute -bottom-8 -left-8 bg-card border border-border/50 rounded-xl p-4 shadow-xl backdrop-blur-sm"
              >
                <img
                  src={processImage}
                  alt="Estúdio fotográfico profissional"
                  className="w-40 h-28 rounded-lg object-cover mb-2"
                  loading="lazy"
                />
                <p className="text-xs font-medium">Fotografia profissional</p>
                <p className="text-xs text-muted-foreground">Padrão editorial de catálogo</p>
              </motion.div>
            </div>
            {/* Decorative glow */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full bg-primary/5 blur-3xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
