import { motion } from "framer-motion";
import { Search, FileCheck, CreditCard, Package, Truck } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Solicite",
    description: "Nos conte qual sneaker você procura. Envie link, foto ou apenas a descrição.",
  },
  {
    icon: FileCheck,
    title: "Orçamento",
    description: "Receba um orçamento detalhado com preço final e prazo estimado.",
  },
  {
    icon: CreditCard,
    title: "Pagamento",
    description: "Aprove e pague o sinal de 50%. O saldo é pago quando o produto chegar ao Brasil.",
  },
  {
    icon: Package,
    title: "Importação",
    description: "Fazemos a busca, compra, inspeção e envio do seu sneaker com segurança.",
  },
  {
    icon: Truck,
    title: "Entrega",
    description: "Acompanhe em tempo real até receber seu sneaker em mãos.",
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
            Como <span className="text-gradient-gold">Funciona</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Um processo simples e transparente do pedido até a entrega
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
