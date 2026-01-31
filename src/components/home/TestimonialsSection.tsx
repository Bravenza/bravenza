import { memo } from "react";
import { motion } from "framer-motion";
import { Star, Quote, Verified } from "lucide-react";
const testimonials = [{
  name: "Lucas M.",
  location: "São Paulo, SP",
  rating: 5,
  text: "Achei que era bom demais pra ser verdade. Paguei, fiquei com medo, mas o Jordan chegou perfeito. Original, caixa impecável, tudo documentado. Agora só compro com eles.",
  product: "Air Jordan 1 Retro High OG"
}, {
  name: "Fernanda S.",
  location: "Rio de Janeiro, RJ",
  rating: 5,
  text: "Atendimento absurdo de bom. Me mandaram foto do tênis na China, foto na inspeção, rastreio até em casa. Nunca vi algo assim. Estou no terceiro pedido já.",
  product: "Nike Dunk Low"
}, {
  name: "Ricardo P.",
  location: "Belo Horizonte, MG",
  rating: 5,
  text: "O Yeezy que eu queria não tinha em lugar nenhum do Brasil. Eles conseguiram na Europa e em 3 semanas estava na minha casa. Preço justo, tênis perfeito.",
  product: "Yeezy Boost 350 V2"
}];
const TestimonialsSectionComponent = () => {
  return <section className="py-14 md:py-20 relative">
      <div className="absolute inset-0 bg-gradient-gold-subtle opacity-20" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} transition={{
        duration: 0.6
      }} className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Quem comprou,{" "}
            <span className="text-gradient-gold">aprovou</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Histórias reais de clientes que confiaram e voltaram. Leia antes de decidir.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => <motion.div key={testimonial.name} initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.5,
          delay: Math.min(index * 0.1, 0.3)
        }} className="card-premium-gold p-6 md:p-8 relative">
              <Quote className="absolute top-6 right-6 h-8 w-8 text-primary/20" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({
              length: testimonial.rating
            }).map((_, i) => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}
              </div>

              {/* Quote */}
              <p className="text-foreground mb-6 leading-relaxed text-base">
                "{testimonial.text}"
              </p>

              {/* Product */}
              <div className="text-sm text-primary font-medium mb-4">
                {testimonial.product}
              </div>

              {/* Author */}
              <div className="border-t border-border pt-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.location}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-primary">
                  <Verified className="h-3.5 w-3.5" />
                  <span>Verificado</span>
                </div>
              </div>
            </motion.div>)}
        </div>
      </div>
    </section>;
};
export const TestimonialsSection = memo(TestimonialsSectionComponent);