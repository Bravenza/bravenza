import { useState, useEffect } from "react";
import { X, Download, Smartphone, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, isIOS, isStandalone, promptInstall, canPrompt } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem('pwa-banner-dismissed');
    if (wasDismissed) {
      const daysSinceDismiss = (Date.now() - new Date(wasDismissed).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) {
        setDismissed(true);
        return;
      }
    }

    const timer = setTimeout(() => {
      const shouldShow = (!isInstalled && !isStandalone) && (
        (isInstallable && canPrompt) || isIOS
      );
      if (shouldShow) {
        setShowBanner(true);
        // Trigger enter animation
        requestAnimationFrame(() => setVisible(true));
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isInstallable, canPrompt, isInstalled, isStandalone, isIOS]);

  const handleInstall = async () => {
    const result = await promptInstall();
    if (result.success) {
      setVisible(false);
      setTimeout(() => setShowBanner(false), 300);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-banner-dismissed', new Date().toISOString());
    setDismissed(true);
    setVisible(false);
    setTimeout(() => setShowBanner(false), 300);
  };

  if (dismissed || !showBanner) return null;

  return (
    <div
      className={`fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm transition-all duration-300 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"
      }`}
      style={{ paddingBottom: "var(--safe-area-bottom)" }}
    >
      <div className="bg-card border border-border shadow-2xl rounded-xl p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm">
              Instale o app BRAVENZA
            </h3>
            {isIOS ? (
              <p className="text-xs text-muted-foreground mt-1">
                Toque em <Share className="w-3 h-3 inline mx-0.5" /> e depois em "Adicionar à Tela de Início"
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Acesse mais rápido direto da sua tela inicial
              </p>
            )}
            {!isIOS && (
              <Button
                size="sm"
                onClick={handleInstall}
                className="mt-3 gap-1.5 h-8 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Instalar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
