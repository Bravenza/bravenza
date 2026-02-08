import { useState } from "react";
import { ArrowLeft, ShieldCheck, Upload, X, Loader2, Package, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { CatalogProduct } from "@/hooks/useMarketplaceCatalog";

const conditions = [
  { value: "novo", label: "Novo (nunca usado)" },
  { value: "usado_excelente", label: "Usado - Excelente" },
  { value: "usado_bom", label: "Usado - Bom" },
  { value: "usado_regular", label: "Usado - Regular" },
];

interface OfferFormProps {
  product: CatalogProduct;
  onBack: () => void;
  onSubmit: (data: any) => Promise<any>;
  vaultItems?: { id: string; title: string; brand: string | null; model: string | null; size: string | null; colorway: string | null }[];
}

export function OfferForm({ product, onBack, onSubmit, vaultItems = [] }: OfferFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sizeInput, setSizeInput] = useState("");
  const [form, setForm] = useState({
    sizes: [] as string[],
    condition: "usado_bom",
    price: "",
    original_purchase_price: "",
    description: "",
    defects: "",
    photos: [] as string[],
    proof_photos: [] as string[],
    has_receipt: false,
    shipping_mode: "direct",
    vault_item_id: "",
  });

  const addSize = () => {
    const trimmed = sizeInput.trim();
    if (!trimmed) return;
    if (form.sizes.includes(trimmed)) {
      toast({ title: "Tamanho já adicionado", variant: "destructive" });
      return;
    }
    setForm((p) => ({ ...p, sizes: [...p.sizes, trimmed] }));
    setSizeInput("");
  };

  const removeSize = (size: string) => {
    setForm((p) => ({ ...p, sizes: p.sizes.filter((s) => s !== size) }));
  };

  const handleSizeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSize();
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "photos" | "proof_photos") => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const newPhotos = [...form[field]];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `offers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("marketplace").upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) { toast({ title: "Erro no upload", description: error.message, variant: "destructive" }); continue; }
      const { data: urlData } = supabase.storage.from("marketplace").getPublicUrl(path);
      newPhotos.push(urlData.publicUrl);
    }
    setForm((prev) => ({ ...prev, [field]: newPhotos }));
    setUploading(false);
  };

  const removePhoto = (field: "photos" | "proof_photos", index: number) => {
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const priceNum = parseFloat(form.price || "0");
  const isBravenzaRequired = priceNum >= 2000 || product.is_high_risk;

  const handleSubmit = async () => {
    if (form.sizes.length === 0 || !form.price) {
      toast({ title: "Adicione pelo menos um tamanho e informe o preço", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      let lastResult = null;
      for (const size of form.sizes) {
        const result = await onSubmit({
          product_id: product.id,
          brand: product.brand,
          model: product.model,
          size,
          condition: form.condition,
          price: parseFloat(form.price),
          original_purchase_price: form.original_purchase_price ? parseFloat(form.original_purchase_price) : undefined,
          description: form.description || undefined,
          defects: form.defects || undefined,
          photos: form.photos,
          proof_photos: form.proof_photos,
          has_receipt: form.has_receipt,
          shipping_mode: isBravenzaRequired ? "bravenza" : form.shipping_mode,
          vault_item_id: form.vault_item_id || undefined,
        });
        if (result) lastResult = result;
      }
      if (form.sizes.length > 1 && lastResult) {
        toast({ title: `${form.sizes.length} ofertas criadas!`, description: "Uma oferta para cada tamanho selecionado." });
      }
      return lastResult;
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Trocar produto
      </button>

      {/* Selected product */}
      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/30">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div>
          <p className="text-sm font-medium">{product.brand} {product.model}</p>
          {product.colorway && <p className="text-xs text-muted-foreground">{product.colorway}</p>}
        </div>
      </div>

      {/* Vault item link */}
      {vaultItems.length > 0 && (
        <div>
          <Label>Vincular item do Vault</Label>
          <Select value={form.vault_item_id} onValueChange={(v) => setForm((p) => ({ ...p, vault_item_id: v === "none" ? "" : v }))}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Opcional - certificado Vault ID" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem vínculo</SelectItem>
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
        </div>
      )}

      {/* Sizes */}
      <div>
        <Label>Tamanhos disponíveis *</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={sizeInput}
            onChange={(e) => setSizeInput(e.target.value)}
            onKeyDown={handleSizeKeyDown}
            placeholder="Ex: 42"
            className="flex-1"
          />
          <Button type="button" variant="outline" size="icon" onClick={addSize} disabled={!sizeInput.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {form.sizes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.sizes.map((size) => (
              <Badge key={size} variant="secondary" className="gap-1 text-xs px-2 py-1">
                {size}
                <button type="button" onClick={() => removeSize(size)} className="ml-0.5 hover:text-destructive transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground mt-1">
          {form.sizes.length === 0
            ? "Digite o tamanho e pressione Enter ou clique em +"
            : `${form.sizes.length} tamanho${form.sizes.length > 1 ? "s" : ""} selecionado${form.sizes.length > 1 ? "s" : ""}. Uma oferta será criada para cada tamanho.`}
        </p>
      </div>

      {/* Condition */}
      <div>
        <Label>Condição *</Label>
        <Select value={form.condition} onValueChange={(v) => setForm((p) => ({ ...p, condition: v }))}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {conditions.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Preço (R$) *</Label>
          <Input type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} placeholder="1.500" className="mt-1" />
        </div>
        <div>
          <Label>Preço original (R$)</Label>
          <Input type="number" value={form.original_purchase_price} onChange={(e) => setForm((p) => ({ ...p, original_purchase_price: e.target.value }))} placeholder="2.000" className="mt-1" />
        </div>
      </div>

      {/* Defects */}
      {form.condition !== "novo" && (
        <div>
          <Label>Defeitos / detalhes de uso</Label>
          <Textarea value={form.defects} onChange={(e) => setForm((p) => ({ ...p, defects: e.target.value }))} placeholder="Descreva marcas de uso, desgaste..." className="mt-1" rows={2} />
        </div>
      )}

      {/* Description */}
      <div>
        <Label>Descrição</Label>
        <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Acessórios inclusos, observações..." className="mt-1" rows={2} />
      </div>

      {/* Shipping */}
      <div>
        <Label>Envio</Label>
        {isBravenzaRequired ? (
          <div className="mt-1 p-2.5 bg-primary/10 border border-primary/30 rounded-lg text-xs text-primary flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Via Bravenza obrigatório {product.is_high_risk ? "(produto high-risk)" : "(≥ R$ 2.000)"}</span>
          </div>
        ) : (
          <Select value={form.shipping_mode} onValueChange={(v) => setForm((p) => ({ ...p, shipping_mode: v }))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="direct">Envio direto ao comprador</SelectItem>
              <SelectItem value="bravenza">Via Bravenza (autenticação)</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Has receipt */}
      <div className="flex items-center space-x-2">
        <Checkbox id="has_receipt" checked={form.has_receipt} onCheckedChange={(c) => setForm((p) => ({ ...p, has_receipt: !!c }))} />
        <Label htmlFor="has_receipt" className="text-sm cursor-pointer">Tenho nota fiscal / comprovante de compra</Label>
      </div>

      {/* Photos */}
      <div>
        <Label>Fotos do produto *</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {form.photos.map((photo, i) => (
            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
              <img src={photo} alt="" className="w-full h-full object-cover" />
              <button onClick={() => removePhoto("photos", i)} className="absolute top-0.5 right-0.5 p-0.5 bg-background/80 rounded-full">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <label className="w-16 h-16 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <Upload className="h-4 w-4" />
            <span className="text-[9px] mt-0.5">{uploading ? "..." : "Fotos"}</span>
            <input type="file" accept="image/*" multiple onChange={(e) => handlePhotoUpload(e, "photos")} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Proof photos */}
      <div>
        <Label>Fotos de comprovação (nota, etiqueta, caixa)</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {form.proof_photos.map((photo, i) => (
            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
              <img src={photo} alt="" className="w-full h-full object-cover" />
              <button onClick={() => removePhoto("proof_photos", i)} className="absolute top-0.5 right-0.5 p-0.5 bg-background/80 rounded-full">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <label className="w-16 h-16 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <Upload className="h-4 w-4" />
            <span className="text-[9px] mt-0.5">{uploading ? "..." : "Provas"}</span>
            <input type="file" accept="image/*" multiple onChange={(e) => handlePhotoUpload(e, "proof_photos")} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={isSubmitting || form.sizes.length === 0 || !form.price || form.photos.length === 0} className="w-full btn-gold">
        {isSubmitting
          ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Publicando...</>
          : form.sizes.length > 1
            ? `Publicar ${form.sizes.length} ofertas`
            : "Publicar oferta"}
      </Button>
    </div>
  );
}
