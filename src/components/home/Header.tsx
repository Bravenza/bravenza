import { useState, useCallback, memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
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
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="transition-opacity hover:opacity-80">
            <Logo size="md" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => handleNavClick(link.href)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                  location.pathname === link.href 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/solicitar">
              <Button variant="premium" size="sm">
                Solicitar Orçamento
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-muted/50 transition-colors relative z-[60]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu - Outside header for proper stacking */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 top-16 z-[55] md:hidden overflow-y-auto bg-background"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link
                    to={link.href}
                    onClick={() => handleNavClick(link.href)}
                    className={`block text-base font-medium py-3 px-4 rounded-lg transition-colors duration-150 ${
                      location.pathname === link.href 
                        ? "text-primary bg-primary/10" 
                        : "text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <div className="border-t border-border/40 mt-4 pt-4 flex flex-col gap-3">
                <Link to="/solicitar" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="premium" className="w-full h-11 text-base">
                    Solicitar Orçamento
                  </Button>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const Header = memo(HeaderComponent);
