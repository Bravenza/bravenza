import { memo } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ScanLine, Lock, BadgeCheck, Fingerprint } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Verificação técnica",
    desc: "Cada sneaker é inspecionado com critérios rigorosos antes de chegar a você.",
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/15",
  },
  {
    icon: ScanLine,
    title: "Certificado digital",
    desc: "QR Code exclusivo com laudo técnico e histórico completo do item.",
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/15",
  },
  {
    icon: Lock,
    title: "Pagamento protegido",
    desc: "Seu dinheiro fica seguro até a entrega e aprovação do produto.",
    gradient: "from-amber-500/20 to-yellow-500/20",
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/15",
  },
  {
    icon: BadgeCheck,
    title: "Garantia Bravenza",
    desc: "Satisfação garantida ou reembolso total. Compra sem risco.",
    gradient: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/15",
  },
];

export const SecuritySection = memo(function SecuritySection() {
  return (
    <section className="py-16 md:py-20 border-t border-border/30 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-emerald-500/5 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Hero header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10"
          >
            <Fingerprint className="h-8 w-8 md:h-10 md:w-10 text-primary" />
          </motion.div>

          <h2 className="text-2xl md:text-4xl font-black tracking-tight mb-3">
            Segurança e{" "}
            <span className="text-gradient-gold">Autenticidade</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto leading-relaxed">
            Sua compra e venda é <strong className="text-foreground">100% garantida</strong> na Bravenza.
            Cada etapa é projetada para sua total tranquilidade.
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
              className="group relative"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />
              <div className="relative flex flex-col items-center text-center p-6 md:p-7 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/30 group-hover:border-primary/20 transition-all duration-500 group-hover:shadow-xl group-hover:shadow-primary/5 group-hover:-translate-y-1">
                <motion.div
                  whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className={`w-14 h-14 rounded-xl ${f.iconBg} flex items-center justify-center mb-4 ring-1 ring-white/5`}
                >
                  <f.icon className={`h-6 w-6 ${f.iconColor}`} />
                </motion.div>
                <h3 className="text-sm font-bold mb-2 text-foreground">{f.title}</h3>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom trust line */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-10 flex items-center justify-center gap-3 text-xs text-muted-foreground"
        >
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Mais de <strong className="text-foreground">2.000 itens</strong> verificados e aprovados</span>
          <span className="text-border">•</span>
          <span><strong className="text-foreground">0 fraudes</strong> registradas</span>
        </motion.div>
      </div>
    </section>
  );
});
