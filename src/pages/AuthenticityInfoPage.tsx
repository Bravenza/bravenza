import { memo } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Shield, CheckCircle, Eye, Fingerprint, Package, Award, 
  Lock, ShieldCheck, BadgeCheck, Search, Users, Sparkles,
  FileCheck, Camera, Globe, Truck, Star, Crown, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicLayout } from "@/components/layouts/PublicLayout";

const VERIFICATION_STEPS = [
  {
    step: 1,
    icon: Search,
    title: "Sourcing verificado",
    description: "Trabalhamos apenas com fornecedores autorizados e parceiros de confiança ao redor do mundo. Cada produto passa por uma verificação de origem antes mesmo de ser adquirido."
  },
  {
    step: 2,
    icon: Camera,
    title: "Inspeção visual detalhada",
    description: "Nossa equipe realiza uma análise minuciosa de cada tênis: costuras, acabamentos, materiais, etiquetas e todos os detalhes que diferenciam um produto original."
  },
  {
    step: 3,
    icon: Fingerprint,
    title: "Verificação de códigos",
    description: "Conferimos códigos de barras, SKUs, números de série e etiquetas internas para garantir que correspondam às especificações oficiais do fabricante."
  },
  {
    step: 4,
    icon: Package,
    title: "Análise de embalagem",
    description: "Verificamos a caixa original, papelão, adesivos, tissue paper e todos os acessórios que acompanham o produto autêntico."
  },
  {
    step: 5,
    icon: FileCheck,
    title: "Documentação fotográfica",
    description: "Registramos cada produto com fotos de alta resolução de todos os ângulos, criando um dossiê visual que fica disponível para você."
  },
  {
    step: 6,
    icon: BadgeCheck,
    title: "Certificação digital",
    description: "Após aprovação, emitimos um certificado de autenticidade com código único que pode ser verificado a qualquer momento em nossa plataforma."
  }
];

const AUTHENTICITY_POINTS = [
  {
    icon: Globe,
    title: "Rede global de fornecedores",
    description: "Conexões diretas com distribuidores autorizados nos Estados Unidos, Europa e Ásia."
  },
  {
    icon: Users,
    title: "Equipe especializada",
    description: "Profissionais com anos de experiência no mercado de tênis premium e itens de colecionador."
  },
  {
    icon: Shield,
    title: "Garantia total",
    description: "Se houver qualquer dúvida sobre a autenticidade, devolvemos 100% do seu dinheiro."
  },
  {
    icon: Lock,
    title: "Rastreabilidade completa",
    description: "Histórico documentado de cada produto, desde a origem até a entrega em suas mãos."
  }
];

const INSPECTION_DETAILS = [
  "Qualidade e padrão das costuras",
  "Materiais e texturas utilizados",
  "Cores e tonalidades corretas",
  "Formato e proporções do calçado",
  "Etiquetas internas e externas",
  "Código de barras e SKU",
  "Sola e entressola",
  "Palmilha e forro interno",
  "Caixa e embalagem original",
  "Acessórios incluídos"
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

function AuthenticityInfoPageComponent() {
  return (
    <PublicLayout>
      <Helmet>
        <title>Garantia de autenticidade | BRAVENZA</title>
        <meta 
          name="description" 
          content="Entenda como a Bravenza garante a autenticidade de cada tênis. Processo de verificação rigoroso com certificação digital e garantia de devolução." 
        />
        <meta property="og:title" content="Garantia de autenticidade | BRAVENZA" />
        <meta property="og:description" content="Processo de verificação rigoroso com certificação digital." />
        <link rel="canonical" href="https://bravenza.lovable.app/sobre-autenticidade" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full" />
        
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div variants={fadeInUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
                <Shield className="h-4 w-4" />
                100% autêntico ou seu dinheiro de volta
              </span>
            </motion.div>

            <motion.h1 
              variants={fadeInUp}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            >
              Autenticidade{" "}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                garantida
              </span>
            </motion.h1>

            <motion.p 
              variants={fadeInUp}
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            >
              Cada tênis que passa pela Bravenza é submetido a um rigoroso processo de verificação. 
              Não aceitamos nada menos que 100% de certeza sobre a autenticidade.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/autenticidade">
                  <Search className="h-5 w-5 mr-2" />
                  Verificar meu produto
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <Link to="/solicitar">
                  Solicitar orçamento
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trust Stats */}
      <section className="py-12 border-y border-border bg-card/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "100%", label: "Taxa de autenticidade" },
              { value: "6", label: "Etapas de verificação" },
              { value: "48h", label: "Tempo de inspeção" },
              { value: "0", label: "Produtos falsos entregues" }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Verification Process */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Nosso processo de verificação
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Cada produto passa por 6 etapas rigorosas antes de chegar até você. 
              Não cortamos caminhos quando se trata de autenticidade.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VERIFICATION_STEPS.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-border/50 bg-card/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center">
                          <step.icon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-primary font-medium uppercase tracking-wide">
                          Etapa {step.step}
                        </span>
                        <h3 className="font-semibold text-lg mt-1 mb-2">{step.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Inspect */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-card/50 to-transparent">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                O que verificamos em cada tênis
              </h2>
              <p className="text-muted-foreground mb-8">
                Nossa inspeção é minuciosa e abrange todos os aspectos que diferenciam 
                um produto original de uma réplica. Não deixamos nenhum detalhe passar.
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                {INSPECTION_DETAILS.map((detail, index) => (
                  <motion.div
                    key={detail}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">{detail}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl blur-2xl" />
              <div className="relative bg-card border border-border rounded-3xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                    <Eye className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">Inspeção em 360°</h3>
                    <p className="text-sm text-muted-foreground">Nenhum detalhe escapa</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50">
                    <div className="flex items-center gap-3">
                      <Camera className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">Fotos de alta resolução</span>
                    </div>
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50">
                    <div className="flex items-center gap-3">
                      <Fingerprint className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">Verificação de códigos</span>
                    </div>
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50">
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">Comparação com padrões oficiais</span>
                    </div>
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50">
                    <div className="flex items-center gap-3">
                      <BadgeCheck className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">Certificação emitida</span>
                    </div>
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Trust Us */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Por que confiar na Bravenza
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Não somos apenas intermediários. Somos especialistas apaixonados por tênis 
              que levam a autenticidade a sério.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {AUTHENTICITY_POINTS.map((point, index) => (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full text-center border-border/50 bg-card/50">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                      <point.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{point.title}</h3>
                    <p className="text-sm text-muted-foreground">{point.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certificate Preview */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-transparent via-card/30 to-transparent">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/5 rounded-3xl blur-2xl" />
                <div className="relative bg-gradient-to-br from-[#151515] via-[#1a1a1a] to-[#151515] border-2 border-primary/30 rounded-3xl p-8 shadow-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/40 to-primary/20 border border-primary/40 flex items-center justify-center">
                      <Crown className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Certificado de autenticidade</h3>
                      <p className="text-sm text-primary/80">Bravenza Authentic™</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="p-4 rounded-xl bg-black/30 border border-border/30">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Produto</p>
                      <p className="font-semibold">Nike Air Jordan 1 Retro High OG</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-background/30 border border-border/30">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Código</p>
                        <p className="font-mono text-sm text-primary">BRV-2024XXXXXX</p>
                      </div>
                      <div className="p-4 rounded-xl bg-background/30 border border-border/30">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Status</p>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-sm text-emerald-500">Verificado</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <ShieldCheck className="h-5 w-5 text-primary mr-2" />
                    <span className="text-sm font-medium text-primary">Autenticidade confirmada</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-sm font-medium text-primary mb-4">
                <Sparkles className="h-4 w-4" />
                Certificado digital
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Certificado único para cada produto
              </h2>
              <p className="text-muted-foreground mb-6">
                Após a verificação, cada produto recebe um certificado digital exclusivo com código único. 
                Você pode verificar a autenticidade a qualquer momento, compartilhar com compradores 
                em caso de revenda, e ter a tranquilidade de saber que possui um produto original.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Código único verificável online",
                  "QR Code para acesso rápido",
                  "Fotos da inspeção incluídas",
                  "Download em PDF disponível",
                  "Histórico de verificações"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="rounded-full">
                <Link to="/autenticidade">
                  <Search className="h-5 w-5 mr-2" />
                  Verificar certificado
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent overflow-hidden">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/30 flex items-center justify-center">
                      <Shield className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                  <div className="text-center md:text-left">
                    <h2 className="text-2xl md:text-3xl font-bold mb-3">
                      Garantia de autenticidade ou dinheiro de volta
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Estamos tão confiantes em nosso processo de verificação que oferecemos garantia total. 
                      Se, por qualquer motivo, for comprovado que o produto não é autêntico, devolvemos 
                      100% do valor pago. Sem perguntas, sem burocracia.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <span>Reembolso integral</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <span>Sem burocracia</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <span>Processo rápido</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-card/50 to-transparent">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para encontrar seu próximo tênis?
            </h2>
            <p className="text-muted-foreground mb-8">
              Solicite um orçamento e deixe nossa equipe encontrar o tênis dos seus sonhos 
              com garantia total de autenticidade.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/solicitar">
                  Solicitar orçamento
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <a 
                  href="https://wa.me/5551981055425?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20a%20garantia%20de%20autenticidade."
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Falar no WhatsApp
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}

const AuthenticityInfoPage = memo(AuthenticityInfoPageComponent);
export default AuthenticityInfoPage;
