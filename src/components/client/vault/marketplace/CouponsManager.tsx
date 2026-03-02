import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight, Ticket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { marketplaceRequest } from "@/hooks/marketplace/api";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_purchase: number;
  max_uses: number | null;
  uses_count: number;
  is_active: boolean;
  valid_until: string | null;
  created_at: string;
}

interface CouponsManagerProps {
  clientCpf: string;
}

export function CouponsManager({ clientCpf }: CouponsManagerProps) {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    code: "", discount_type: "percent", discount_value: "", min_purchase: "", max_uses: "", valid_until: "",
  });

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const data = await marketplaceRequest("", "my-coupons");
      setCoupons(data.coupons || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.code || !form.discount_value) {
      toast({ title: "Preencha código e valor", variant: "destructive" });
      return;
    }
    try {
      await marketplaceRequest("", "create-coupon", "POST", {
        code: form.code, discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        min_purchase: form.min_purchase ? parseFloat(form.min_purchase) : 0,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        valid_until: form.valid_until || null,
      });
      toast({ title: "Cupom criado!" });
      setCreateOpen(false);
      setForm({ code: "", discount_type: "percent", discount_value: "", min_purchase: "", max_uses: "", valid_until: "" });
      fetchCoupons();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const toggleCoupon = async (coupon: Coupon) => {
    try {
      await marketplaceRequest("", "update-coupon", "PUT", { coupon_id: coupon.id, is_active: !coupon.is_active });
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCoupon = async (id: string) => {
    try {
      await marketplaceRequest("", "delete-coupon", "DELETE", undefined, { id });
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Tag className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Meus cupons</h3>
            <p className="text-[10px] text-muted-foreground">Gerencie seus cupons de desconto</p>
          </div>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 rounded-full h-8 text-xs font-semibold">
              <Plus className="h-3.5 w-3.5" /> Criar cupom
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Ticket className="h-4 w-4 text-primary" />
                </div>
                Novo cupom
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-xs">Código</Label>
                <Input placeholder="EX: DESCONTO10" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="bg-muted/30 border-border/30 mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                    <SelectTrigger className="bg-muted/30 border-border/30 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Porcentagem (%)</SelectItem>
                      <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Valor</Label>
                  <Input type="number" placeholder={form.discount_type === "percent" ? "10" : "50"} value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} className="bg-muted/30 border-border/30 mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Compra mínima (R$)</Label>
                  <Input type="number" placeholder="0" value={form.min_purchase} onChange={(e) => setForm({ ...form, min_purchase: e.target.value })} className="bg-muted/30 border-border/30 mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Limite de usos</Label>
                  <Input type="number" placeholder="Ilimitado" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} className="bg-muted/30 border-border/30 mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Válido até</Label>
                <Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="bg-muted/30 border-border/30 mt-1" />
              </div>
              <Button className="w-full rounded-xl h-10 font-bold" onClick={handleCreate}>Criar cupom</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {coupons.length === 0 ? (
        <Card className="border-border/30 shadow-sm">
          <CardContent className="py-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
              <Tag className="h-7 w-7 text-muted-foreground/25" />
            </div>
            <h3 className="font-bold text-sm mb-1">Nenhum cupom criado</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">Crie cupons para atrair mais compradores!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {coupons.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="border-border/30 shadow-sm hover:border-border/60 transition-colors">
                <CardContent className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${c.is_active ? "bg-primary/10" : "bg-muted/60"}`}>
                      <Ticket className={`h-4 w-4 ${c.is_active ? "text-primary" : "text-muted-foreground/40"}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={c.is_active ? "default" : "secondary"} className="font-mono text-[10px] px-2 h-5">
                          {c.code}
                        </Badge>
                        <span className="text-sm font-bold">
                          {c.discount_type === "percent" ? `${c.discount_value}%` : `R$ ${c.discount_value}`} OFF
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {c.uses_count} uso{c.uses_count !== 1 ? "s" : ""}
                        {c.max_uses ? ` / ${c.max_uses}` : ""}
                        {c.valid_until ? ` · Até ${new Date(c.valid_until).toLocaleDateString("pt-BR")}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => toggleCoupon(c)}>
                      {c.is_active ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive" onClick={() => deleteCoupon(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
