import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { type ReactNode } from "react";

/**
 * Wraps page content with a subtle fade+slide transition.
 * Premium feel without performance overhead.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
