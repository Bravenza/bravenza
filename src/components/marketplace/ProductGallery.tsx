import React, { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  selectedImage: number;
  onSelectImage: (index: number) => void;
  productName: string;
  isHighRisk?: boolean;
}

export function ProductGallery({ images, selectedImage, onSelectImage, productName, isHighRisk }: ProductGalleryProps) {
  const touchStartX = useRef<number | null>(null);

  return (
    <div className="space-y-3 order-first lg:order-last">
      <div
        className="relative aspect-square rounded-2xl overflow-hidden bg-muted/20 border border-border/30 touch-pan-y"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null || images.length <= 1) return;
          const diff = touchStartX.current - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 50) {
            onSelectImage(diff > 0 ? (selectedImage + 1) % images.length : (selectedImage - 1 + images.length) % images.length);
          }
          touchStartX.current = null;
        }}
      >
        <img
          src={images[selectedImage]}
          alt={productName}
          className="w-full h-full object-contain p-4"
          loading="eager"
        />
        {isHighRisk && (
          <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-[10px] gap-1">
            <ShieldCheck className="h-3 w-3" /> Autenticação recomendada
          </Badge>
        )}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => onSelectImage(i)}
              className={cn(
                "aspect-square rounded-lg overflow-hidden border-2 transition-all bg-muted/10",
                selectedImage === i ? "border-primary ring-1 ring-primary/30" : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <img src={img} alt="" className="w-full h-full object-contain p-1" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
