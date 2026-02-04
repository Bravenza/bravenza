import { useState, useCallback, memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Início", href: "/" },
  { label: "Autenticidade", href: "/sobre-autenticidade" },
  { label: "Rastrear Pedido", href: "/rastreio" },
  { label: "Minha Conta", href: "/cliente/login" },
] as const;

const HeaderComponent = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

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
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl">
        {/* Subtle gradient line at top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="transition-all duration-300 hover:opacity-80 hover:scale-105">
            <Logo size="md" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => handleNavClick(link.href)}
                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 group ${
                  location.pathname === link.href 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
                {/* Animated underline */}
                <span 
                  className={`absolute bottom-1 left-4 right-4 h-0.5 bg-gradient-to-r from-primary to-primary/50 rounded-full transition-transform duration-300 origin-left ${
                    location.pathname === link.href 
                      ? "scale-x-100" 
                      : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
                {/* Hover glow */}
                <span className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/solicitar">
              <Button variant="premium" size="sm" className="group relative overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">
                  Solicitar Orçamento
                  <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="md:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors relative z-[60]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {isMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-16 z-[55] md:hidden overflow-y-auto bg-background/95 backdrop-blur-xl"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-30" />
            
            <nav className="container mx-auto px-4 py-6 flex flex-col gap-2 relative">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={link.href}
                    onClick={() => handleNavClick(link.href)}
                    className={`flex items-center justify-between text-base font-medium py-4 px-4 rounded-xl transition-all duration-300 ${
                      location.pathname === link.href 
                        ? "text-primary bg-primary/10 border border-primary/20" 
                        : "text-foreground hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    <span>{link.label}</span>
                    <ChevronRight className={`h-4 w-4 transition-all duration-300 ${
                      location.pathname === link.href ? "text-primary" : "text-muted-foreground"
                    }`} />
                  </Link>
                </motion.div>
              ))}
              
              <motion.div 
                className="mt-6 pt-6 border-t border-border/50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Link to="/solicitar" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="premium" className="w-full h-12 text-base group">
                    <span className="flex items-center gap-2">
                      Solicitar Orçamento
                      <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </Button>
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const Header = memo(HeaderComponent);
