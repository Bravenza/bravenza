import { motion } from "framer-motion";
import { Search, FileCheck, CreditCard, Package, Truck } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Você pede",
    description: "Envie o link, foto ou nome do sneaker. Nós fazemos o resto.",
  },
  {
    icon: FileCheck,
    title: "Orçamento completo",
    description: "Preço final, prazo de entrega e todas as condições. Sem letras miúdas.",
  },
  {
    icon: CreditCard,
    title: "Pagamento seguro",
    description: "Pague 50% agora. O restante só quando o produto chegar ao Brasil.",
  },
  {
    icon: Package,
    title: "Inspeção rigorosa",
    description: "Fotos detalhadas e verificação de autenticidade antes do envio.",
  },
  {
    icon: Truck,
    title: "Entrega garantida",
    description: "Rastreio em tempo real até o sneaker chegar nas suas mãos.",
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-gradient-gold-subtle opacity-30" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Simples assim: <span className="text-gradient-gold">5 Passos</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Do pedido à entrega, você acompanha tudo. Transparência total, zero complicação.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              <div className="card-premium-gold p-6 h-full text-center group hover:border-primary/40 transition-all duration-300">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <div className="text-primary font-bold text-sm mb-2">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-border" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
