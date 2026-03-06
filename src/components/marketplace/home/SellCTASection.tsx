import { memo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, DollarSign, ShieldCheck, Zap, Clock, TrendingUp, Star, Users, BadgePercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const stats = [
  { value: "8%", label: "Comissão mínima", icon: BadgePercent },
  { value: "8 dias", label: "Repasse em dias úteis", icon: Clock },
  { value: "100%", label: "Seguro contra fraude", icon: ShieldCheck },
];

const benefits = [
  { icon: Zap, title: "Anuncie em minutos", desc: "Cadastre seu par, defina o preço e publique. Simples assim." },
  { icon: ShieldCheck, title: "Selo de confiança", desc: "Itens acima de R$ 2.000 passam por verificação técnica obrigatória." },
  { icon: TrendingUp, title: "Alcance premium", desc: "Sua oferta aparece para milhares de colecionadores qualificados." },
  { icon: Star, title: "Reputação que cresce", desc: "Cada venda melhora seu perfil. Mais vendas = mais visibilidade." },
];

export const SellCTASection = memo(function SellCTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-12 relative overflow-hidden">
      {/* Dramatic background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-background to-primary/6" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--primary)/0.08),transparent_50%)]" />

      {/* Animated accent lines */}
      <motion.div
        className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.3 }}
      />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 mb-6 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/25 backdrop-blur-sm"
          >
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-xs font-black text-primary uppercase tracking-widest">Programa de Vendedores</span>
          </motion.div>

          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight mb-5 font-display leading-[0.9]">
            Seu acervo vale{" "}
            <span className="text-gradient-gold">mais aqui</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Na Bravenza, você vende para quem <strong className="text-foreground">entende e valoriza</strong> sneakers autênticos.
            Comissões a partir de <strong className="text-foreground">8%</strong> e repasse em até <strong className="text-foreground">8 dias úteis</strong>.
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-3 gap-3 md:gap-6 max-w-3xl mx-auto mb-14"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="text-center p-4 md:p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-primary/15 shadow-lg shadow-primary/5"
            >
              <s.icon className="h-5 w-5 text-primary mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{s.value}</div>
              <div className="text-[10px] md:text-xs text-muted-foreground font-medium mt-1">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 max-w-4xl mx-auto mb-14">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              className="flex items-start gap-4 p-5 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/30 hover:border-primary/25 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                <b.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm mb-1">{b.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="btn-gold rounded-full h-14 sm:h-16 px-8 sm:px-12 text-base sm:text-lg font-black gap-2 sm:gap-3 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all"
              onClick={() => navigate("/app/loja")}
            >
              <Users className="h-5 w-5 shrink-0" />
              <span className="whitespace-nowrap">Começar a vender agora</span>
              <ArrowRight className="h-5 w-5 shrink-0" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full h-14 sm:h-16 px-8 sm:px-10 text-base sm:text-lg font-bold gap-2 sm:gap-3 border-primary/25 hover:border-primary/40 transition-all"
              onClick={() => navigate("/full")}
            >
              <Zap className="h-5 w-5 text-primary shrink-0" />
              <span className="whitespace-nowrap">Bravenza Full — 22%</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Cadastro gratuito · Sem mensalidade · Ou deixe a Bravenza cuidar de tudo com o <strong className="text-foreground">Full</strong>
          </p>
        </motion.div>
      </div>
    </section>
  );
});
