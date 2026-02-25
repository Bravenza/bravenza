import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to handle PWA-specific behaviors and optimizations
 * for both iOS and Android standalone mode.
 */
export function usePWAOptimizations() {
  const location = useLocation();

  useEffect(() => {
    // Update theme-color meta tag based on route
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      if (location.pathname.startsWith('/admin')) {
        metaThemeColor.setAttribute('content', '#171717');
      } else {
        metaThemeColor.setAttribute('content', '#1f1f1f');
      }
    }

    // Scroll restoration is handled by ScrollToTop component — no duplicate scroll here
  }, [location.pathname]);

  // Pull-to-refresh is now handled by PullToRefresh component

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      document.documentElement.classList.add('pwa-standalone');
    }

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('pwa-standalone', e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Prevent iOS rubber-banding on body in standalone
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIOS) return;

    document.documentElement.style.setProperty('height', '100%');
    document.body.style.setProperty('height', '100%');
    document.body.style.setProperty('overflow', 'auto');
    document.body.style.setProperty('-webkit-overflow-scrolling', 'touch');

    return () => {
      document.documentElement.style.removeProperty('height');
      document.body.style.removeProperty('height');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('-webkit-overflow-scrolling');
    };
  }, []);
}
