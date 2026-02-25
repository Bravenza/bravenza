import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";

export function BravenzaFullContact() {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Pronto para <span className="text-gradient-gold">começar?</span>
          </h2>
          <p className="text-foreground/60 mb-10 text-lg max-w-lg mx-auto">
            Solicite o serviço agora e comece a vender seus sneakers sem esforço. Nossa equipe está pronta para ajudar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/app/loja">
              <Button size="xl" className="btn-gold w-full sm:w-auto group text-base">
                Solicitar Bravenza Full
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <a
              href="https://wa.me/5551981055425?text=Ol%C3%A1%2C%20tenho%20interesse%20no%20Bravenza%20Full"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="xl" className="w-full sm:w-auto gap-2 text-base">
                <MessageCircle className="h-5 w-5" />
                Falar no WhatsApp
              </Button>
            </a>
          </div>

          <p className="text-foreground/50 text-sm mt-6">
            Sem compromisso. Sem taxas antecipadas. Você só paga quando vende.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
