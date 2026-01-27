import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, isStandalone, promptInstall, canPrompt } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner before
    const wasDismissed = localStorage.getItem('pwa-banner-dismissed');
    if (wasDismissed) {
      const dismissedAt = new Date(wasDismissed);
      const now = new Date();
      const daysSinceDismiss = (now.getTime() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);
      
      // Show again after 7 days
      if (daysSinceDismiss < 7) {
        setDismissed(true);
        return;
      }
    }

    // Show banner after 5 seconds if installable
    const timer = setTimeout(() => {
      if (isInstallable && canPrompt && !isInstalled && !isStandalone) {
        setShowBanner(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isInstallable, canPrompt, isInstalled, isStandalone]);

  const handleInstall = async () => {
    const result = await promptInstall();
    if (result.success) {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-banner-dismissed', new Date().toISOString());
    setDismissed(true);
    setShowBanner(false);
  };

  if (dismissed || !showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm"
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
              <p className="text-xs text-muted-foreground mt-1">
                Acesse mais rápido direto da sua tela inicial
              </p>
              <Button 
                size="sm" 
                onClick={handleInstall}
                className="mt-3 gap-1.5 h-8 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Instalar
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
