import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to handle PWA-specific behaviors and optimizations
 */
export function usePWAOptimizations() {
  const location = useLocation();

  useEffect(() => {
    // Update theme-color meta tag based on route
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      // Admin routes get a slightly different theme color
      if (location.pathname.startsWith('/admin')) {
        metaThemeColor.setAttribute('content', '#171717');
      } else {
        metaThemeColor.setAttribute('content', '#1f1f1f');
      }
    }

    // Scroll to top on route change (PWA behavior)
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  useEffect(() => {
    // Prevent pull-to-refresh on touch devices when not at top
    let startY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      const isAtTop = window.scrollY === 0;
      const isPullingDown = y > startY;
      
      // Only prevent if at top and pulling down
      if (isAtTop && isPullingDown && e.cancelable) {
        // Don't prevent on elements that need scrolling
        const target = e.target as HTMLElement;
        if (target.closest('.scroll-area, [data-radix-scroll-area-viewport]')) {
          return;
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  useEffect(() => {
    // Handle standalone mode UI adjustments
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      document.documentElement.classList.add('pwa-standalone');
    }

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('pwa-standalone');
      } else {
        document.documentElement.classList.remove('pwa-standalone');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
}
