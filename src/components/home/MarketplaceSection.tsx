import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, ShieldCheck, ArrowRight, BadgeCheck, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: BadgeCheck,
    title: "Verificação técnica disponível",
    description: "Ofertas acima de R$ 2.000 passam por inspeção obrigatória. Abaixo, o serviço é opcional.",
  },
  {
    icon: TrendingUp,
    title: "Preços justos e transparentes",
    description: "Histórico de preços, avaliações de compradores e recomendação de preço justo.",
  },
  {
    icon: Users,
    title: "Comunidade de colecionadores",
    description: "Compre e venda entre membros Vault com reputação verificada.",
  },
];

const MarketplaceSectionComponent = () => {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 backdrop-blur-sm mb-6">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary tracking-wide">
                Marketplace exclusivo
              </span>
            </div>

            <h2 className="font-display text-3xl md:text-4xl font-bold mb-5 tracking-tight">
              Compre e venda com{" "}
              <span className="text-gradient-gold">segurança total.</span>
            </h2>

            <p className="text-muted-foreground text-base max-w-2xl mx-auto">
              O marketplace da Bravenza conecta colecionadores e entusiastas em um
              ambiente onde cada peça é inspecionada e cada transação é protegida.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-5 mb-14">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-premium p-6 text-center group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/15 group-hover:shadow-[0_0_20px_hsl(45,100%,50%,0.15)] transition-all duration-300">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="btn-gold group">
                <Link to="/marketplace">
                  Explorar o marketplace
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="group border-primary/20 hover:border-primary/40">
                <Link to="/full">
                  Conheça o Bravenza Full
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Aberto para todos os membros · Venda sem esforço com o Full
            </p>
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  );
};

export const MarketplaceSection = memo(MarketplaceSectionComponent);
