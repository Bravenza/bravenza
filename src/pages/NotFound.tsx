import { Link } from "react-router-dom";
import { Home, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link to="/">
            <Logo size="md" />
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <p className="text-xl text-muted-foreground mb-8">Página não encontrada</p>
          <Link to="/">
            <Button className="btn-gold">
              <Home className="mr-2 h-4 w-4" />
              Voltar ao início
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
