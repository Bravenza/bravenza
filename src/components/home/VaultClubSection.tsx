import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Crown, Search, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const VaultClubSectionComponent = () => {
  return (
    <section className="py-14 md:py-20 bg-gradient-to-b from-background to-zinc-950">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Lock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Acesso exclusivo por convite</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Mais do que importação.{" "}
              <span className="text-gradient-gold">Curadoria global.</span>
            </h2>
            
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              O Bravenza Vault Club é um ecossistema fechado para colecionadores. 
              Não existe catálogo. Existe a sua busca e a nossa dedicação em encontrar.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="card-premium p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Curadoria personalizada</h3>
              <p className="text-sm text-muted-foreground">
                Você descreve o tênis dos seus sonhos e nossa equipe vasculha o mercado global
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="card-premium p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Certificação Vault ID</h3>
              <p className="text-sm text-muted-foreground">
                Cada peça recebe um código único com QR code para verificação de autenticidade
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="card-premium p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Níveis de acesso</h3>
              <p className="text-sm text-muted-foreground">
                Vault Access, Privilege e Black. Evolua conforme sua jornada no clube
              </p>
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <div className="inline-flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="btn-gold">
                <Link to="/vault">
                  Conhecer o Vault Club
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-primary/30 hover:bg-primary/10">
                <Link to="/vault/waitlist">
                  Entrar na lista de espera
                </Link>
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
