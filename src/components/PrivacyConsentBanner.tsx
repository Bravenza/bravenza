import { useState, useEffect, memo } from "react";
import { Link } from "react-router-dom";
import { Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const CONSENT_KEY = "bravenza_privacy_consent";
const CONSENT_VERSION = "1"; // Bump to re-show banner after policy changes

function PrivacyConsentBannerComponent() {
  const [visible, setVisible] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function checkConsent() {
      // 1. For authenticated users, check the database first
      if (user) {
        try {
          const { data } = await supabase
            .from("client_profiles")
            .select("privacy_consent_version")
            .eq("user_id", user.id)
            .maybeSingle();

          if (data?.privacy_consent_version === CONSENT_VERSION) {
            // Also sync to localStorage for offline/fast checks
            localStorage.setItem(CONSENT_KEY, CONSENT_VERSION);
            return; // Already consented
          }
        } catch {
          // DB check failed — fall through to localStorage
        }
      }

      // 2. Fallback to localStorage (anonymous users or DB failure)
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored === CONSENT_VERSION) return;

      // 3. Show banner after short delay
      if (!cancelled) {
        const t = setTimeout(() => {
          if (!cancelled) setVisible(true);
        }, 1500);
        return () => clearTimeout(t);
      }
    }

    checkConsent();
    return () => { cancelled = true; };
  }, [user]);

  const handleAccept = async () => {
    // Always store locally
    localStorage.setItem(CONSENT_KEY, CONSENT_VERSION);
    setVisible(false);

    // For authenticated users, persist to database
    if (user) {
      try {
        await supabase
          .from("client_profiles")
          .update({
            privacy_consent_version: CONSENT_VERSION,
            privacy_consent_at: new Date().toISOString(),
          } as any)
          .eq("user_id", user.id);
      } catch {
        // Non-critical — localStorage is the fallback
      }
    }
  };

  const handleDismiss = () => {
    // Dismiss without storing — will show again next session
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
          role="dialog"
          aria-label="Consentimento de privacidade"
        >
          <div className="max-w-lg mx-auto bg-card border border-border/50 rounded-2xl shadow-2xl p-4 md:p-5">
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground mb-1">
                  Sua privacidade importa
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Utilizamos dados essenciais para o funcionamento da plataforma, conforme a{" "}
                  <Link to="/politicas" className="text-primary hover:underline font-medium">
                    LGPD
                  </Link>
                  . Não compartilhamos seus dados com terceiros para publicidade.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={handleAccept}
                    className="h-8 px-4 text-xs font-semibold rounded-lg"
                  >
                    Entendi e aceito
                  </Button>
                  <Link to="/politicas">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-xs text-muted-foreground"
                    >
                      Saiba mais
                    </Button>
                  </Link>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="shrink-0 p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const PrivacyConsentBanner = memo(PrivacyConsentBannerComponent);