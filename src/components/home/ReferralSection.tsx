import { memo } from "react";
import { motion } from "framer-motion";
import { Gift, Users, Wallet, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const ReferralSectionComponent = () => {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
      
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary mb-6">
            <Gift className="h-4 w-4" />
            <span className="text-sm font-medium">Programa exclusivo</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Indique amigos e <span className="text-gradient-gold">ganhe cashback</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Compartilhe seu código exclusivo e ganhe desconto no seu próximo pedido quando seus amigos comprarem
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center p-6"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <Gift className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">1. Pegue seu código</h3>
            <p className="text-muted-foreground text-sm">
              Entre na sua conta e gere seu link exclusivo em segundos
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center p-6"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">2. Mande pros amigos</h3>
            <p className="text-muted-foreground text-sm">
              Compartilhe com quem também quer sneakers originais
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center p-6"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">3. Ganhe cashback</h3>
            <p className="text-muted-foreground text-sm">
              Quando seu amigo finalizar a compra, você ganha desconto automático
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="card-premium p-8 max-w-2xl mx-auto text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-5xl md:text-6xl font-bold text-gradient-gold">5%</span>
            <span className="text-xl text-muted-foreground text-left">de cashback<br />por indicação</span>
          </div>
          <p className="text-muted-foreground mb-6">
            <strong className="text-foreground">Sem limite de indicações!</strong> Quanto mais amigos você indicar, mais desconto você acumula.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="gap-2 btn-gold">
              <Link to="/cliente/login">
                Começar a indicar
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-primary/30">
              <Link to="/solicitar">
                Fazer meu primeiro pedido
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export const ReferralSection = memo(ReferralSectionComponent);
