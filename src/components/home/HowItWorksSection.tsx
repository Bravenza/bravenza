import { memo } from "react";
import { motion } from "framer-motion";
import { Search, FileCheck, CreditCard, Package, Truck } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Você descreve",
    description: "Modelo, tamanho, condição e budget.",
  },
  {
    icon: FileCheck,
    title: "Curadoria ativa",
    description: "Buscamos as melhores opções com parceiros verificados.",
  },
  {
    icon: CreditCard,
    title: "Pagamento seguro",
    description: "PIX ou cartão em até 12x.",
  },
  {
    icon: Package,
    title: "Autenticação técnica",
    description: "Verificação digital e/ou presencial com parecer.",
  },
  {
    icon: Truck,
    title: "Entrega garantida",
    description: "Rastreio até sua porta.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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

const HowItWorksSectionComponent = () => {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-medium tracking-wider uppercase mb-3 block">
            Processo
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Simples assim: <span className="text-gradient-gold">5 Passos</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Do pedido à entrega, você acompanha tudo. Transparência total.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-3 max-w-5xl mx-auto"
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              variants={itemVariants}
              className={`relative ${index === 4 ? 'col-span-2 md:col-span-1 max-w-[200px] mx-auto md:max-w-none' : ''}`}
            >
              <div className="card-premium-gold p-5 md:p-6 h-full text-center group">
                {/* Step number - top right */}
                <div className="absolute top-3 right-3 text-[10px] font-mono text-primary/60">
                  {String(index + 1).padStart(2, "0")}
                </div>

                {/* Icon */}
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors duration-300">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>

                {/* Content */}
                <h3 className="font-semibold text-sm md:text-base mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Connector dots - desktop only */}
              {index < steps.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-2 items-center gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-primary/40" />
                  <div className="w-1 h-1 rounded-full bg-primary/20" />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  );
};

export const HowItWorksSection = memo(HowItWorksSectionComponent);
