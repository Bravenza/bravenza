import { memo, forwardRef } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Instagram, MessageCircle } from "lucide-react";

const FooterComponent = forwardRef<HTMLElement>((_, ref) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer ref={ref} className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 sm:px-6 py-8 md:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Brand */}
          <div className="sm:col-span-2">
            <Logo size="sm" className="mb-3" />
            <p className="text-sm text-muted-foreground max-w-xs">
              Especialistas em importação de sneakers exclusivos. 
              Autenticidade garantida e rastreamento em tempo real.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Links Rápidos</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/solicitar" className="hover:text-primary transition-colors">
                  Solicitar Orçamento
                </Link>
              </li>
              <li>
                <Link to="/rastreio" className="hover:text-primary transition-colors">
                  Rastrear Pedido
                </Link>
              </li>
              <li>
                <Link to="/cliente/login" className="hover:text-primary transition-colors">
                  Minha Conta
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Contato</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a 
                  href="https://wa.me/5551983018897?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20a%20BRAVENZA." 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span>+55 51 98301-8897</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://www.instagram.com/bravenza.vault" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer"
                >
                  <Instagram className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span>@bravenza.vault</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-6 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center text-center gap-1 sm:flex-row sm:items-center sm:text-left sm:gap-3">
            <p className="text-sm text-muted-foreground">
              © 2022-{currentYear} BRAVENZA. Todos os direitos reservados.
            </p>
            <span className="text-border hidden sm:inline">·</span>
            <Link
              to="/admin/login"
              className="text-muted-foreground/60 hover:text-muted-foreground/80 transition-colors text-xs"
            >
              Admin
            </Link>
          </div>
          <div className="flex gap-5 text-sm text-muted-foreground">
            <Link to="/politicas" className="hover:text-primary transition-colors">
              Políticas
            </Link>
            <Link to="/termos" className="hover:text-primary transition-colors">
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
});

FooterComponent.displayName = "Footer";

// Memoized component
const MemoizedFooter = memo(FooterComponent);

// Named export for direct imports
export { MemoizedFooter as Footer };

// Default export for lazy loading compatibility
export default MemoizedFooter;
