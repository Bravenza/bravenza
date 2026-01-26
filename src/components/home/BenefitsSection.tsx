import { motion } from "framer-motion";
import { Shield, Globe, Clock, BadgeCheck, Headphones, Lock } from "lucide-react";

const benefits = [
  {
    icon: BadgeCheck,
    title: "100% Autêntico",
    description: "Todos os produtos passam por rigorosa inspeção de autenticidade antes do envio.",
  },
  {
    icon: Globe,
    title: "Acesso Global",
    description: "Importamos de qualquer lugar do mundo: EUA, Europa, Ásia e mais.",
  },
  {
    icon: Shield,
    title: "Compra Segura",
    description: "Negociamos apenas com fornecedores verificados e confiáveis.",
  },
  {
    icon: Clock,
    title: "Rastreamento Total",
    description: "Acompanhe cada etapa do seu pedido em tempo real pelo nosso sistema.",
  },
  {
    icon: Lock,
    title: "Pagamento Protegido",
    description: "Parcele em até 12x no cartão ou pague via PIX com total segurança.",
  },
  {
    icon: Headphones,
    title: "Suporte Dedicado",
    description: "Atendimento personalizado do início ao fim do seu pedido.",
  },
];

export const BenefitsSection = () => {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Por que escolher a{" "}
            <span className="text-gradient-gold">BRAVENZA</span>?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Experiência premium em cada detalhe da sua importação
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card-premium p-8 group hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-12 h-12 mb-5 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <benefit.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-3">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
