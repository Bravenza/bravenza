import { memo } from "react";
import { motion } from "framer-motion";
import { Shield, Globe, Zap, BadgeCheck, Headphones, Lock } from "lucide-react";

const benefits = [
  {
    icon: BadgeCheck,
    title: "Garantia de autenticidade",
    description: "Inspeção rigorosa antes do envio. Se não for original, você não paga.",
  },
  {
    icon: Globe,
    title: "Acesso mundial",
    description: "EUA, Europa, Ásia... Onde estiver, nós buscamos para você.",
  },
  {
    icon: Shield,
    title: "Fornecedores verificados",
    description: "Rede exclusiva de parceiros com histórico comprovado.",
  },
  {
    icon: Zap,
    title: "Rastreamento 24/7",
    description: "Cada movimento do seu pedido, em tempo real.",
  },
  {
    icon: Lock,
    title: "Pagamento protegido",
    description: "Parcele em até 12x ou pague via PIX com segurança.",
  },
  {
    icon: Headphones,
    title: "Suporte VIP",
    description: "Atendimento direto no WhatsApp. Resposta em minutos.",
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
            Por que a <span className="text-gradient-gold">BRAVENZA</span>?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Sua conexão direta com os tênis mais exclusivos do planeta.
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
