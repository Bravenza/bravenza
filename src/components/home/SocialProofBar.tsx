import { memo } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Globe, Users, Package } from "lucide-react";

const metrics = [
  { icon: ShieldCheck, value: "500+", label: "Tênis autenticados" },
  { icon: Globe, value: "15+", label: "Países parceiros" },
  { icon: Users, value: "100%", label: "Clientes satisfeitos" },
  { icon: Package, value: "0", label: "Reprovados entregues" },
];

const SocialProofBarComponent = () => {
  return (
    <section className="py-10 md:py-14 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto"
        >
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="text-center p-4 md:p-6 rounded-lg bg-card/30 border border-border/30 backdrop-blur-sm"
            >
              <metric.icon className="h-5 w-5 text-primary mx-auto mb-3" />
              <p className="font-display text-2xl md:text-3xl font-bold text-gradient-gold mb-1">
                {metric.value}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">
                {metric.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export const SocialProofBar = memo(SocialProofBarComponent);
