import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Crown, Search, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Search,
    title: "Curadoria personalizada",
    description: "Você descreve o tênis dos seus sonhos e nossa equipe vasculha o mercado global",
    delay: 0.1,
  },
  {
    icon: Shield,
    title: "Certificação Vault ID",
    description: "Cada peça recebe um código único com QR code para verificação",
    delay: 0.2,
  },
  {
    icon: Crown,
    title: "Níveis de acesso",
    description: "Vault Access, Privilege e Black. Evolua conforme sua jornada",
    delay: 0.3,
  },
];

const VaultClubSectionComponent = () => {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-background via-background to-secondary/30 relative overflow-hidden">
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      
      {/* Accent lines */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="absolute top-[20%] left-0 w-24 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent origin-left"
      />
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.2 }}
        className="absolute bottom-[25%] right-0 w-32 h-px bg-gradient-to-l from-transparent via-primary/20 to-transparent origin-right"
      />

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
              <Lock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary tracking-wide">
                Acesso exclusivo por convite
              </span>
            </div>

            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-5 tracking-tight">
              Curadoria sob demanda.{" "}
              <span className="text-gradient-gold">Autenticidade garantida.</span>
            </h2>

            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
              O Bravenza Vault Club é um ecossistema fechado para colecionadores.
              Não existe catálogo. Existe a sua busca e a nossa dedicação.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-5 mb-14">
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: feature.delay }}
                className="card-premium-gold p-6 text-center group"
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
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <div className="inline-flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="btn-gold group">
                <Link to="/vault">
                  Conhecer o Vault Club
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-primary/20 hover:bg-primary/5 hover:border-primary/40"
              >
                <Link to="/vault/waitlist">Entrar na lista de espera</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Acesso somente por convite de membros ativos
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export const VaultClubSection = memo(VaultClubSectionComponent);
