import { useState, useEffect } from "react";
import { TrendingDown, AlertCircle, ArrowDown, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/constants";
import { motion } from "framer-motion";

interface PriceDropSuggestion {
  listing_id: string;
  title: string;
  current_price: number;
  suggested_price: number;
  days_listed: number;
  views: number;
  reason: string;
}

interface PriceDropSuggestionsProps {
  fetchSuggestions: () => Promise<PriceDropSuggestion[]>;
  onApplyDrop: (listingId: string, newPrice: number) => Promise<boolean>;
}

export function PriceDropSuggestions({ fetchSuggestions, onApplyDrop }: PriceDropSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<PriceDropSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions().then((data) => {
      setSuggestions(data);
      setIsLoading(false);
    });
  }, []);

  const handleApply = async (s: PriceDropSuggestion) => {
    setApplying(s.listing_id);
    const success = await onApplyDrop(s.listing_id, s.suggested_price);
    if (success) {
      setSuggestions((prev) => prev.filter((x) => x.listing_id !== s.listing_id));
    }
    setApplying(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card className="card-premium border-dashed">
        <CardContent className="py-10 text-center">
          <TrendingDown className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-20" />
          <h3 className="font-medium text-sm mb-1">Nenhuma sugestão no momento</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Quando seus anúncios ficarem sem vendas por muitos dias, sugeriremos ajustes de preço.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <AlertCircle className="h-4 w-4 text-amber-400" />
        <p className="text-xs text-muted-foreground">
          {suggestions.length} anúncio{suggestions.length > 1 ? "s" : ""} com sugestão de redução
        </p>
      </div>

      {suggestions.map((s, i) => {
        const dropPercent = Math.round(((s.current_price - s.suggested_price) / s.current_price) * 100);

        return (
          <motion.div
            key={s.listing_id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="card-premium">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{s.title}</h4>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-sm text-muted-foreground line-through">
                        {formatCurrency(s.current_price)}
                      </span>
                      <ArrowDown className="h-3 w-3 text-emerald-400" />
                      <span className="text-sm font-bold text-emerald-400">
                        {formatCurrency(s.suggested_price)}
                      </span>
                      <Badge variant="outline" className="text-[10px] border-emerald-400/30 text-emerald-400">
                        -{dropPercent}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {s.days_listed} dias
                      </span>
                      <span>{s.views} visualizações</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">{s.reason}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleApply(s)}
                    disabled={applying === s.listing_id}
                    className="flex-shrink-0"
                  >
                    {applying === s.listing_id ? "..." : "Aplicar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
