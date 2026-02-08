import { Download, Smartphone, Check, Share, Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { usePWA } from "@/hooks/usePWA";
import { toast } from "sonner";

export default function InstallPage() {
  const { isInstallable, isInstalled, isIOS, isStandalone, promptInstall, canPrompt } = usePWA();

  const handleInstall = async () => {
    const result = await promptInstall();
    if (result.success) {
      toast.success("App instalado com sucesso!");
    } else if (result.outcome === 'dismissed') {
      toast.info("Instalação cancelada. Você pode instalar a qualquer momento.");
    }
  };

  const features = [
    "Acesso rápido pelo ícone na tela inicial",
    "Funciona mesmo sem internet",
    "Notificações de status do pedido",
    "Experiência de app nativo",
    "Carregamento ultra-rápido"
  ];

  if (isInstalled || isStandalone) {
    return (
      <PublicLayout>
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <div className="text-center max-w-md animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              App já instalado!
            </h1>
            <p className="text-muted-foreground mb-6">
              O BRAVENZA já está instalado no seu dispositivo. 
              Aproveite a experiência completa!
            </p>
            <Button asChild>
              <a href="/">Ir para o início</a>
            </Button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-[80vh] py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6 border border-primary/20">
              <Smartphone className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3">
              Instale o app BRAVENZA
            </h1>
            <p className="text-muted-foreground text-lg">
              Tenha acesso rápido a todos os recursos diretamente da sua tela inicial
            </p>
          </div>

          {/* Features */}
          <div className="mb-10 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6">
                <h2 className="font-semibold text-foreground mb-4">Benefícios do app</h2>
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Install Instructions */}
          <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
            {isIOS ? (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-6">
                  <h2 className="font-semibold text-foreground mb-4">
                    Como instalar no iPhone/iPad
                  </h2>
                  <ol className="space-y-4">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                        1
                      </span>
                      <div className="flex-1">
                        <p className="text-foreground font-medium">Abra no Safari</p>
                        <p className="text-muted-foreground text-sm mt-1">
                          Este recurso só funciona no navegador Safari
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                        2
                      </span>
                      <div className="flex-1">
                        <p className="text-foreground font-medium">Toque no botão de compartilhar</p>
                        <div className="flex items-center gap-2 mt-2 text-muted-foreground text-sm">
                          <Share className="w-5 h-5" />
                          <span>na barra inferior do Safari</span>
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                        3
                      </span>
                      <div className="flex-1">
                        <p className="text-foreground font-medium">Toque em "Adicionar à Tela de Início"</p>
                        <div className="flex items-center gap-2 mt-2 text-muted-foreground text-sm">
                          <Plus className="w-5 h-5" />
                          <span>Add to Home Screen</span>
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                        4
                      </span>
                      <div className="flex-1">
                        <p className="text-foreground font-medium">Confirme tocando em "Adicionar"</p>
                        <p className="text-muted-foreground text-sm mt-1">
                          O ícone do BRAVENZA aparecerá na sua tela inicial
                        </p>
                      </div>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            ) : canPrompt && isInstallable ? (
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-6 text-center">
                  <h2 className="font-semibold text-foreground mb-4">
                    Instalação rápida disponível
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Clique no botão abaixo para instalar o app em segundos
                  </p>
                  <Button
                    size="lg"
                    onClick={handleInstall}
                    className="gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Instalar BRAVENZA
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-6">
                  <h2 className="font-semibold text-foreground mb-4">
                    Como instalar no seu dispositivo
                  </h2>
                  <ol className="space-y-4">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                        1
                      </span>
                      <div className="flex-1">
                        <p className="text-foreground font-medium">Abra o menu do navegador</p>
                        <div className="flex items-center gap-2 mt-2 text-muted-foreground text-sm">
                          <MoreVertical className="w-5 h-5" />
                          <span>três pontos no canto superior direito</span>
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                        2
                      </span>
                      <div className="flex-1">
                        <p className="text-foreground font-medium">Procure por "Instalar app" ou "Adicionar à tela inicial"</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                        3
                      </span>
                      <div className="flex-1">
                        <p className="text-foreground font-medium">Confirme a instalação</p>
                        <p className="text-muted-foreground text-sm mt-1">
                          O ícone do BRAVENZA aparecerá na sua tela inicial
                        </p>
                      </div>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
