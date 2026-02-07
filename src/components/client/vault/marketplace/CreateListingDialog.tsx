import { useState } from "react";
import { Plus, Upload, X, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface CreateListingDialogProps {
  onSubmit: (data: any) => Promise<any>;
  vaultItems?: { id: string; title: string; brand: string | null; model: string | null; size: string | null; colorway: string | null }[];
}

const conditions = [
  { value: "novo", label: "Novo (nunca usado)" },
  { value: "usado_excelente", label: "Usado - Excelente" },
  { value: "usado_bom", label: "Usado - Bom" },
  { value: "usado_regular", label: "Usado - Regular" },
];

export function CreateListingDialog({ onSubmit, vaultItems = [] }: CreateListingDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVaultItem, setSelectedVaultItem] = useState<string>("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    brand: "",
    model: "",
    colorway: "",
    size: "",
    condition: "usado_bom",
    price: "",
    original_purchase_price: "",
    shipping_mode: "direct",
    shipping_cost_estimate: "",
    photos: [] as string[],
  });

  const handleVaultItemSelect = (itemId: string) => {
    setSelectedVaultItem(itemId);
    if (itemId === "manual") {
      setForm((prev) => ({ ...prev, title: "", brand: "", model: "", size: "", colorway: "" }));
      return;
    }
    const item = vaultItems.find((v) => v.id === itemId);
    if (item) {
      setForm((prev) => ({
        ...prev,
        title: item.title,
        brand: item.brand || "",
        model: item.model || "",
        size: item.size || "",
        colorway: item.colorway || "",
      }));
    }
  };

  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const newPhotos = [...form.photos];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `listings/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("marketplace").upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) { toast({ title: "Erro no upload", description: error.message, variant: "destructive" }); continue; }
      const { data: urlData } = supabase.storage.from("marketplace").getPublicUrl(path);
      newPhotos.push(urlData.publicUrl);
    }
    setForm((prev) => ({ ...prev, photos: newPhotos }));
    setUploading(false);
  };

  const removePhoto = (index: number) => {
    setForm((prev) => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.price) {
      toast({ title: "Preencha título e preço", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmit({
        ...form,
        price: parseFloat(form.price),
        original_purchase_price: form.original_purchase_price
          ? parseFloat(form.original_purchase_price)
          : null,
        shipping_cost_estimate: form.shipping_cost_estimate
          ? parseFloat(form.shipping_cost_estimate)
          : 0,
        vault_item_id: selectedVaultItem && selectedVaultItem !== "manual" ? selectedVaultItem : null,
      });

      if (result) {
        setOpen(false);
        setForm({
          title: "",
          description: "",
          brand: "",
          model: "",
          colorway: "",
          size: "",
          condition: "usado_bom",
          price: "",
          original_purchase_price: "",
          shipping_mode: "direct",
          shipping_cost_estimate: "",
          photos: [],
        });
        setSelectedVaultItem("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-gold gap-2">
          <Plus className="h-4 w-4" />
          Criar anúncio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo anúncio</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Vault Item Selection */}
          {vaultItems.length > 0 && (
            <div>
              <Label>Vincular item do Vault</Label>
              <Select value={selectedVaultItem} onValueChange={handleVaultItemSelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione ou cadastre manualmente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Cadastrar manualmente</SelectItem>
                  {vaultItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="h-3 w-3 text-primary" />
                        {item.title}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedVaultItem && selectedVaultItem !== "manual" && (
                <Badge className="mt-1 bg-primary/20 text-primary text-xs gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Certificado Vault ID
                </Badge>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <Label>Título *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Nike Air Jordan 1 Retro High OG"
              className="mt-1"
            />
          </div>

          {/* Brand / Model / Size row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Marca</Label>
              <Input
                value={form.brand}
                onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
                placeholder="Nike"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Modelo</Label>
              <Input
                value={form.model}
                onChange={(e) => setForm((prev) => ({ ...prev, model: e.target.value }))}
                placeholder="Air Jordan 1"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Tamanho</Label>
              <Input
                value={form.size}
                onChange={(e) => setForm((prev) => ({ ...prev, size: e.target.value }))}
                placeholder="42"
                className="mt-1"
              />
            </div>
          </div>

          {/* Colorway */}
          <div>
            <Label>Colorway</Label>
            <Input
              value={form.colorway}
              onChange={(e) => setForm((prev) => ({ ...prev, colorway: e.target.value }))}
              placeholder="Chicago"
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label>Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o estado do produto, detalhes, acessórios inclusos..."
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Condition */}
          <div>
            <Label>Condição *</Label>
            <Select
              value={form.condition}
              onValueChange={(v) => setForm((prev) => ({ ...prev, condition: v }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {conditions.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Preço de venda (R$) *</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    price: val,
                    shipping_mode: parseFloat(val || "0") >= 2000 ? "bravenza" : prev.shipping_mode,
                  }));
                }}
                placeholder="1.500"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Preço original (R$)</Label>
              <Input
                type="number"
                value={form.original_purchase_price}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, original_purchase_price: e.target.value }))
                }
                placeholder="2.000"
                className="mt-1"
              />
            </div>
          </div>

          {/* Shipping */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Envio</Label>
              {parseFloat(form.price || "0") >= 2000 ? (
                <div className="mt-1 p-2.5 bg-primary/10 border border-primary/30 rounded-lg text-xs text-primary flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Via Bravenza obrigatório para itens ≥ R$ 2.000</span>
                </div>
              ) : (
                <Select
                  value={form.shipping_mode}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, shipping_mode: v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Envio direto ao comprador</SelectItem>
                    <SelectItem value="bravenza">Via Bravenza (autenticação)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label>Frete estimado (R$)</Label>
              <Input
                type="number"
                value={form.shipping_cost_estimate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, shipping_cost_estimate: e.target.value }))
                }
                placeholder="30"
                className="mt-1"
              />
            </div>
          </div>

          {/* Photos */}
          <div>
            <Label>Fotos</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {form.photos.map((photo, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-0.5 right-0.5 p-0.5 bg-background/80 rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <Upload className="h-5 w-5" />
                <span className="text-[10px] mt-1">{uploading ? "..." : "Upload"}</span>
                <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !form.title || !form.price}
            className="w-full btn-gold"
          >
            {isSubmitting ? "Publicando..." : "Publicar anúncio"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
