import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";

export function BravenzaFullContact() {
  return (
    <section className="py-16 md:py-24 bg-card/30">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Ainda tem <span className="text-gradient-gold">dúvidas?</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Entre em contato com nossa equipe pelo WhatsApp ou comece agora mesmo a vender seus sneakers sem esforço.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/5551981055425?text=Ol%C3%A1%2C%20tenho%20interesse%20no%20Bravenza%20Full"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                <MessageCircle className="h-4 w-4" />
                Falar no WhatsApp
              </Button>
            </a>
            <Link to="/app/loja">
              <Button size="lg" className="btn-gold w-full sm:w-auto group">
                Começar agora
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
