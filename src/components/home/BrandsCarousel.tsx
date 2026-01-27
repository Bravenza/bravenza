import { memo, useMemo } from "react";
import { motion } from "framer-motion";

const brands = [
  { name: "Nike" },
  { name: "Adidas" },
  { name: "Jordan" },
  { name: "New Balance" },
  { name: "Puma" },
  { name: "Asics" },
  { name: "Converse" },
  { name: "Yeezy" },
  { name: "Vans" },
  { name: "Reebok" },
];

const BrandsCarouselComponent = () => {
  // Memoize duplicated brands to prevent recalculation on re-renders
  const duplicatedBrands = useMemo(() => [...brands, ...brands, ...brands], []);

  return (
    <section className="py-12 md:py-16 overflow-hidden bg-card/30">
      <div className="container mx-auto px-4 sm:px-6 mb-8 md:mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            As marcas mais <span className="text-gradient-gold">desejadas do mundo</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Acesso direto às coleções internacionais. Se existe, nós conseguimos trazer para você.
          </p>
        </motion.div>
      </div>

      {/* Infinite scrolling carousel */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
        
        <motion.div
          className="flex gap-8 items-center"
          animate={{
            x: [0, -150 * brands.length],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 25,
              ease: "linear",
            },
          }}
        >
          {duplicatedBrands.map((brand, index) => (
            <div
              key={`${brand.name}-${index}`}
              className="flex-shrink-0 group"
            >
              <div className="px-8 py-4 rounded-xl bg-card/50 border border-border/50 transition-all duration-300 group-hover:border-primary/50 group-hover:bg-card group-hover:shadow-lg group-hover:shadow-primary/10">
                <span className="text-lg md:text-xl font-bold text-muted-foreground group-hover:text-primary transition-colors whitespace-nowrap tracking-wide">
                  {brand.name}
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export const BrandsCarousel = memo(BrandsCarouselComponent);
