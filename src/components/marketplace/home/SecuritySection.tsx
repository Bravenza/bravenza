import { memo } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ScanLine, Lock, BadgeCheck } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Verificação técnica",
    desc: "Cada sneaker é inspecionado com critérios rigorosos antes de chegar a você.",
  },
  {
    icon: ScanLine,
    title: "Certificado digital",
    desc: "QR Code exclusivo com laudo técnico e histórico completo do item.",
  },
  {
    icon: Lock,
    title: "Pagamento protegido",
    desc: "Seu dinheiro fica seguro até a entrega e aprovação do produto.",
  },
  {
    icon: BadgeCheck,
    title: "Garantia Bravenza",
    desc: "Satisfação garantida ou reembolso total. Compra sem risco.",
  },
];

export const SecuritySection = memo(function SecuritySection() {
  return (
    <section className="py-12 border-t border-border/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2">
              Segurança e <span className="text-gradient-gold">autenticidade</span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Sua compra e venda é 100% garantida na Bravenza.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col items-center text-center p-5 rounded-2xl bg-card/50 border border-border/20 hover:border-primary/20 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-bold mb-1">{f.title}</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});
