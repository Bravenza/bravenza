import { memo } from "react";
import { useTranslation } from "react-i18next";
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

const STEP_ICONS = [Search, Camera, Fingerprint, Package, FileCheck, BadgeCheck];

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
  const { t } = useTranslation();

  const VERIFICATION_STEPS = Array.from({ length: 6 }, (_, i) => ({
    step: i + 1,
    icon: STEP_ICONS[i],
    title: t(`authenticityInfo.step${i + 1}`),
    description: t(`authenticityInfo.step${i + 1}Desc`),
  }));

  const AUTHENTICITY_POINTS = [
    { icon: Globe, title: t("authenticityInfo.globalNetwork"), description: t("authenticityInfo.globalNetworkDesc") },
    { icon: Users, title: t("authenticityInfo.specializedTeam"), description: t("authenticityInfo.specializedTeamDesc") },
    { icon: Shield, title: t("authenticityInfo.buyerProtection"), description: t("authenticityInfo.buyerProtectionDesc") },
    { icon: Lock, title: t("authenticityInfo.fullTraceability"), description: t("authenticityInfo.fullTraceabilityDesc") },
  ];

  const INSPECTION_DETAILS = [
    t("authenticityInfo.inspectStitching"),
    t("authenticityInfo.inspectMaterials"),
    t("authenticityInfo.inspectColors"),
    t("authenticityInfo.inspectShape"),
    t("authenticityInfo.inspectLabels"),
    t("authenticityInfo.inspectBarcode"),
    t("authenticityInfo.inspectSole"),
    t("authenticityInfo.inspectInsole"),
    t("authenticityInfo.inspectBox"),
    t("authenticityInfo.inspectAccessories"),
  ];

  const STATS = [
    { value: "100%", label: t("authenticityInfo.statQuality") },
    { value: "6", label: t("authenticityInfo.statSteps") },
    { value: "48h", label: t("authenticityInfo.statTime") },
    { value: "0", label: t("authenticityInfo.statFakeDelivered") },
  ];

  const CERT_FEATURES = [
    t("authenticityInfo.certUniqueCode"),
    t("authenticityInfo.certQrCode"),
    t("authenticityInfo.certPhotos"),
    t("authenticityInfo.certPdf"),
    t("authenticityInfo.certHistory"),
  ];

  return (
    <PublicLayout>
      <Helmet>
        <title>{t("authenticityInfo.pageTitle")}</title>
        <meta name="description" content={t("authenticityInfo.metaDescription")} />
        <meta property="og:title" content={t("authenticityInfo.pageTitle")} />
        <meta property="og:description" content={t("authenticityInfo.metaDescription")} />
        <link rel="canonical" href="https://bravenza.lovable.app/sobre-autenticidade" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full" />
        
        <div className="container mx-auto px-4 relative">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-3xl mx-auto text-center">
            <motion.div variants={fadeInUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
                <Shield className="h-4 w-4" />
                {t("authenticityInfo.heroBadge")}
              </span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {t("authenticityInfo.heroTitle")}{" "}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                {t("authenticityInfo.heroTitleHighlight")}
              </span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t("authenticityInfo.heroSubtitle")}
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/autenticidade">
                  <Search className="h-5 w-5 mr-2" />
                  {t("authenticityInfo.verifyMyProduct")}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <Link to="/solicitar">
                  {t("authenticityInfo.requestQuote")}
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
            {STATS.map((stat, index) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="text-center">
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
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("authenticityInfo.processTitle")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t("authenticityInfo.processSubtitle")}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VERIFICATION_STEPS.map((step, index) => (
              <motion.div key={step.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
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
                          {t("authenticityInfo.stepLabel")} {step.step}
                        </span>
                        <h3 className="font-semibold text-lg mt-1 mb-2">{step.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
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
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("authenticityInfo.whatWeInspect")}</h2>
              <p className="text-muted-foreground mb-8">{t("authenticityInfo.whatWeInspectSubtitle")}</p>

              <div className="grid sm:grid-cols-2 gap-3">
                {INSPECTION_DETAILS.map((detail, index) => (
                  <motion.div key={detail} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">{detail}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl blur-2xl" />
              <div className="relative bg-card border border-border rounded-3xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                    <Eye className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">{t("authenticityInfo.inspection360")}</h3>
                    <p className="text-sm text-muted-foreground">{t("authenticityInfo.inspection360Desc")}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { icon: Camera, label: t("authenticityInfo.hiResPhotos") },
                    { icon: Fingerprint, label: t("authenticityInfo.codeVerification") },
                    { icon: Award, label: t("authenticityInfo.officialComparison") },
                    { icon: BadgeCheck, label: t("authenticityInfo.certIssued") },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50">
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Trust Us */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("authenticityInfo.whyTrustTitle")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t("authenticityInfo.whyTrustSubtitle")}</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {AUTHENTICITY_POINTS.map((point, index) => (
              <motion.div key={point.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
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
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-2 lg:order-1">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/5 rounded-3xl blur-2xl" />
                <div className="relative bg-gradient-to-br from-[#151515] via-[#1a1a1a] to-[#151515] border-2 border-primary/30 rounded-3xl p-8 shadow-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/40 to-primary/20 border border-primary/40 flex items-center justify-center">
                      <Crown className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{t("authenticity.certificateTitle")}</h3>
                      <p className="text-sm text-primary/80">{t("authenticity.bravenzaAuthentic")}</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="p-4 rounded-xl bg-black/30 border border-border/30">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t("authenticityInfo.certPreviewProduct")}</p>
                      <p className="font-semibold">Nike Air Jordan 1 Retro High OG</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-background/30 border border-border/30">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t("authenticityInfo.certPreviewCode")}</p>
                        <p className="font-mono text-sm text-primary">BRV-2024XXXXXX</p>
                      </div>
                      <div className="p-4 rounded-xl bg-background/30 border border-border/30">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t("authenticityInfo.certPreviewStatus")}</p>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-sm text-emerald-500">{t("authenticityInfo.certPreviewVerified")}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <ShieldCheck className="h-5 w-5 text-primary mr-2" />
                    <span className="text-sm font-medium text-primary">{t("authenticityInfo.certPreviewConfirmed")}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-1 lg:order-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-sm font-medium text-primary mb-4">
                <Sparkles className="h-4 w-4" />
                {t("authenticityInfo.digitalCertBadge")}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("authenticityInfo.uniqueCertTitle")}</h2>
              <p className="text-muted-foreground mb-6">{t("authenticityInfo.uniqueCertDesc")}</p>
              <ul className="space-y-3 mb-8">
                {CERT_FEATURES.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="rounded-full">
                <Link to="/autenticidade">
                  <Search className="h-5 w-5 mr-2" />
                  {t("authenticityInfo.verifyCert")}
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-4xl mx-auto">
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent overflow-hidden">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/30 flex items-center justify-center">
                      <Shield className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                  <div className="text-center md:text-left">
                    <h2 className="text-2xl md:text-3xl font-bold mb-3">{t("authenticityInfo.guaranteeTitle")}</h2>
                    <p className="text-muted-foreground mb-6">{t("authenticityInfo.guaranteeDesc")}</p>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                      {[t("authenticityInfo.guaranteeRefund"), t("authenticityInfo.guaranteeNoBureaucracy"), t("authenticityInfo.guaranteeFast")].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-5 w-5 text-primary" />
                          <span>{item}</span>
                        </div>
                      ))}
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
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("authenticityInfo.ctaTitle")}</h2>
            <p className="text-muted-foreground mb-8">{t("authenticityInfo.ctaDesc")}</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/solicitar">
                  {t("authenticityInfo.ctaButton")}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <a href="https://wa.me/5551981055425?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20a%20garantia%20de%20autenticidade." target="_blank" rel="noopener noreferrer">
                  {t("authenticityInfo.ctaWhatsapp")}
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
