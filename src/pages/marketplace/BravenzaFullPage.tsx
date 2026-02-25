import { motion } from "framer-motion";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Camera, Shield, Tag, Truck, ArrowRight, CheckCircle2,
  Package, Star, Clock, DollarSign
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

const BENEFITS = [
  { icon: Clock, text: "Sem esforço: nós cuidamos de tudo" },
  { icon: Camera, text: "Fotos profissionais que vendem mais" },
  { icon: Shield, text: "Selo Verified de autenticidade" },
  { icon: Star, text: "Anúncio otimizado pela equipe Bravenza" },
  { icon: Truck, text: "Logística completa do vendedor ao comprador" },
  { icon: CheckCircle2, text: "Acompanhamento em tempo real de cada etapa" },
];

export default function BravenzaFullPage() {
  return (
    <PublicLayout>
      <Helmet>
        <title>Bravenza Full | Venda sem esforço | BRAVENZA</title>
        <meta
          name="description"
          content="Envie seu sneaker e a BRAVENZA cuida de tudo: autenticação, fotografia profissional, precificação e envio ao comprador."
        />
        <link rel="canonical" href="https://bravenza.com.br/full" />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 sm:px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Nível 3 de verificação</span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Envie seu sneaker.{" "}
              <span className="text-gradient-gold">Nós fazemos o resto.</span>
            </h1>
            
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              O Bravenza Full é o modelo de consignação onde cuidamos de tudo: 
              autenticação, fotografia profissional, anúncio otimizado e envio ao comprador. 
              Você só precisa enviar o sneaker.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/app/loja">
                <Button size="xl" className="btn-gold w-full sm:w-auto group">
                  Solicitar agora
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            <p className="text-muted-foreground/60 text-sm mt-4">
              Comissão fixa de 22% sobre o valor da venda. Sem taxas antecipadas.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
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

      {/* Benefits */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Por que escolher o <span className="text-gradient-gold">Full?</span>
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card/50"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm md:text-base font-medium">{b.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 md:py-24 bg-card/30">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-lg mx-auto text-center"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              Transparente e <span className="text-gradient-gold">simples</span>
            </h2>
            
            <div className="rounded-2xl border border-primary/20 bg-card p-8 md:p-10">
              <p className="text-5xl md:text-6xl font-display font-bold text-primary mb-2">22%</p>
              <p className="text-muted-foreground mb-6">sobre o valor da venda</p>
              
              <ul className="text-sm text-left space-y-3 mb-8">
                {[
                  "Sem taxas antecipadas ou mensalidades",
                  "Inclui autenticação, fotos e anúncio",
                  "Inclui envio ao comprador",
                  "Pagamento liberado automaticamente",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Link to="/app/loja">
                <Button className="w-full btn-gold" size="lg">
                  Começar agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
