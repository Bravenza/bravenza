import { useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { marketplaceRequest } from "@/hooks/marketplace/api";

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
      const data = await marketplaceRequest("", "toggle-follow", "POST", { seller_id: sellerId });
      setFollowing(data.following);
      toast.success(data.following ? "Seguindo vendedor!" : "Deixou de seguir");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao seguir");
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
