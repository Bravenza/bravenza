import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Keep showing for a bit to confirm connection restored
      setTimeout(() => setShowIndicator(false), 2000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setShowIndicator(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className={`fixed top-0 left-0 right-0 z-[100] py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2 ${
            isOffline 
              ? 'bg-destructive text-destructive-foreground' 
              : 'bg-green-500 text-white'
          }`}
        >
          {isOffline ? (
            <>
              <WifiOff className="h-4 w-4" />
              Você está offline. Algumas funcionalidades podem estar limitadas.
            </>
          ) : (
            <>
              Conexão restaurada!
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
