import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type VerifiedStatus = "VERIFIED" | "PENDING";

interface VaultMember {
  id: string;
  client_name: string;
  client_email: string | null;
}

export default function VaultItemFormPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<VaultMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    user_id: "",
    title: "",
    brand: "",
    model: "",
    colorway: "",
    size: "",
    origin_city: "",
    origin_country: "",
    purchase_value: "",
    verified_status: "PENDING" as VerifiedStatus,
  });

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("vault_members")
        .select("id, client_name, client_email")
        .eq("is_active", true);
      if (!error) setMembers(data || []);
      setIsLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!form.user_id || !form.title) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setIsSaving(true);
    try {
      const year = new Date().getFullYear();
      const { count } = await supabase
        .from("vault_items")
        .select("*", { count: "exact", head: true });
      const seq = (count || 0) + 1;
      const vaultId = `BRVZ-${year}-${String(seq).padStart(6, "0")}`;
      const qrUrl = `${window.location.origin}/vault/verify/${vaultId}`;

      const { error } = await supabase.from("vault_items").insert({
        user_id: form.user_id,
        vault_id: vaultId,
        title: form.title,
        brand: form.brand || null,
        model: form.model || null,
        colorway: form.colorway || null,
        size: form.size || null,
        origin_city: form.origin_city || null,
        origin_country: form.origin_country || null,
        purchase_value: form.purchase_value ? parseFloat(form.purchase_value) : null,
        purchase_date: new Date().toISOString(),
        verified_status: form.verified_status,
        verified_at: form.verified_status === "VERIFIED" ? new Date().toISOString() : null,
        qr_private_url: qrUrl,
      });

      if (error) throw error;

      const { data: memberData } = await supabase
        .from("vault_members")
        .select("total_purchases, total_spent")
        .eq("id", form.user_id)
        .single();

      if (memberData) {
        await supabase
          .from("vault_members")
          .update({
            total_purchases: (memberData.total_purchases || 0) + 1,
            total_spent: (memberData.total_spent || 0) + (parseFloat(form.purchase_value) || 0),
          })
          .eq("id", form.user_id);
      }

      toast.success(`Vault item criado: ${vaultId}`);
      navigate("/admin/vault/items");
    } catch (error) {
      console.error("Error creating item:", error);
      toast.error("Erro ao criar vault item");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/vault/items">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Novo Vault Item</h1>
          <p className="text-muted-foreground">Registre um novo item certificado</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="card-premium">
          <CardHeader>
            <CardTitle>Informações do Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Membro *</Label>
              <Select value={form.user_id} onValueChange={(value) => setForm({ ...form, user_id: value })}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Selecione um membro" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.client_name} - {member.client_email || "sem email"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Air Jordan 1 Retro High OG 'Chicago'" className="bg-secondary/50" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Nike" className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Air Jordan 1" className="bg-secondary/50" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Colorway</Label>
                <Input value={form.colorway} onChange={(e) => setForm({ ...form, colorway: e.target.value })} placeholder="Chicago" className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <Label>Tamanho</Label>
                <Input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="42" className="bg-secondary/50" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-premium">
          <CardHeader>
            <CardTitle>Origem & Valor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cidade de origem</Label>
                <Input value={form.origin_city} onChange={(e) => setForm({ ...form, origin_city: e.target.value })} placeholder="Nova York" className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <Label>País de origem</Label>
                <Input value={form.origin_country} onChange={(e) => setForm({ ...form, origin_country: e.target.value })} placeholder="EUA" className="bg-secondary/50" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor da compra</Label>
                <Input type="number" value={form.purchase_value} onChange={(e) => setForm({ ...form, purchase_value: e.target.value })} placeholder="0.00" className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.verified_status} onValueChange={(value) => setForm({ ...form, verified_status: value as VerifiedStatus })}>
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VERIFIED">Verificado</SelectItem>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Link to="/admin/vault/items">
          <Button variant="outline">Cancelar</Button>
        </Link>
        <Button onClick={handleSave} className="btn-gold" disabled={isSaving}>
          {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando...</> : <><Save className="mr-2 h-4 w-4" />Criar Item</>}
        </Button>
      </div>
    </div>
  );
}
