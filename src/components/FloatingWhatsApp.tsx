import { memo } from "react";
import { MessageCircle } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";

const FloatingWhatsAppComponent = () => {
  const { settings } = useSystemSettings();

  const whatsappUrl = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(settings.whatsapp_message)}`;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer animate-whatsapp-pop"
      aria-label="Fale conosco no WhatsApp"
      type="button"
    >
      <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 fill-current" />
    </button>
  );
};

export const FloatingWhatsApp = memo(FloatingWhatsAppComponent);
