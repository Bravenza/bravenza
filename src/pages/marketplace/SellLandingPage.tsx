import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Store, Package, ArrowRight, ShieldCheck, Clock, BadgePercent, Crown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layouts/PublicLayout";

const options = [
  {
    id: "marketplace",
    title: "Vender no Marketplace",
    subtitle: "Você anuncia, você envia",
    description: "Cadastre seus sneakers, defina o preço e gerencie seus anúncios. Você cuida do envio e nós garantimos a segurança da transação.",
    icon: Store,
    highlights: [
      { icon: BadgePercent, text: "Comissão a partir de 8%" },
      { icon: Clock, text: "Repasse em até 8 dias úteis" },
      { icon: ShieldCheck, text: "Pagamento seguro garantido" },
    ],
    cta: "Criar minha loja",
    href: "/app/loja",
    accent: "primary",
  },
  {
    id: "full",
    title: "Bravenza Full",
    subtitle: "Envie e a gente cuida de tudo",
    description: "Mande seu sneaker para o nosso hub. Nós autenticamos, fotografamos, anunciamos e enviamos ao comprador. Você só recebe o dinheiro.",
    icon: Crown,
    highlights: [
      { icon: Package, text: "Envio único para o Hub" },
      { icon: ShieldCheck, text: "Autenticação + foto profissional" },
      { icon: BadgePercent, text: "Comissão fixa de 22%" },
    ],
    cta: "Quero o Full",
    href: "/full",
    accent: "primary",
    badge: "Recomendado",
  },
];

export default function SellLandingPage() {
  const navigate = useNavigate();

  return (
    <PublicLayout className="theme-light">
      <Helmet>
        <title>Quero Vender | BRAVENZA — Sneakers Autenticados</title>
        <meta name="description" content="Escolha como vender seus sneakers na Bravenza: anuncie no Marketplace ou use o Bravenza Full e deixe tudo com a gente." />
        <link rel="canonical" href="https://bravenza.com.br/vender" />
      </Helmet>

      <section className="relative overflow-hidden min-h-[80vh] flex items-center">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-card to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.12),transparent_60%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />

        <div className="max-w-5xl mx-auto px-4 py-16 md:py-24 relative z-10 w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 md:mb-16"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm"
            >
              <Store className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Programa de Vendedores</span>
            </motion.div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 leading-[0.9]">
              Como você quer{" "}
              <span className="text-gradient-gold">vender?</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              Escolha o modelo ideal para você. Em ambos, seus sneakers são{" "}
              <strong className="text-foreground">autenticados e protegidos</strong> pela Bravenza.
            </p>
          </motion.div>

          {/* Two cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {options.map((opt, i) => (
              <motion.div
                key={opt.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.15, duration: 0.6 }}
                className="relative group"
              >
                {opt.badge && (
                  <div className="absolute -top-3 right-4 z-10 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-primary/30">
                    {opt.badge}
                  </div>
                )}

                <div className="h-full rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-6 md:p-8 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col">
                  {/* Icon + title */}
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                      <opt.icon className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground">{opt.title}</h2>
                      <p className="text-sm text-primary font-semibold">{opt.subtitle}</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">{opt.description}</p>

                  {/* Highlights */}
                  <div className="space-y-3 mb-8 flex-1">
                    {opt.highlights.map((h) => (
                      <div key={h.text} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                          <h.icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm text-foreground font-medium">{h.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Button
                    size="lg"
                    className={opt.id === "full"
                      ? "btn-gold rounded-full h-14 w-full text-base font-bold gap-2 shadow-lg shadow-primary/20"
                      : "rounded-full h-14 w-full text-base font-bold gap-2 bg-foreground text-background hover:bg-foreground/90"
                    }
                    onClick={() => navigate(opt.href)}
                  >
                    {opt.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Secondary link to Full rules */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-8"
          >
            <button
              onClick={() => navigate("/full")}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Ver regras e detalhes do Bravenza Full
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
