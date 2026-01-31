import { memo } from "react";
import { motion } from "framer-motion";
import { Shield, Globe, Zap, BadgeCheck, Headphones, Lock } from "lucide-react";
const benefits = [{
  icon: BadgeCheck,
  title: "Garantia de autenticidade",
  description: "Todos os produtos passam por rigorosa inspeção de autenticidade antes do envio."
}, {
  icon: Globe,
  title: "Acesso mundial",
  description: "EUA, Europa, Ásia, Oriente Médio... Onde estiver, nós buscamos e trazemos para você."
}, {
  icon: Shield,
  title: "Fornecedores verificados",
  description: "Rede exclusiva de parceiros internacionais com histórico comprovado e auditado."
}, {
  icon: Zap,
  title: "Rastreamento 24/7",
  description: "Cada movimento do seu pedido, em tempo real. Do fornecedor até sua porta."
}, {
  icon: Lock,
  title: "Pagamento protegido",
  description: "Parcele em até 12x no cartão ou pague via PIX com total segurança."
}, {
  icon: Headphones,
  title: "Suporte VIP",
  description: "Atendimento direto no WhatsApp. Dúvidas? Resposta em minutos, não em dias."
}];
const BenefitsSectionComponent = () => {
  return <section className="py-14 md:py-20">
      <div className="container mx-auto px-4 sm:px-6">
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
          <h2 className="text-3xl font-bold mb-4 md:text-3xl">
            Por que a{" "}
            <span className="text-gradient-gold text-3xl">BRAVENZA</span>?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base">
            Não somos apenas mais uma importadora. Somos a sua conexão direta com os tênis mais exclusivos do planeta.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => <motion.div key={benefit.title} initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.5,
          delay: Math.min(index * 0.1, 0.5)
        }} className="card-premium p-6 md:p-8 group hover:border-primary/30 transition-all duration-300">
              <div className="w-12 h-12 mb-5 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <benefit.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-3">{benefit.title}</h3>
              <p className="text-muted-foreground text-base">{benefit.description}</p>
            </motion.div>)}
        </div>
      </div>
    </section>;
};
export const BenefitsSection = memo(BenefitsSectionComponent);