import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Wallet, ArrowDownRight, ArrowUpRight, Clock, RefreshCw, DollarSign,
  TrendingUp, Lock, Unlock, Plus, Trash2, Edit, CreditCard, ArrowLeft,
  AlertTriangle, CheckCircle, Loader2, Ban, Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useNavigate, useOutletContext } from "react-router-dom";
import { marketplaceRequest } from "@/hooks/marketplace/api";

interface PixAccount {
  id: string;
  pix_key_type: string;
  pix_key: string;
  beneficiary_name: string;
  bank_name: string;
  is_default: boolean;
  created_at: string;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  pix_key: string;
  pix_key_type: string;
  beneficiary_name: string;
  bank_name: string;
  admin_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  completed_at: string | null;
}

interface BalanceData {
  released: number;
  pending: number;
  total_earned: number;
  payouts_total: number;
  payouts: Payout[];
}

const PIX_TYPE_LABELS: Record<string, string> = {
  cpf: "CPF", cnpj: "CNPJ", email: "E-mail", phone: "Telefone", random: "Chave aleatória",
};

const PAYOUT_STATUS: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  requested: { label: "Solicitado", color: "text-warning", icon: Clock },
  processing: { label: "Processando", color: "text-blue-500", icon: Loader2 },
  completed: { label: "Pago", color: "text-emerald-500", icon: CheckCircle },
  rejected: { label: "Rejeitado", color: "text-destructive", icon: Ban },
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function SellerWalletPage() {
  const navigate = useNavigate();
  const context = useOutletContext<{ cpf?: string }>();
  const cpf = context?.cpf || "";

  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [pixAccounts, setPixAccounts] = useState<PixAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Payout dialog
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  // PIX dialog
  const [pixOpen, setPixOpen] = useState(false);
  const [editingPix, setEditingPix] = useState<PixAccount | null>(null);
  const [pixForm, setPixForm] = useState({ pix_key_type: "cpf", pix_key: "", beneficiary_name: "", bank_name: "" });
  const [pixSubmitting, setPixSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!cpf) return;
    setLoading(true);
    try {
      const [balRes, pixRes] = await Promise.all([
        marketplaceRequest(cpf, "seller-balance"),
        marketplaceRequest(cpf, "pix-accounts"),
      ]);
      setBalance(balRes);
      setPixAccounts(pixRes.accounts || []);
    } catch (err) {
      console.error("Wallet fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [cpf]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Payout ──
  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount.replace(",", "."));
    if (!amount || amount <= 0) { toast.error("Valor inválido"); return; }
    if (balance && amount > balance.released) { toast.error(`Saldo insuficiente. Disponível: ${fmt(balance.released)}`); return; }
    setPayoutSubmitting(true);
    try {
      await marketplaceRequest(cpf, "request-payout", "POST", { amount });
      toast.success("Saque solicitado com sucesso!");
      setPayoutOpen(false);
      setPayoutAmount("");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Erro ao solicitar saque");
    } finally {
      setPayoutSubmitting(false);
    }
  };

  // ── PIX ──
  const openPixDialog = (pix?: PixAccount) => {
    if (pix) {
      setEditingPix(pix);
      setPixForm({ pix_key_type: pix.pix_key_type, pix_key: pix.pix_key, beneficiary_name: pix.beneficiary_name, bank_name: pix.bank_name });
    } else {
      setEditingPix(null);
      setPixForm({ pix_key_type: "cpf", pix_key: "", beneficiary_name: "", bank_name: "" });
    }
    setPixOpen(true);
  };

  const handleSavePix = async () => {
    if (!pixForm.pix_key || !pixForm.beneficiary_name || !pixForm.bank_name) { toast.error("Preencha todos os campos"); return; }
    setPixSubmitting(true);
    try {
      await marketplaceRequest(cpf, "save-pix", "POST", { ...pixForm, id: editingPix?.id });
      toast.success(editingPix ? "Conta atualizada!" : "Conta PIX cadastrada!");
      setPixOpen(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar conta PIX");
    } finally {
      setPixSubmitting(false);
    }
  };

  const handleDeletePix = async (pixId: string) => {
    if (!confirm("Deseja remover esta conta PIX?")) return;
    try {
      await marketplaceRequest(cpf, "delete-pix", "DELETE", undefined, { pix_id: pixId });
      toast.success("Conta PIX removida");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover");
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  const released = balance?.released ?? 0;
  const pending = balance?.pending ?? 0;
  const payouts = balance?.payouts ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4 pb-24">
      {/* Back */}
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
        <button onClick={() => navigate("/app/loja")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar para Minha Loja
        </button>
      </motion.div>

      {/* Title */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-black tracking-tight">Saldo & Saques</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie seus ganhos e contas para recebimento</p>
      </motion.div>

      {/* Balance Cards */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 gap-3">
        {/* Released */}
        <Card className="card-premium bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Unlock className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">Saldo liberado</p>
            </div>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{fmt(released)}</p>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card className="card-premium bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-warning/20 flex items-center justify-center">
                <Lock className="h-4 w-4 text-warning" />
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">A liberar</p>
            </div>
            <p className="text-lg font-black text-warning">{fmt(pending)}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 flex gap-2">
            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong className="text-foreground">Como funciona a liberação?</strong></p>
              <p>O saldo é liberado quando o comprador confirma o recebimento do produto ou automaticamente após 7 dias úteis da entrega (proteção ao comprador).</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Withdraw button */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Button
          className="w-full h-12 font-bold btn-gold"
          disabled={released <= 0 || pixAccounts.length === 0}
          onClick={() => setPayoutOpen(true)}
        >
          <DollarSign className="h-4 w-4" /> Solicitar saque
        </Button>
        {pixAccounts.length === 0 && released > 0 && (
          <p className="text-xs text-destructive mt-1 text-center">Cadastre uma conta PIX para solicitar saques</p>
        )}
      </motion.div>

      {/* PIX Accounts */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="card-premium">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Contas PIX
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => openPixDialog()}>
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pixAccounts.length === 0 ? (
              <div className="text-center py-6">
                <CreditCard className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma conta PIX cadastrada</p>
                <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={() => openPixDialog()}>
                  <Plus className="h-3.5 w-3.5" /> Cadastrar conta PIX
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {pixAccounts.map((pix) => (
                  <div key={pix.id} className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pix.beneficiary_name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {PIX_TYPE_LABELS[pix.pix_key_type] || pix.pix_key_type}: {pix.pix_key} · {pix.bank_name}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openPixDialog(pix)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeletePix(pix.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Payout History */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="card-premium">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Histórico de saques
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <div className="text-center py-6">
                <DollarSign className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum saque solicitado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {payouts.map((p, i) => {
                  const st = PAYOUT_STATUS[p.status] || PAYOUT_STATUS.requested;
                  const Icon = st.icon;
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0"
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${p.status === "completed" ? "bg-emerald-500/10" : p.status === "rejected" ? "bg-destructive/10" : "bg-warning/10"}`}>
                        <Icon className={`h-4 w-4 ${st.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Saque via PIX</p>
                        <p className="text-[10px] text-muted-foreground">{fmtDate(p.created_at)}</p>
                        {p.rejection_reason && (
                          <p className="text-[10px] text-destructive mt-0.5">{p.rejection_reason}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-destructive">-{fmt(p.amount)}</p>
                        <Badge variant="outline" className={`text-[10px] ${st.color} border-current/30`}>{st.label}</Badge>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Payout Dialog ── */}
      <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Solicitar saque
            </DialogTitle>
            <DialogDescription>
              Disponível: <strong className="text-emerald-600 dark:text-emerald-400">{fmt(released)}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="payoutAmount">Valor do saque *</Label>
              <Input
                id="payoutAmount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
              />
            </div>
            {pixAccounts.length > 0 && (
              <Card className="bg-muted/50 border-border/40">
                <CardContent className="p-3 text-xs">
                  <p className="font-medium">Conta de destino</p>
                  <p className="text-muted-foreground mt-1">
                    {pixAccounts[0].beneficiary_name} · {PIX_TYPE_LABELS[pixAccounts[0].pix_key_type]}: {pixAccounts[0].pix_key} · {pixAccounts[0].bank_name}
                  </p>
                </CardContent>
              </Card>
            )}
            <Button
              className="w-full btn-gold"
              disabled={payoutSubmitting || !payoutAmount}
              onClick={handleRequestPayout}
            >
              {payoutSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar saque"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── PIX Dialog ── */}
      <Dialog open={pixOpen} onOpenChange={setPixOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingPix ? "Editar conta PIX" : "Nova conta PIX"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tipo de chave PIX *</Label>
              <Select value={pixForm.pix_key_type} onValueChange={(v) => setPixForm(f => ({ ...f, pix_key_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="phone">Telefone</SelectItem>
                  <SelectItem value="random">Chave aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pixKey">Chave PIX *</Label>
              <Input id="pixKey" value={pixForm.pix_key} onChange={(e) => setPixForm(f => ({ ...f, pix_key: e.target.value }))} placeholder="Sua chave PIX" />
            </div>
            <div>
              <Label htmlFor="pixBenef">Beneficiário *</Label>
              <Input id="pixBenef" value={pixForm.beneficiary_name} onChange={(e) => setPixForm(f => ({ ...f, beneficiary_name: e.target.value }))} placeholder="Nome do titular" />
            </div>
            <div>
              <Label htmlFor="pixBank">Banco *</Label>
              <Input id="pixBank" value={pixForm.bank_name} onChange={(e) => setPixForm(f => ({ ...f, bank_name: e.target.value }))} placeholder="Ex: Nubank, Itaú..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPixOpen(false)}>Cancelar</Button>
            <Button className="btn-gold" disabled={pixSubmitting} onClick={handleSavePix}>
              {pixSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
