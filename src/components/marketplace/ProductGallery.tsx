import React, { useRef, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ChevronLeft, ChevronRight, ZoomIn, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProductGalleryProps {
  images: string[];
  selectedImage: number;
  onSelectImage: (index: number) => void;
  productName: string;
  isHighRisk?: boolean;
}

export function ProductGallery({ images, selectedImage, onSelectImage, productName, isHighRisk }: ProductGalleryProps) {
  const touchStartX = useRef<number | null>(null);
  const [direction, setDirection] = useState(0);
  const isMobile = useIsMobile();

  // Zoom state (desktop only — toggle mode)
  const [zoomEnabled, setZoomEnabled] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = (index: number) => {
    setDirection(index > selectedImage ? 1 : -1);
    onSelectImage(index);
  };

  const goPrev = () => goTo((selectedImage - 1 + images.length) % images.length);
  const goNext = () => goTo((selectedImage + 1) % images.length);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || !zoomEnabled || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }, [isMobile, zoomEnabled]);

  const toggleZoom = useCallback(() => {
    if (isMobile) return;
    setZoomEnabled(prev => !prev);
    setZoomPos({ x: 50, y: 50 });
  }, [isMobile]);

  return (
    <div className="space-y-4">
      {/* Main image - full width hero */}
      <div
        ref={containerRef}
        className={cn(
          "relative aspect-[4/3] rounded-2xl overflow-hidden bg-white border border-border/20 touch-pan-y group",
          !isMobile && zoomEnabled && "cursor-crosshair",
          !isMobile && !zoomEnabled && "cursor-default"
        )}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null || images.length <= 1) return;
          const diff = touchStartX.current - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 50) {
            diff > 0 ? goNext() : goPrev();
          }
          touchStartX.current = null;
        }}
        onMouseMove={handleMouseMove}
      >
        <div
          className="w-full h-full transition-transform duration-200 ease-out"
          style={zoomEnabled
            ? { transform: `scale(2.2)`, transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
            : { transform: `scale(1)`, transformOrigin: `50% 50%` }
          }
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.img
              key={selectedImage}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 40 }}
              transition={{ duration: 0.25 }}
              src={images[selectedImage]}
              alt={productName}
              className="w-full h-full object-contain p-2 md:p-4"
              loading="eager"
              draggable={false}
            />
          </AnimatePresence>
        </div>

        {/* Zoom toggle button (desktop) */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); toggleZoom(); }}
            className={cn(
              "absolute top-4 right-4 h-9 w-9 rounded-full backdrop-blur-md border transition-all z-10",
              zoomEnabled
                ? "bg-primary text-primary-foreground border-primary shadow-lg"
                : "bg-background/60 border-border/30 text-muted-foreground opacity-0 group-hover:opacity-100"
            )}
          >
            {zoomEnabled ? <X className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
          </Button>
        )}

        {isHighRisk && (
          <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground text-[10px] gap-1 font-bold uppercase tracking-wider">
            <ShieldCheck className="h-3 w-3" /> Autenticação recomendada
          </Badge>
        )}

        {/* Nav arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/60 backdrop-blur-md border border-border/30 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/60 backdrop-blur-md border border-border/30 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Dots indicator (always visible on mobile) */}
        {images.length > 1 && (
          <div className={cn(
            "absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5",
            !isMobile && "opacity-0 group-hover:opacity-100 transition-opacity"
          )}>
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  selectedImage === i
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-foreground/20 hover:bg-foreground/40"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all bg-white",
                selectedImage === i
                  ? "border-primary ring-1 ring-primary/30"
                  : "border-transparent opacity-50 hover:opacity-100"
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
