import { forwardRef, memo } from "react";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const WHATSAPP_NUMBER = "5551983018897";
const WHATSAPP_MESSAGE = "Olá! Gostaria de saber mais sobre a BRAVENZA.";

const FloatingWhatsAppComponent = forwardRef<HTMLButtonElement>((_, ref) => {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.button
      ref={ref}
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Fale conosco no WhatsApp"
      type="button"
    >
      <MessageCircle className="h-7 w-7 fill-current" />
    </motion.button>
  );
});

FloatingWhatsAppComponent.displayName = "FloatingWhatsApp";

export const FloatingWhatsApp = memo(FloatingWhatsAppComponent);
