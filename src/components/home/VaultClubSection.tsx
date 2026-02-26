import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Crown, Search, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const VaultClubSectionComponent = () => {
  const { t } = useTranslation();

  const features = [
    { icon: Search, title: t("vaultClub.personalizedCuration"), description: t("vaultClub.personalizedCurationDesc"), delay: 0.1 },
    { icon: Shield, title: t("vaultClub.vaultIdCert"), description: t("vaultClub.vaultIdCertDesc"), delay: 0.2 },
    { icon: Crown, title: t("vaultClub.accessLevels"), description: t("vaultClub.accessLevelsDesc"), delay: 0.3 },
  ];

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-background via-background to-secondary/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1 }} className="absolute top-[20%] left-0 w-24 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent origin-left" />
      <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 }} className="absolute bottom-[25%] right-0 w-32 h-px bg-gradient-to-l from-transparent via-primary/20 to-transparent origin-right" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 backdrop-blur-sm mb-6">
              <Lock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary tracking-wide">{t("vaultClub.badge")}</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-5 tracking-tight">{t("vaultClub.titlePlain")}</h2>
            <p className="text-muted-foreground text-base max-w-2xl mx-auto">{t("vaultClub.subtitle")}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-14">
            {features.map((feature) => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: feature.delay }} className="card-premium-gold p-6 text-center group">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/15 group-hover:shadow-[0_0_20px_hsl(45,100%,50%,0.15)] transition-all duration-300">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="text-center">
            <div className="inline-flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="btn-gold group">
                <Link to="/vault">
                  {t("vaultClub.meetVault")}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-primary/20 hover:bg-primary/5 hover:border-primary/40">
                <Link to="/vault/waitlist">{t("vaultClub.joinWaitlist")}</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">{t("vaultClub.inviteOnly")}</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export const VaultClubSection = memo(VaultClubSectionComponent);
