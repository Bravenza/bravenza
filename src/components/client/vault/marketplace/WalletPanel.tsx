import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Wallet, ArrowUpRight, ArrowDownRight, Clock, RefreshCw, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { marketplaceRequest } from "@/hooks/marketplace/api";

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  reference_type: string | null;
  created_at: string;
}

interface WalletData {
  balance: number;
  transactions: WalletTransaction[];
}

const TYPE_CONFIG: Record<string, { icon: typeof ArrowUpRight; color: string; label: string }> = {
  sale_credit: { icon: ArrowUpRight, color: "text-emerald-500", label: "Venda" },
  payout: { icon: ArrowDownRight, color: "text-destructive", label: "Saque" },
  purchase: { icon: ArrowDownRight, color: "text-blue-500", label: "Compra" },
  refund: { icon: ArrowUpRight, color: "text-warning", label: "Estorno" },
};

interface WalletPanelProps {
  clientCpf: string;
}

export function WalletPanel({ clientCpf }: WalletPanelProps) {
  const [data, setData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await marketplaceRequest(clientCpf, "wallet-balance");
      setData(res);
    } catch (err) {
      console.error("Wallet fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [clientCpf]);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  const balance = data?.balance ?? 0;
  const transactions = data?.transactions ?? [];

  return (
    <div className="space-y-4">
      {/* Balance Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="card-premium bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo disponível</p>
                  <p className="text-2xl font-black tracking-tight">{formatCurrency(balance)}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={fetchWallet} className="h-8 w-8">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            {balance > 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Use seu saldo para comprar no marketplace sem taxas adicionais
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions */}
      <Card className="card-premium">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Extrato
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma transação ainda</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Seus créditos de vendas aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx, i) => {
                const config = TYPE_CONFIG[tx.type] || { icon: DollarSign, color: "text-muted-foreground", label: tx.type };
                const Icon = config.icon;
                const isCredit = tx.amount > 0;
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0"
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isCredit ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(tx.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${isCredit ? "text-emerald-500" : "text-destructive"}`}>
                        {isCredit ? "+" : ""}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Saldo: {formatCurrency(tx.balance_after)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
