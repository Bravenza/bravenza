import { memo } from "react";
import { motion } from "framer-motion";
import { Gift, Users, Wallet, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ReferralSectionComponent = () => {
  const { t } = useTranslation();

  return (
    <section className="py-14 md:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
      
      <div className="container mx-auto px-4 sm:px-6 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary mb-6">
            <Gift className="h-4 w-4" />
            <span className="text-sm font-medium">{t("referral.badge")}</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 tracking-tight">{t("referral.titlePlain")}</h2>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto">{t("referral.subtitle")}</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto mb-10 md:mb-12">
          {[
            { icon: Gift, title: t("referral.step1Title"), desc: t("referral.step1Desc") },
            { icon: Users, title: t("referral.step2Title"), desc: t("referral.step2Desc") },
            { icon: Wallet, title: t("referral.step3Title"), desc: t("referral.step3Desc") },
          ].map((step, index) => (
            <motion.div key={step.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: Math.min(0.1 * (index + 1), 0.3) }} className="text-center p-4 md:p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <step.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }} className="card-premium p-6 md:p-8 max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-5xl md:text-6xl font-bold text-gradient-gold">5%</span>
            <span className="text-xl text-muted-foreground text-left">{t("referral.cashbackPercent")}</span>
          </div>
          <p className="text-muted-foreground mb-6 text-base">
            <strong className="text-foreground text-base">{t("referral.noLimit")}</strong> {t("referral.noLimitDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="gap-2 btn-gold">
              <Link to="/entrar">
                {t("referral.startReferring")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-primary/30">
              <Link to="/solicitar">{t("referral.firstOrder")}</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export const ReferralSection = memo(ReferralSectionComponent);
