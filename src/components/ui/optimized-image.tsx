import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { FALLBACK_PLACEHOLDER } from "@/lib/image-utils";

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "loading" | "decoding"> {
  fallback?: string;
}

/**
 * Enterprise-grade image component with lazy loading, async decoding,
 * explicit dimensions for CLS prevention, graceful error fallback and fade-in transition.
 */
export function OptimizedImage({ className, fallback, alt, onError, width, height, ...props }: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <img
      {...props}
      alt={alt || ""}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={(e) => {
        setError(true);
        (e.currentTarget as HTMLImageElement).src = fallback || FALLBACK_PLACEHOLDER;
        onError?.(e);
      }}
      className={cn(
        "transition-opacity duration-300",
        loaded ? "opacity-100" : "opacity-0",
        className
      )}
    />
  );
}
