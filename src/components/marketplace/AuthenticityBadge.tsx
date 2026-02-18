import { cn } from "@/lib/utils";
import { Fingerprint } from "lucide-react";
import { motion } from "framer-motion";

export function AuthenticityBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
      className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-sm"
    >
      {/* Animated pulse ring */}
      <span className="absolute inset-0 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] bg-primary/10" />
      
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Fingerprint className="h-4 w-4 text-primary" />
      </motion.div>
      <span className="text-[11px] font-bold text-primary uppercase tracking-wider relative z-10">
        100% Autenticado
      </span>
    </motion.div>
  );
}
