import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isStandalone: boolean;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isIOS: false,
    isStandalone: false,
  });

  useEffect(() => {
    // Check if running as standalone (installed PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    // Check if iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
      !(window as Window & { MSStream?: unknown }).MSStream;

    // Check if already installed (localStorage flag)
    const isInstalled = localStorage.getItem('pwa-installed') === 'true' || isStandalone;

    setState(prev => ({
      ...prev,
      isIOS,
      isStandalone,
      isInstalled,
    }));

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setState(prev => ({ ...prev, isInstallable: true }));
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      localStorage.setItem('pwa-installed', 'true');
      setDeferredPrompt(null);
      setState(prev => ({
        ...prev,
        isInstallable: false,
        isInstalled: true,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return { success: false, reason: 'no-prompt' };
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        localStorage.setItem('pwa-installed', 'true');
        setDeferredPrompt(null);
        setState(prev => ({
          ...prev,
          isInstallable: false,
          isInstalled: true,
        }));
        return { success: true, outcome };
      }
      
      return { success: false, outcome };
    } catch (error) {
      console.error('Error prompting install:', error);
      return { success: false, reason: 'error' };
    }
  }, [deferredPrompt]);

  return {
    ...state,
    promptInstall,
    canPrompt: !!deferredPrompt,
  };
}
