import { memo } from "react";
import { motion } from "framer-motion";
import { Shield, Globe, Zap, Layers, Headphones, Lock } from "lucide-react";

const benefits = [
  {
    icon: Layers,
    title: "Autenticação em 5 níveis",
    description: "Inspeção técnica digital e presencial com parecer detalhado. Se não for autêntico, você não paga.",
  },
  {
    icon: Globe,
    title: "Acesso a peças raras",
    description: "Localizamos sneakers exclusivos junto a parceiros globais que o mercado local não alcança.",
  },
  {
    icon: Shield,
    title: "Intermediação blindada",
    description: "A Bravenza intermedia cada etapa. Seu dinheiro só é liberado quando tudo é verificado.",
  },
  {
    icon: Zap,
    title: "Rastreamento 24/7",
    description: "Cada movimento do seu pedido, do parceiro internacional até sua porta, em tempo real.",
  },
  {
    icon: Lock,
    title: "Pagamento flexível e seguro",
    description: "Parcele em até 12x no cartão ou pague via PIX com segurança total.",
  },
  {
    icon: Headphones,
    title: "Suporte direto no WhatsApp",
    description: "Atendimento humanizado e respostas em minutos. Sem robôs, sem espera.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

const BenefitsSectionComponent = () => {
  return (
    <section className="py-20 md:py-28 relative">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-medium tracking-wider uppercase mb-3 block">
            Diferenciais
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Por que escolher a <span className="text-gradient-gold">BRAVENZA</span>?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Segurança técnica, acesso global e transparência em cada etapa da sua compra.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 max-w-5xl mx-auto"
        >
          {benefits.map((benefit) => (
            <motion.div
              key={benefit.title}
              variants={itemVariants}
              className="card-premium p-6 md:p-7 group"
            >
              {/* Icon with glow effect on hover */}
              <div className="w-11 h-11 mb-5 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 group-hover:shadow-[0_0_20px_hsl(45,100%,50%,0.15)] transition-all duration-300">
                <benefit.icon className="h-5 w-5 text-primary" />
              </div>

              {/* Content */}
              <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors duration-300">
                {benefit.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export const BenefitsSection = memo(BenefitsSectionComponent);
