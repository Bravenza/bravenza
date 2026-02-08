import { memo, useMemo } from "react";

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
  const duplicatedBrands = useMemo(() => [...brands, ...brands, ...brands], []);

  return (
    <section className="py-10 md:py-14 overflow-hidden bg-card/30">
      <div className="container mx-auto px-4 sm:px-6 mb-8 md:mb-10">
        <div className="text-center">
          <h2 className="md:text-3xl font-bold mb-4 text-3xl">
            As marcas mais <span className="text-gradient-gold text-3xl">desejadas do mundo</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base">
            Curadoria das marcas mais desejadas. Se existe, nós encontramos para você.
          </p>
        </div>
      </div>

      {/* Infinite scrolling carousel — pure CSS */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
        
        <div className="flex gap-8 items-center animate-brands-scroll">
          {duplicatedBrands.map((brand, index) => (
            <div key={`${brand.name}-${index}`} className="flex-shrink-0 group">
              <div className="px-8 py-4 rounded-xl bg-card/50 border border-border/50 transition-all duration-300 group-hover:border-primary/50 group-hover:bg-card group-hover:shadow-lg group-hover:shadow-primary/10">
                <span className="text-lg md:text-xl font-bold text-muted-foreground group-hover:text-primary transition-colors whitespace-nowrap tracking-wide">
                  {brand.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const BrandsCarousel = memo(BrandsCarouselComponent);
