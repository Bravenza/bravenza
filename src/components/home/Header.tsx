import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ClipboardList } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const navLinks = [
  { label: "Início", href: "/" },
  { label: "Como Funciona", href: "/#como-funciona" },
  { label: "Rastrear Pedido", href: "/rastreio" },
  { label: "Minha Conta", href: "/cliente/login" },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const location = useLocation();

  // Fetch pending order requests count
  useEffect(() => {
    const fetchPendingRequests = async () => {
      const { count, error } = await supabase
        .from("order_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      
      if (!error && count !== null) {
        setPendingRequestsCount(count);
      }
    };

    fetchPendingRequests();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("order-requests-count")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_requests",
        },
        () => {
          fetchPendingRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleNavClick = (href: string) => {
    setIsMenuOpen(false);
    
    if (href.includes("#")) {
      const sectionId = href.split("#")[1];
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/">
            <Logo size="md" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => handleNavClick(link.href)}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === link.href ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/admin/login" className="relative">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ClipboardList className="h-4 w-4 mr-1" />
                Admin
              </Button>
              {pendingRequestsCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
                >
                  {pendingRequestsCount > 99 ? "99+" : pendingRequestsCount}
                </Badge>
              )}
            </Link>
            <Link to="/solicitar">
              <Button size="sm" className="btn-gold">
                Solicitar Orçamento
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 relative z-[60]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
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
            className="fixed inset-0 top-16 z-[55] md:hidden overflow-y-auto"
            style={{ backgroundColor: '#1f1f1f' }}
          >
            <nav className="container mx-auto px-4 py-6 flex flex-col gap-2">
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
                    className={`block text-lg font-medium py-3 px-4 rounded-lg transition-all ${
                      location.pathname === link.href 
                        ? "text-primary bg-primary/10" 
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <div className="border-t border-border mt-4 pt-4 flex flex-col gap-3">
                <Link to="/solicitar" onClick={() => setIsMenuOpen(false)}>
                  <Button className="btn-gold w-full h-12 text-base">
                    Solicitar Orçamento
                  </Button>
                </Link>
                <Link to="/admin/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full h-12 text-base">
                    Área Administrativa
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
