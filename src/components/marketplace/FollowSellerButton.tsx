import { useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mk-hub`;

interface FollowSellerButtonProps {
  sellerId: string;
  initialFollowing?: boolean;
  size?: "sm" | "default";
  className?: string;
}

export function FollowSellerButton({ sellerId, initialFollowing = false, size = "sm", className }: FollowSellerButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
      const headers = await getMarketplaceHeaders();
      const res = await fetch(`${FUNCTION_URL}?action=toggle-follow`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ seller_id: sellerId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFollowing(data.following);
      toast.success(data.following ? "Seguindo vendedor!" : "Deixou de seguir");
    } catch (err: any) {
      toast.error(err.message || "Erro ao seguir");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={following ? "secondary" : "outline"}
      size={size}
      onClick={toggle}
      disabled={loading}
      className={cn("gap-1.5", className)}
    >
      {following ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
      {following ? "Seguindo" : "Seguir"}
    </Button>
  );
}
