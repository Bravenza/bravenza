import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, DollarSign, Lock, Unlock, Plus, Trash2, Edit,
  CreditCard, Clock, CheckCircle, Loader2, Ban, Info, ArrowDownLeft,
  Wallet, TrendingUp, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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

const PAYOUT_STATUS: Record<string, { label: string; color: string; bgClass: string; icon: typeof CheckCircle }> = {
  requested: { label: "Solicitado", color: "text-warning", bgClass: "bg-warning/10", icon: Clock },
  processing: { label: "Processando", color: "text-blue-500", bgClass: "bg-blue-500/10", icon: Loader2 },
  completed: { label: "Pago", color: "text-emerald-500", bgClass: "bg-emerald-500/10", icon: CheckCircle },
  rejected: { label: "Rejeitado", color: "text-destructive", bgClass: "bg-destructive/10", icon: Ban },
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } } };

export default function SellerWalletPage() {
  const navigate = useNavigate();
  const context = useOutletContext<{ cpf?: string }>();
  const cpf = context?.cpf || "";

  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [pixAccounts, setPixAccounts] = useState<PixAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  const [pixOpen, setPixOpen] = useState(false);
  const [editingPix, setEditingPix] = useState<PixAccount | null>(null);
  const [pixForm, setPixForm] = useState({ pix_key_type: "cpf", pix_key: "", beneficiary_name: "", bank_name: "" });
  const [pixSubmitting, setPixSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!cpf) { setLoading(false); return; }
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao solicitar saque");
    } finally {
      setPayoutSubmitting(false);
    }
  };

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
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-44 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  const released = balance?.released ?? 0;
  const pending = balance?.pending ?? 0;
  const totalEarned = balance?.total_earned ?? 0;
  const payouts = balance?.payouts ?? [];

  return (
    <motion.div
      className="max-w-2xl mx-auto px-4 py-5 space-y-5 pb-28"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <button onClick={() => navigate("/app/loja")} className="h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Carteira
          </h1>
          <p className="text-xs text-muted-foreground">Gerencie seus ganhos e recebimentos</p>
        </div>
      </motion.div>

      {/* Hero Balance Card */}
      <motion.div variants={fadeUp}>
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-lg shadow-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saldo total</p>
              <div className="h-10 w-10 rounded-2xl bg-primary/15 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-black tracking-tight">{fmt(released + pending)}</p>
            {totalEarned > 0 && (
              <p className="text-[11px] text-muted-foreground mt-1">Total acumulado: {fmt(totalEarned)}</p>
            )}

            {/* Mini breakdown */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="bg-background/60 backdrop-blur-sm rounded-xl p-3 border border-border/40">
                <div className="flex items-center gap-1.5 mb-1">
                  <Unlock className="h-3 w-3 text-emerald-500" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Liberado</span>
                </div>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400">{fmt(released)}</p>
              </div>
              <div className="bg-background/60 backdrop-blur-sm rounded-xl p-3 border border-border/40">
                <div className="flex items-center gap-1.5 mb-1">
                  <Lock className="h-3 w-3 text-warning" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">A liberar</span>
                </div>
                <p className="text-base font-black text-warning">{fmt(pending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info banner */}
      <motion.div variants={fadeUp}>
        <div className="flex gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/30">
          <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="text-[11px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Como funciona?</span> O saldo é liberado quando o comprador confirma o recebimento ou automaticamente após 7 dias úteis da entrega.
          </div>
        </div>
      </motion.div>

      {/* Withdraw CTA */}
      <motion.div variants={fadeUp}>
        <Button
          className="w-full h-12 font-bold text-sm btn-gold rounded-xl gap-2 shadow-md"
          disabled={released <= 0 || pixAccounts.length === 0}
          onClick={() => setPayoutOpen(true)}
        >
          <ArrowDownLeft className="h-4 w-4" /> Solicitar saque · {fmt(released)}
        </Button>
        {pixAccounts.length === 0 && released > 0 && (
          <p className="text-[11px] text-destructive mt-1.5 text-center">Cadastre uma conta PIX para solicitar saques</p>
        )}
      </motion.div>

      {/* PIX Accounts */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-3.5 w-3.5 text-primary" />
                </div>
                Contas PIX
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-primary hover:text-primary" onClick={() => openPixDialog()}>
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {pixAccounts.length === 0 ? (
              <div className="text-center py-8">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
                  <CreditCard className="h-6 w-6 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Nenhuma conta cadastrada</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">Adicione uma chave PIX para receber</p>
                <Button variant="outline" size="sm" className="mt-4 gap-1.5 rounded-lg" onClick={() => openPixDialog()}>
                  <Plus className="h-3.5 w-3.5" /> Cadastrar conta PIX
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {pixAccounts.map((pix, i) => (
                  <motion.div
                    key={pix.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <CreditCard className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{pix.beneficiary_name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {PIX_TYPE_LABELS[pix.pix_key_type] || pix.pix_key_type}: {pix.pix_key}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60">{pix.bank_name}</p>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => openPixDialog(pix)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive hover:text-destructive" onClick={() => handleDeletePix(pix.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Payout History */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              Histórico de saques
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {payouts.length === 0 ? (
              <div className="text-center py-8">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
                  <DollarSign className="h-6 w-6 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Nenhum saque realizado</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">Seus saques aparecerão aqui</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {payouts.map((p, i) => {
                  const st = PAYOUT_STATUS[p.status] || PAYOUT_STATUS.requested;
                  const Icon = st.icon;
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${st.bgClass}`}>
                        <Icon className={`h-4 w-4 ${st.color} ${p.status === "processing" ? "animate-spin" : ""}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold">Saque via PIX</p>
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${st.color} border-current/20`}>
                            {st.label}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{fmtDate(p.created_at)}</p>
                        {p.rejection_reason && (
                          <p className="text-[10px] text-destructive mt-0.5 line-clamp-1">{p.rejection_reason}</p>
                        )}
                      </div>
                      <p className="text-sm font-bold tabular-nums text-foreground">-{fmt(p.amount)}</p>
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
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <ArrowDownLeft className="h-4 w-4 text-primary" />
              </div>
              Solicitar saque
            </DialogTitle>
            <DialogDescription className="text-xs">
              Disponível: <strong className="text-emerald-600 dark:text-emerald-400">{fmt(released)}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payoutAmount" className="text-xs">Valor do saque *</Label>
              <Input
                id="payoutAmount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                className="h-11 text-lg font-bold mt-1"
              />
            </div>
            {pixAccounts.length > 0 && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border/30">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Conta de destino</p>
                <p className="text-sm font-semibold">{pixAccounts[0].beneficiary_name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {PIX_TYPE_LABELS[pixAccounts[0].pix_key_type]}: {pixAccounts[0].pix_key} · {pixAccounts[0].bank_name}
                </p>
              </div>
            )}
            <Button
              className="w-full h-11 btn-gold rounded-xl font-bold"
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
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">{editingPix ? "Editar conta PIX" : "Nova conta PIX"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Tipo de chave PIX *</Label>
              <Select value={pixForm.pix_key_type} onValueChange={(v) => setPixForm(f => ({ ...f, pix_key_type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
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
              <Label htmlFor="pixKey" className="text-xs">Chave PIX *</Label>
              <Input id="pixKey" className="mt-1" value={pixForm.pix_key} onChange={(e) => setPixForm(f => ({ ...f, pix_key: e.target.value }))} placeholder="Sua chave PIX" />
            </div>
            <div>
              <Label htmlFor="pixBenef" className="text-xs">Beneficiário *</Label>
              <Input id="pixBenef" className="mt-1" value={pixForm.beneficiary_name} onChange={(e) => setPixForm(f => ({ ...f, beneficiary_name: e.target.value }))} placeholder="Nome do titular" />
            </div>
            <div>
              <Label htmlFor="pixBank" className="text-xs">Banco *</Label>
              <Input id="pixBank" className="mt-1" value={pixForm.bank_name} onChange={(e) => setPixForm(f => ({ ...f, bank_name: e.target.value }))} placeholder="Ex: Nubank, Itaú..." />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setPixOpen(false)} className="rounded-lg">Cancelar</Button>
            <Button className="btn-gold rounded-lg" disabled={pixSubmitting} onClick={handleSavePix}>
              {pixSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
