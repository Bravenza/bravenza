import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setTimeout(() => {
        setVisible(false);
        setTimeout(() => setShowIndicator(false), 300);
      }, 2000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowIndicator(true);
      requestAnimationFrame(() => setVisible(true));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
      setShowIndicator(true);
      requestAnimationFrame(() => setVisible(true));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showIndicator) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-[100] py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2 transition-transform duration-300 ease-out ${
        visible ? 'translate-y-0' : '-translate-y-full'
      } ${
        isOffline
          ? 'bg-destructive text-destructive-foreground'
          : 'bg-green-500 text-white'
      }`}
      style={{ paddingTop: "calc(var(--safe-area-top) + 0.5rem)" }}
    >
      {isOffline ? (
        <>
          <WifiOff className="h-4 w-4" />
          Você está offline. Algumas funcionalidades podem estar limitadas.
        </>
      ) : (
        'Conexão restaurada!'
      )}
    </div>
  );
}
