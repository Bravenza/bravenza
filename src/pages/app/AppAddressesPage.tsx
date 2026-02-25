import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useClientSession } from "@/hooks/useClientSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronLeft, Plus, MapPin, Trash2, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Address {
  id: string;
  label: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  is_default: boolean;
}

const emptyForm = {
  label: "Casa",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  cep: "",
  is_default: false,
};

export default function AppAddressesPage() {
  const navigate = useNavigate();
  const { profile } = useClientSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchAddresses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("client_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    setAddresses((data as Address[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAddresses(); }, []);

  const handleCepBlur = async () => {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(f => ({
          ...f,
          street: data.logradouro || f.street,
          neighborhood: data.bairro || f.neighborhood,
          city: data.localidade || f.city,
          state: data.uf || f.state,
        }));
      }
    } catch { /* ignore */ }
  };

  const handleSave = async () => {
    if (!form.street || !form.number || !form.neighborhood || !form.city || !form.state || !form.cep) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const payload = {
      user_id: user.id,
      label: form.label || "Casa",
      street: form.street.trim(),
      number: form.number.trim(),
      complement: form.complement?.trim() || null,
      neighborhood: form.neighborhood.trim(),
      city: form.city.trim(),
      state: form.state.trim().toUpperCase(),
      cep: form.cep.replace(/\D/g, ""),
      is_default: form.is_default,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("client_addresses").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("client_addresses").insert(payload));
    }

    if (error) {
      toast.error("Erro ao salvar endereço.");
    } else {
      toast.success(editingId ? "Endereço atualizado!" : "Endereço adicionado!");
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchAddresses();
    }
    setSaving(false);
  };

  const handleEdit = (addr: Address) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label,
      street: addr.street,
      number: addr.number,
      complement: addr.complement || "",
      neighborhood: addr.neighborhood,
      city: addr.city,
      state: addr.state,
      cep: addr.cep,
      is_default: addr.is_default,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("client_addresses").delete().eq("id", id);
    if (error) toast.error("Erro ao remover.");
    else { toast.success("Endereço removido."); fetchAddresses(); }
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <Helmet><title>Meus Endereços | BRAVENZA</title></Helmet>

      <Button variant="ghost" size="sm" className="mb-4 gap-1.5 text-muted-foreground" onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/app")}>
        <ChevronLeft className="h-4 w-4" /> Voltar
      </Button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Meus Endereços</h1>
        <Button size="sm" className="gap-1.5" onClick={openNew}>
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MapPin className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum endereço cadastrado ainda.</p>
          <Button size="sm" className="mt-4 gap-1.5" onClick={openNew}>
            <Plus className="h-4 w-4" /> Adicionar endereço
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map(addr => (
            <div
              key={addr.id}
              className={cn(
                "p-4 rounded-xl border transition-colors",
                addr.is_default ? "border-primary/30 bg-primary/5" : "border-border/40 bg-card"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">{addr.label}</span>
                    {addr.is_default && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        <Check className="h-3 w-3" /> Entrega atual
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {addr.street}, {addr.number}{addr.complement ? ` - ${addr.complement}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {addr.neighborhood} · {addr.city}/{addr.state} · CEP {addr.cep.replace(/(\d{5})(\d{3})/, "$1-$2")}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(addr)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(addr.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar endereço" : "Novo endereço"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label htmlFor="label">Apelido do endereço</Label>
              <Input id="label" placeholder="Ex: Casa, Trabalho" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="cep">CEP *</Label>
              <Input id="cep" placeholder="00000-000" maxLength={9} value={form.cep} onChange={e => setForm(f => ({ ...f, cep: e.target.value }))} onBlur={handleCepBlur} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label htmlFor="street">Rua *</Label>
                <Input id="street" value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="number">Nº *</Label>
                <Input id="number" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label htmlFor="complement">Complemento</Label>
              <Input id="complement" placeholder="Apto, bloco..." value={form.complement} onChange={e => setForm(f => ({ ...f, complement: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="neighborhood">Bairro *</Label>
              <Input id="neighborhood" value={form.neighborhood} onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input id="city" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="state">UF *</Label>
                <Input id="state" maxLength={2} placeholder="RS" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Checkbox id="is_default" checked={form.is_default} onCheckedChange={(v) => setForm(f => ({ ...f, is_default: !!v }))} />
              <Label htmlFor="is_default" className="text-sm cursor-pointer">
                Este é meu endereço de entrega atual
              </Label>
            </div>
            <Button className="w-full" disabled={saving} onClick={handleSave}>
              {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Adicionar endereço"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
