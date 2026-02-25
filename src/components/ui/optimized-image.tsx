import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "loading" | "decoding"> {
  fallback?: string;
}

/**
 * Enterprise-grade image component with lazy loading, async decoding,
 * graceful error fallback and fade-in transition.
 */
export function OptimizedImage({ className, fallback, alt, onError, ...props }: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <img
      {...props}
      alt={alt || ""}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={(e) => {
        setError(true);
        if (fallback) (e.currentTarget as HTMLImageElement).src = fallback;
        onError?.(e);
      }}
      className={cn(
        "transition-opacity duration-300",
        loaded ? "opacity-100" : "opacity-0",
        error && !fallback && "hidden",
        className
      )}
    />
  );
}
