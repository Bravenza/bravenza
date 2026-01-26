import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Lucas M.",
    location: "São Paulo, SP",
    rating: 5,
    text: "Procurei meu Jordan 1 por meses e a BRAVENZA encontrou em poucos dias. Produto original, embalagem perfeita. Super recomendo!",
    product: "Air Jordan 1 Retro High OG",
  },
  {
    name: "Fernanda S.",
    location: "Rio de Janeiro, RJ",
    rating: 5,
    text: "Primeiro pedido com eles e já virei cliente fiel. Atendimento impecável, transparência total no processo e entrega antes do prazo.",
    product: "Nike Dunk Low",
  },
  {
    name: "Ricardo P.",
    location: "Belo Horizonte, MG",
    rating: 5,
    text: "A inspeção que eles fazem antes de enviar é sensacional. Recebi fotos detalhadas do meu tênis antes de sair da Europa. Confiança total!",
    product: "Yeezy Boost 350 V2",
  },
];

export const TestimonialsSection = () => {
  return (
    <section className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-gradient-gold-subtle opacity-20" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            O que nossos clientes{" "}
            <span className="text-gradient-gold">dizem</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Histórias reais de clientes satisfeitos
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card-premium-gold p-8 relative"
            >
              <Quote className="absolute top-6 right-6 h-8 w-8 text-primary/20" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Product */}
              <div className="text-sm text-primary font-medium mb-4">
                {testimonial.product}
              </div>

              {/* Author */}
              <div className="border-t border-border pt-4">
                <div className="font-semibold">{testimonial.name}</div>
                <div className="text-sm text-muted-foreground">
                  {testimonial.location}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
