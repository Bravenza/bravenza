import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Shield, Crown, Sparkles, Users, Search, CheckCircle2, Lock, ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";

const tiers = [
  {
    name: "Vault Access",
    icon: Shield,
    color: "text-muted-foreground",
    bgColor: "bg-card",
    borderColor: "border-border",
    benefits: [
      "Até 3 itens na wishlist",
      "1 busca ativa por vez",
      "2 convites por semestre",
      "Curadoria dedicada",
    ],
  },
  {
    name: "Vault Privilege",
    icon: Crown,
    color: "text-primary",
    bgColor: "bg-card",
    borderColor: "border-primary/30",
    benefits: [
      "Wishlist ilimitada",
      "3 buscas ativas simultâneas",
      "3 convites por semestre",
      "SLA prioritário",
      "Conteúdo exclusivo",
    ],
    featured: true,
  },
  {
    name: "Vault Black",
    icon: Sparkles,
    color: "text-foreground",
    bgColor: "bg-gradient-to-br from-card to-background",
    borderColor: "border-foreground/20",
    benefits: [
      "Acesso total ao clube",
      "5 buscas ativas simultâneas",
      "5 convites por semestre",
      "Atendimento VIP",
      "Conteúdo Black exclusivo",
      "Janela de decisão estendida",
    ],
    exclusive: true,
  },
];

const howItWorks = [
  {
    step: 1,
    title: "Descreva o que procura",
    description: "Adicione o sneaker dos seus sonhos à sua wishlist com todos os detalhes",
    icon: Search,
  },
  {
    step: 2,
    title: "Nossa curadoria busca",
    description: "Ativamos a busca e vasculhamos o mercado global com fornecedores verificados",
    icon: Users,
  },
  {
    step: 3,
    title: "Você decide",
    description: "Apresentamos as melhores opções na Match Room para sua decisão",
    icon: CheckCircle2,
  },
  {
    step: 4,
    title: "Receba com certificado",
    description: "Seu sneaker chega com Vault ID único, certificado e verificação por QR code",
    icon: Shield,
  },
];

export default function VaultLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <Helmet>
        <title>Vault Club | BRAVENZA — Curadoria Exclusiva de Sneakers</title>
        <meta name="description" content="Faça parte do Vault Club BRAVENZA. Curadoria sob demanda, wishlist personalizada, Match Room e benefícios exclusivos para colecionadores." />
      </Helmet>
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <div className="fixed inset-0 bg-radial-glow pointer-events-none" />
      
      {/* Header */}
      <header className="relative border-b border-border/30 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link to="/entrar?redirect=/minha-conta">
                Já sou membro
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/vault/redeem">
                Resgatar convite
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-card/50 to-background" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
        >
          <Badge variant="outline" className="mb-6 border-primary/30 text-primary bg-primary/5">
            <Lock className="w-3 h-3 mr-1" />
            Acesso por convite
          </Badge>
          
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
            Bravenza{" "}
            <span className="text-gradient-gold">
              Vault Club
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Curadoria sob demanda exclusiva de sneakers para colecionadores. 
            Não existe catálogo. Existe a sua busca e a nossa dedicação.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="btn-gold">
              <Link to="/vault/redeem">
                Recebi um convite
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-border hover:bg-card hover:border-border/80">
              <Link to="/vault/waitlist">
                Entrar na lista de espera
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="relative py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Como funciona</h2>
            <p className="text-muted-foreground">Curadoria personalizada do início ao fim</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="card-premium h-full">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-sm text-primary font-medium mb-2">Passo {item.step}</div>
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Níveis do clube</h2>
            <p className="text-muted-foreground">Evolua conforme sua jornada no Vault</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${tier.bgColor} border ${tier.borderColor} h-full ${tier.featured ? 'ring-2 ring-primary/30' : ''} ${tier.exclusive ? 'ring-2 ring-foreground/20' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <tier.icon className={`h-6 w-6 ${tier.color}`} />
                      <h3 className="text-xl font-bold">{tier.name}</h3>
                    </div>
                    {tier.exclusive && (
                      <Badge className="mb-4 bg-foreground/10 text-foreground border-0">
                        Somente por convite
                      </Badge>
                    )}
                    <ul className="space-y-3">
                      {tier.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className={`h-4 w-4 ${tier.color} flex-shrink-0 mt-0.5`} />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-t from-card/50 to-transparent" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center relative"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Pronto para entrar no Vault?
          </h2>
          <p className="text-muted-foreground mb-8">
            Se você tem um convite, resgate agora. Se não, entre na lista de espera 
            e aguarde sua vez de fazer parte do clube.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="btn-gold">
              <Link to="/vault/redeem">Resgatar convite</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-border hover:bg-card">
              <Link to="/vault/waitlist">Lista de espera</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 px-4 border-t border-border/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Bravenza Vault Club. Todos os direitos reservados.
          </div>
          <div className="flex gap-6">
            <Link to="/termos" className="text-sm text-muted-foreground hover:text-foreground transition group inline-flex items-center gap-1">
              Termos
              <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
            </Link>
            <Link to="/politicas" className="text-sm text-muted-foreground hover:text-foreground transition group inline-flex items-center gap-1">
              Privacidade
              <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
            </Link>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition group inline-flex items-center gap-1">
              Bravenza Store
              <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
