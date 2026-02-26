import { memo, forwardRef } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Instagram, MessageCircle, ArrowUpRight, Shield, Truck, Award } from "lucide-react";
import { useTranslation } from "react-i18next";

const FooterComponent = forwardRef<HTMLElement>((_, ref) => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.requestQuote"), href: "/solicitar" },
    { label: t("nav.trackOrder"), href: "/rastreio" },
    { label: t("nav.authenticity"), href: "/sobre-autenticidade" },
    { label: t("footer.returnsLink"), href: "/trocas-devolucoes" },
    { label: t("footer.howToSell"), href: "/vender" },
    { label: t("nav.myAccount"), href: "/entrar" },
  ];

  const features = [
    { icon: Shield, label: t("footer.verifiedAuthenticity") },
    { icon: Truck, label: t("footer.safeDelivery") },
    { icon: Award, label: t("footer.fullWarranty") },
  ];

  return (
    <footer ref={ref} role="contentinfo" aria-label="Rodapé" className="relative border-t border-border/30 bg-card/30 overflow-hidden theme-dark">
      {/* Background elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 py-12 md:py-16 relative">
        {/* Features strip */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 mb-12 pb-12 border-b border-border/30">
          {features.map((feature) => (
            <div key={feature.label} className="flex items-center gap-2 text-muted-foreground">
              <feature.icon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{feature.label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          {/* Brand Column */}
          <div className="md:col-span-5">
            <Logo size="lg" className="mb-4" />
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-6">
              {t("footer.description")}
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3">
              <a 
                href="https://wa.me/5551981055425?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20a%20BRAVENZA." 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group flex items-center justify-center w-10 h-10 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300"
                aria-label={t("common.whatsappLabel")}
              >
                <MessageCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
              <a 
                href="https://www.instagram.com/bravenza.vault" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group flex items-center justify-center w-10 h-10 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300"
                aria-label={t("common.instagramLabel")}
              >
                <Instagram className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <h4 className="font-display font-semibold text-sm mb-4 text-foreground">{t("footer.navigation")}</h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href} 
                    className="group flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-200" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-4">
            <h4 className="font-display font-semibold text-sm mb-4 text-foreground">{t("footer.contact")}</h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://wa.me/5551981055425?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20a%20BRAVENZA." 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="group flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">WhatsApp</span>
                    <p className="text-sm font-medium text-foreground">51 98105.5425</p>
                  </div>
                </a>
              </li>
              <li>
                <a 
                  href="https://www.instagram.com/bravenza.vault" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="group flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                    <Instagram className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Instagram</span>
                    <p className="text-sm font-medium text-foreground">@bravenza.vault</p>
                  </div>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border/30 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <p className="text-muted-foreground text-xs">
              © 2022-{currentYear} BRAVENZA. {t("common.allRightsReserved")}
            </p>
            <Link 
              to="/admin/login" 
              className="text-muted-foreground/50 hover:text-muted-foreground text-xs transition-colors"
            >
              {t("common.admin")}
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs">
            <Link to="/politicas" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("footer.privacy")}
            </Link>
            <Link to="/termos" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("footer.terms")}
            </Link>
            <Link to="/trocas-devolucoes" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("footer.returnsLink")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
});

FooterComponent.displayName = "Footer";

const MemoizedFooter = memo(FooterComponent);

export { MemoizedFooter as Footer };
export default MemoizedFooter;
