import { useState, useEffect } from "react";
import { Tag, Copy, Check } from "lucide-react";
import { getMarketplaceHeaders } from "@/hooks/marketplace/api";
import { cn } from "@/lib/utils";

interface Coupon {
  code: string;
  discount_type: string;
  discount_value: number;
  min_purchase: number | null;
  valid_until: string | null;
}

interface FloatingCouponBadgeProps {
  productId: string;
}

export function FloatingCouponBadge({ productId }: FloatingCouponBadgeProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const h = await getMarketplaceHeaders();
        const params = new URLSearchParams({ action: "product-coupons", product_id: productId });
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mkv2-discover?${params}`, { headers: h });
        const data = await res.json();
        setCoupons(data.coupons || []);
      } catch {
        setCoupons([]);
      }
    };
    fetchCoupons();
  }, [productId]);

  if (coupons.length === 0) return null;

  const bestCoupon = coupons[0];
  const discountText = bestCoupon.discount_type === "percent"
    ? `${bestCoupon.discount_value}% OFF`
    : `R$ ${bestCoupon.discount_value} OFF`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bestCoupon.code);
    setCopied(bestCoupon.code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
        "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15",
        "cursor-pointer"
      )}
    >
      <Tag className="h-3.5 w-3.5" />
      <span className="uppercase tracking-wider">{bestCoupon.code}</span>
      <span className="text-primary/70">·</span>
      <span>{discountText}</span>
      {copied === bestCoupon.code ? (
        <Check className="h-3 w-3 text-emerald-500" />
      ) : (
        <Copy className="h-3 w-3 opacity-50" />
      )}
    </button>
  );
}
