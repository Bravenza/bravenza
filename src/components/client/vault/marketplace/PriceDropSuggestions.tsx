import { useState, useEffect } from "react";
import { TrendingDown, AlertCircle, ArrowDown, Clock, Eye, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card className="border-border/30 shadow-sm">
        <CardContent className="py-14 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
            <TrendingDown className="h-7 w-7 text-muted-foreground/25" />
          </div>
          <h3 className="font-bold text-sm mb-1">Nenhuma sugestão no momento</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Quando seus anúncios ficarem sem vendas por muitos dias, sugeriremos ajustes de preço.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header info */}
      <div className="flex items-center gap-2.5 px-1">
        <div className="h-8 w-8 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-warning" />
        </div>
        <div>
          <p className="text-sm font-bold">
            {suggestions.length} sugestão{suggestions.length > 1 ? "ões" : ""}
          </p>
          <p className="text-[10px] text-muted-foreground">Ajuste preços para vender mais rápido</p>
        </div>
      </div>

      {suggestions.map((s, i) => {
        const dropPercent = Math.round(((s.current_price - s.suggested_price) / s.current_price) * 100);

        return (
          <motion.div
            key={s.listing_id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card className="border-border/30 shadow-sm hover:border-border/60 transition-colors overflow-hidden">
              <div className="h-0.5 bg-gradient-to-r from-warning/30 via-warning/15 to-transparent" />
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{s.title}</h4>
                    <div className="flex items-center gap-2.5 mt-2">
                      <span className="text-sm text-muted-foreground line-through">
                        {formatCurrency(s.current_price)}
                      </span>
                      <ArrowDown className="h-3 w-3 text-emerald-500" />
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(s.suggested_price)}
                      </span>
                      <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold">
                        -{dropPercent}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {s.days_listed} dias
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {s.views} views
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{s.reason}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleApply(s)}
                    disabled={applying === s.listing_id}
                    className="flex-shrink-0 rounded-full h-8 px-4 text-xs font-bold"
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
