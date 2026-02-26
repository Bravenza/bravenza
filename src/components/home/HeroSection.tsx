import { memo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Crown, Shield, Truck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const HeroSectionComponent = () => {
  const { t } = useTranslation();

  const trustItems = [
    { icon: Shield, label: t("hero.trustAuthenticity") },
    { icon: Truck, label: t("hero.trustTracking") },
    { icon: CreditCard, label: t("hero.trustInstallments") },
  ];

  return (
    <section className="relative min-h-[85vh] md:min-h-[95vh] flex items-center justify-center overflow-hidden bg-background" style={{ paddingTop: 'calc(60px + env(safe-area-inset-top, 0px))' }}>
      <div className="absolute inset-0 bg-grid-pattern opacity-40 hidden md:block" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-radial-glow" />
        <div className="absolute top-20 right-[20%] w-2 h-2 rounded-full bg-primary shadow-[0_0_40px_15px_hsl(45,100%,50%,0.2)] animate-hero-glow-1" />
        <div className="absolute bottom-40 left-[15%] w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_30px_10px_hsl(45,100%,50%,0.15)] animate-hero-glow-2" />
        <div className="absolute top-[25%] left-0 w-32 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent origin-left animate-hero-line-1" />
        <div className="absolute bottom-[30%] right-0 w-40 h-px bg-gradient-to-l from-transparent via-primary/20 to-transparent origin-right animate-hero-line-2" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-hero-fade-up" style={{ animationDelay: "0s" }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 backdrop-blur-sm mb-8">
              <Crown className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary tracking-wide">
                {t("hero.badge")}
              </span>
            </div>
          </div>

          <h1
            className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 tracking-tighter leading-[1.05] animate-hero-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            {t("hero.headline1")}
            <br />
            <span className="text-gradient-gold">{t("hero.headline2")}</span>{" "}
            <span className="text-muted-foreground font-normal">{t("hero.headline3")}</span>
          </h1>

          <p
            className="text-base md:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-hero-fade-up"
            style={{ animationDelay: "0.2s" }}
          >
            {t("hero.subheadlinePlain")}
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-hero-fade-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Link to="/solicitar">
              <Button size="xl" className="btn-gold w-full sm:w-auto group">
                {t("hero.ctaPrimary")}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/rastreio">
              <Button 
                variant="outline" 
                size="xl" 
                className="w-full sm:w-auto border-primary/20 hover:bg-primary/5 hover:border-primary/40"
              >
                {t("hero.ctaSecondary")}
              </Button>
            </Link>
          </div>

          <div
            className="grid grid-cols-3 gap-3 md:gap-6 max-w-xl mx-auto animate-hero-fade-up"
            style={{ animationDelay: "0.5s" }}
          >
            {trustItems.map((item, index) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-2 p-3 md:p-4 rounded-md bg-card/50 border border-border/50 backdrop-blur-sm animate-hero-fade-up"
                style={{ animationDelay: `${0.6 + index * 0.1}s` }}
              >
                <item.icon className="h-5 w-5 text-primary" />
                <span className="text-xs md:text-sm font-medium text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
};

export const HeroSection = memo(HeroSectionComponent);
