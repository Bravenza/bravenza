import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, FileCheck, CreditCard, Package, Truck } from "lucide-react";
const steps = [{
  icon: Search,
  title: "Você pede",
  description: "Envie o link, foto ou nome do tênis. Nós fazemos o resto."
}, {
  icon: FileCheck,
  title: "Orçamento completo",
  description: "Preço final, prazo de entrega e todas as condições. Sem letras miúdas."
}, {
  icon: CreditCard,
  title: "Pagamento seguro",
  description: "PIX à vista ou cartão em até 12x. Escolha a melhor opção para você."
}, {
  icon: Package,
  title: "Inspeção rigorosa",
  description: "Fotos detalhadas e verificação de autenticidade antes do envio."
}, {
  icon: Truck,
  title: "Entrega garantida",
  description: "Rastreio em tempo real até o tênis chegar nas suas mãos."
}];
const HowItWorksSectionComponent = () => {
  return <section className="py-16 md:py-24 relative">
      <div className="absolute inset-0 bg-gradient-gold-subtle opacity-30" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} transition={{
        duration: 0.6
      }} className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Simples assim: <span className="text-gradient-gold">5 Passos</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base">
            Do pedido à entrega, você acompanha tudo. Transparência total, zero complicação.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => <motion.div key={step.title} initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.5,
          delay: Math.min(index * 0.1, 0.4)
        }} className="relative">
              <div className="card-premium-gold p-4 md:p-6 h-full text-center group hover:border-primary/40 transition-all duration-300">
                <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 md:mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <step.icon className="h-6 w-6 md:h-7 md:w-7 text-primary" />
                </div>
                <div className="text-primary font-bold text-xs md:text-sm mb-1 md:mb-2">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h3 className="font-semibold text-base md:text-lg mb-1 md:mb-2">{step.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">{step.description}</p>
              </div>

              {/* Connector line - only on larger screens */}
              {index < steps.length - 1 && <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-border" />}
            </motion.div>)}
        </div>
      </div>
    </section>;
};
export const HowItWorksSection = memo(HowItWorksSectionComponent);