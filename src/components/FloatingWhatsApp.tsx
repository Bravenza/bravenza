import { forwardRef, memo } from "react";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useSystemSettings } from "@/hooks/useSystemSettings";

const FloatingWhatsAppComponent = forwardRef<HTMLButtonElement>((_, ref) => {
  const { settings } = useSystemSettings();

  const whatsappUrl = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(settings.whatsapp_message)}`;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.button
      ref={ref}
      onClick={handleClick}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Fale conosco no WhatsApp"
      type="button"
    >
      <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 fill-current" />
    </motion.button>
  );
});

FloatingWhatsAppComponent.displayName = "FloatingWhatsApp";

export const FloatingWhatsApp = memo(FloatingWhatsAppComponent);
