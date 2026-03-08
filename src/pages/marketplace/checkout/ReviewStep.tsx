import { useState } from "react";
import { Store, ChevronRight, Tag, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { CartGroup } from "@/hooks/useMarketplaceCart";
import { getMarketplaceHeaders } from "@/hooks/marketplace/api";
import { conditionLabel, fmt } from "./types";

export interface AppliedCoupon {
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  discount_amount: number;
}

interface ReviewStepProps {
  group: CartGroup;
  onNext: () => void;
  appliedCoupon?: AppliedCoupon | null;
  onApplyCoupon?: (coupon: AppliedCoupon | null) => void;
}

export function ReviewStep({ group, onNext, appliedCoupon, onApplyCoupon }: ReviewStepProps) {
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError(null);
    setIsValidating(true);

    try {
      const headers = await getMarketplaceHeaders();

      // Use the first item's listing_id to validate via backend (seller_id checked server-side)
      const firstListingId = (group.items[0]?.offer as any)?.listing_id;
      if (!firstListingId) {
        setCouponError("Erro interno: anúncio não encontrado");
        return;
      }

      const params = new URLSearchParams({ action: "validate-coupon" });
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mkv2-store?${params}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            code: couponCode.trim(),
            listing_id: firstListingId,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.valid) {
        setCouponError(data.reason || data.error || "Cupom inválido ou expirado");
        return;
      }

      const subtotal = group.subtotal;
      if (data.discount_type === "percent") {
        const discountAmount = Math.round((subtotal * data.discount_value) / 100 * 100) / 100;
        onApplyCoupon?.({
          code: couponCode.trim().toUpperCase(),
          discount_type: "percent",
          discount_value: data.discount_value,
          discount_amount: discountAmount,
        });
      } else {
        const discountAmount = Math.min(data.discount ?? data.discount_value, subtotal);
        onApplyCoupon?.({
          code: couponCode.trim().toUpperCase(),
          discount_type: "fixed",
          discount_value: data.discount_value,
          discount_amount: discountAmount,
        });
      }
    } catch {
      setCouponError("Erro ao validar cupom. Tente novamente.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    onApplyCoupon?.(null);
    setCouponCode("");
    setCouponError(null);
  };

  return (
    <div className="bg-background rounded-2xl border border-border/20 p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <Store className="h-5 w-5 text-primary" />
        <div>
          <h2 className="font-bold text-base">Revise seus itens</h2>
          <p className="text-xs text-muted-foreground">Vendedor: {group.sellerName}</p>
        </div>
      </div>

      <div className="space-y-3">
        {group.items.map((item) => {
          const offer = item.offer;
          if (!offer) return null;
          const name = offer.product ? `${offer.product.brand} ${offer.product.model}` : "Produto";
          const image = offer.photos?.[0] || offer.product?.images?.[0];
          return (
            <div key={item.id} className="flex gap-3.5 p-3 rounded-xl bg-secondary/30 border border-border/10">
              <div className="w-[72px] h-[72px] rounded-xl bg-white overflow-hidden shrink-0">
                {image ? (
                  <img src={image} alt={name} className="w-full h-full object-contain p-1.5" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl opacity-10">👟</div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <p className="text-sm font-semibold truncate">{name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-border/30">
                      Tam. {offer.size}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-border/30">
                      {conditionLabel[offer.condition] || offer.condition}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm font-bold text-primary">
                  R$ {fmt(offer.price)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Coupon section */}
      <div className="border border-border/20 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Tag className="h-4 w-4 text-primary" />
          Código de cupom
        </div>

        {appliedCoupon ? (
          <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-primary">
                {appliedCoupon.code}
              </p>
              <p className="text-xs text-muted-foreground">
                Desconto de R$ {fmt(appliedCoupon.discount_amount)}
                {appliedCoupon.discount_type === "percent" && ` (${appliedCoupon.discount_value}%)`}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRemoveCoupon} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Digite o código"
              value={couponCode}
              onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null); }}
              onKeyDown={e => e.key === "Enter" && handleApplyCoupon()}
              className="bg-secondary/30 border-border/40 h-10 text-sm uppercase"
            />
            <Button
              variant="outline"
              onClick={handleApplyCoupon}
              disabled={isValidating || !couponCode.trim()}
              className="h-10 px-4 shrink-0"
            >
              {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
            </Button>
          </div>
        )}

        {couponError && (
          <p className="text-xs text-destructive">{couponError}</p>
        )}
      </div>

      <Button onClick={onNext} className="w-full btn-gold gap-2 h-12 text-sm font-bold rounded-xl" size="lg">
        Continuar para endereço
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
