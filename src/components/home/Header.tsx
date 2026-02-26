import { useState, useCallback, memo, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const HeaderComponent = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.authenticity"), href: "/sobre-autenticidade" },
    { label: t("nav.trackOrder"), href: "/rastreio" },
    { label: t("nav.myAccount"), href: "/entrar" },
  ] as const;

  // Animate mount/unmount with CSS
  useEffect(() => {
    if (isMenuOpen) {
      setMenuMounted(true);
    } else {
      const t = setTimeout(() => setMenuMounted(false), 200);
      return () => clearTimeout(t);
    }
  }, [isMenuOpen]);

  const handleNavClick = useCallback((href: string) => {
    setIsMenuOpen(false);
    
    if (href.includes("#")) {
      const sectionId = href.split("#")[1];
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []);

  return (
    <>
        <header
          className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
          }}
          data-header-height
        >
          <div className="mx-auto px-3 pt-2 pb-2">
          <div className="pointer-events-auto theme-dark container mx-auto px-4 flex items-center justify-between rounded-2xl bg-background/80 backdrop-blur-2xl border border-border/40 shadow-xl shadow-black/20 ring-1 ring-white/5" style={{ height: '48px' }}>
          <Link to="/" className="transition-all duration-300 hover:opacity-80 hover:scale-105">
            <Logo size="md" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label={t("nav.mainNav")}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => handleNavClick(link.href)}
                aria-current={location.pathname === link.href ? "page" : undefined}
                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 group ${
                  location.pathname === link.href 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
                <span 
                  className={`absolute bottom-1 left-4 right-4 h-0.5 bg-gradient-to-r from-primary to-primary/50 rounded-full transition-transform duration-300 origin-left ${
                    location.pathname === link.href 
                      ? "scale-x-100" 
                      : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
                <span className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/solicitar">
              <Button variant="premium" size="sm" className="group relative overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">
                  {t("nav.requestQuote")}
                  <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors relative z-[60] active:scale-95"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        </div>
      </header>

      {/* Mobile Menu — CSS animated */}
      {menuMounted && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label={t("nav.mobileNav")}
          className={`fixed inset-0 z-[55] md:hidden overflow-y-auto bg-background transition-all duration-200 theme-dark ${
            isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          }`}
          style={{ top: 'calc(58px + env(safe-area-inset-top, 0px))' }}
        >
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
          
          <nav className="container mx-auto px-4 py-6 flex flex-col gap-2 relative" aria-label={t("nav.mobileMenu")}>
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => handleNavClick(link.href)}
                className={`flex items-center justify-between text-base font-medium py-4 px-4 rounded-xl transition-all duration-300 animate-hero-fade-up ${
                  location.pathname === link.href 
                    ? "text-primary bg-primary/10 border border-primary/20" 
                    : "text-foreground hover:bg-muted/50 border border-transparent"
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <span>{link.label}</span>
                <ChevronRight className={`h-4 w-4 transition-all duration-300 ${
                  location.pathname === link.href ? "text-primary" : "text-muted-foreground"
                }`} />
              </Link>
            ))}
            
            <div 
              className="mt-6 pt-6 border-t border-border/50 animate-hero-fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              <Link to="/solicitar" onClick={() => setIsMenuOpen(false)}>
                <Button variant="premium" className="w-full h-12 text-base group">
                  <span className="flex items-center gap-2">
                    {t("nav.requestQuote")}
                    <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
};

export const Header = memo(HeaderComponent);
