import { memo } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Instagram, MessageCircle } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Logo size="md" className="mb-4" />
            <p className="text-muted-foreground max-w-sm">
              Especialistas em importação de sneakers exclusivos. 
              Autenticidade garantida e rastreamento em tempo real.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2 text-muted-foreground">
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
            <h4 className="font-semibold mb-4">Contato</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span>WhatsApp</span>
              </li>
              <li>
                <a 
                  href="https://www.instagram.com/bravenza.vault" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Instagram className="h-4 w-4 text-primary" />
                  <span>@bravenza.vault</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2022-{currentYear} BRAVENZA. Todos os direitos reservados.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
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
};

// Named export for direct imports
export { Footer };

// Default export for lazy loading compatibility
export default memo(Footer);
