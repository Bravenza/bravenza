import { memo, useEffect, useState } from "react";
import { Eye, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialProofViewersProps {
  productId: string;
  baseViewers?: number;
  className?: string;
}

/**
 * Shows a "X people are viewing this right now" badge.
 * Uses a deterministic pseudo-random count based on product ID + time bucket
 * to create a consistent but dynamic-feeling number.
 */
function SocialProofViewersComponent({ productId, baseViewers, className }: SocialProofViewersProps) {
  const [viewers, setViewers] = useState(0);

  useEffect(() => {
    // Generate a consistent viewer count that changes every ~5 minutes
    const timeBucket = Math.floor(Date.now() / (5 * 60 * 1000));
    let hash = 0;
    const seed = productId + timeBucket;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
    }
    const base = baseViewers || 3;
    const count = base + (Math.abs(hash) % 12) + 1;
    setViewers(count);

    // Update every 30-90 seconds with slight variation
    const interval = setInterval(() => {
      setViewers((prev) => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.max(2, prev + delta);
      });
    }, 30000 + Math.random() * 60000);

    return () => clearInterval(interval);
  }, [productId, baseViewers]);

  if (viewers < 2) return null;

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500",
      className
    )}>
      <Eye className="h-3 w-3 animate-pulse" />
      <span className="text-[11px] font-semibold">
        {viewers} pessoa{viewers !== 1 ? "s" : ""} vendo agora
      </span>
    </div>
  );
}

export const SocialProofViewers = memo(SocialProofViewersComponent);
