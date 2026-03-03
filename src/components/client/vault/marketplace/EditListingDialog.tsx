import { useState, useEffect, useCallback } from "react";
import { Pencil, X, Upload, Pause, Play, Trash2, ShieldCheck, Search, Package, Loader2, AlertTriangle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useConfig } from "@/hooks/useConfig";
import { supabase } from "@/integrations/supabase/client";
import type { MarketplaceListing } from "@/hooks/useMarketplace";
import type { CatalogProduct } from "@/hooks/useMarketplaceCatalog";

interface EditListingDialogProps {
  listing: MarketplaceListing;
  onUpdate: (data: any) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onRefresh: () => void;
  searchProducts?: (query: string) => Promise<CatalogProduct[]>;
}

const conditions = [
  { value: "novo", label: "Novo (nunca usado)" },
  { value: "usado_excelente", label: "Usado - Excelente" },
  { value: "usado_bom", label: "Usado - Bom" },
  { value: "usado_regular", label: "Usado - Regular" },
];

export function EditListingDialog({ listing, onUpdate, onDelete, onRefresh, searchProducts }: EditListingDialogProps) {
  const { toast } = useToast();
  const { isEnabled } = useConfig();
  const catalogRequired = isEnabled("enable_catalog_required_for_new_listings");

  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Product migration state
  const isLegacy = catalogRequired && !listing.product_id;
  const [selectedProductId, setSelectedProductId] = useState<string | null>(listing.product_id || null);
  const [selectedProductLabel, setSelectedProductLabel] = useState<string>("");
  const [migrationQuery, setMigrationQuery] = useState("");
  const [migrationResults, setMigrationResults] = useState<CatalogProduct[]>([]);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    condition: "usado_bom",
    price: "",
    shipping_mode: "direct",
    shipping_cost_estimate: "",
    photos: [] as string[],
    status: "active",
  });

  useEffect(() => {
    if (open && listing) {
      setForm({
        title: listing.title,
        description: listing.description || "",
        condition: listing.condition,
        price: String(listing.price),
        shipping_mode: listing.shipping_mode,
        shipping_cost_estimate: String(listing.shipping_cost_estimate || ""),
        photos: listing.photos || [],
        status: listing.status,
      });
      setSelectedProductId(listing.product_id || null);
      setSelectedProductLabel("");
      setMigrationQuery(listing.brand ? `${listing.brand} ${listing.model || ""}`.trim() : listing.title);
      setMigrationResults([]);
    }
  }, [open, listing]);

  // Debounced catalog search for migration
  const doMigrationSearch = useCallback(async (q: string) => {
    if (!searchProducts || q.length < 2) { setMigrationResults([]); return; }
    setIsSearchingProduct(true);
    try {
      const data = await searchProducts(q);
      setMigrationResults(data);
    } finally {
      setIsSearchingProduct(false);
    }
  }, [searchProducts]);

  useEffect(() => {
    if (!isLegacy || !open) return;
    const timer = setTimeout(() => doMigrationSearch(migrationQuery), 400);
    return () => clearTimeout(timer);
  }, [migrationQuery, doMigrationSearch, isLegacy, open]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const newPhotos = [...form.photos];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `listings/${listing.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
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
    if (catalogRequired && !selectedProductId) {
      toast({ title: "Selecione um produto do catálogo", description: "É obrigatório vincular o anúncio a um produto do catálogo.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: any = {
        id: listing.id,
        title: form.title,
        description: form.description,
        condition: form.condition,
        price: parseFloat(form.price),
        shipping_mode: form.shipping_mode,
        shipping_cost_estimate: form.shipping_cost_estimate ? parseFloat(form.shipping_cost_estimate) : 0,
        photos: form.photos,
        status: form.status,
      };
      // Include product_id for legacy migration
      if (selectedProductId && !listing.product_id) {
        payload.product_id = selectedProductId;
      }
      const success = await onUpdate(payload);
      if (success) {
        setOpen(false);
        onRefresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = form.status === "active" ? "paused" : "active";
    setForm((prev) => ({ ...prev, status: newStatus }));
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este anúncio?")) return;
    const success = await onDelete(listing.id);
    if (success) {
      setOpen(false);
      onRefresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 text-xs">
          <Pencil className="h-3 w-3" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar anúncio</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Legacy migration banner */}
          {isLegacy && !selectedProductId && (
            <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Migração obrigatória</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Este anúncio foi criado antes do catálogo. Selecione o produto correspondente para continuar editando.
                  </p>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={migrationQuery}
                  onChange={(e) => setMigrationQuery(e.target.value)}
                  placeholder="Buscar no catálogo..."
                  className="pl-9"
                />
                {isSearchingProduct && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {migrationResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProductId(p.id); setSelectedProductLabel(`${p.brand} ${p.model}`); }}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                  >
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-1">{p.brand} {p.model}</p>
                      {p.colorway && <p className="text-[10px] text-muted-foreground">{p.colorway}</p>}
                    </div>
                  </button>
                ))}
                {migrationQuery.length >= 2 && !isSearchingProduct && migrationResults.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">Nenhum produto encontrado</p>
                )}
              </div>
            </div>
          )}

          {/* Selected product badge for migrated legacy */}
          {isLegacy && selectedProductId && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg border border-green-500/30 bg-green-500/10">
              <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-xs font-medium text-green-700 dark:text-green-300 flex-1">
                Vinculado: {selectedProductLabel || "Produto do catálogo"}
              </p>
              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => { setSelectedProductId(null); setSelectedProductLabel(""); }}>
                Trocar
              </Button>
            </div>
          )}

          <div>
            <Label>Título *</Label>
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="mt-1" />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="mt-1" rows={3} />
          </div>

          <div>
            <Label>Condição</Label>
            <Select value={form.condition} onValueChange={(v) => setForm((p) => ({ ...p, condition: v }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {conditions.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Preço (R$) *</Label>
              <Input type="number" value={form.price} onChange={(e) => {
                const val = e.target.value;
                setForm((p) => ({
                  ...p,
                  price: val,
                  shipping_mode: parseFloat(val || "0") >= 2000 ? "bravenza" : p.shipping_mode,
                }));
              }} className="mt-1" />
            </div>
            <div>
              <Label>Frete estimado (R$)</Label>
              <Input type="number" value={form.shipping_cost_estimate} onChange={(e) => setForm((p) => ({ ...p, shipping_cost_estimate: e.target.value }))} className="mt-1" />
            </div>
          </div>

          <div>
            <Label>Envio</Label>
            {parseFloat(form.price || "0") >= 2000 ? (
              <div className="mt-1 p-2.5 bg-primary/10 border border-primary/30 rounded-lg text-xs text-primary flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Via Bravenza obrigatório para itens ≥ R$ 2.000</span>
              </div>
            ) : (
              <Select value={form.shipping_mode} onValueChange={(v) => setForm((p) => ({ ...p, shipping_mode: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Envio direto</SelectItem>
                  <SelectItem value="bravenza">Via Bravenza</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Photos with upload */}
          <div>
            <Label>Fotos</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {form.photos.map((photo, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removePhoto(i)} className="absolute top-0.5 right-0.5 p-0.5 bg-background/80 rounded-full">
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

          <div className="flex gap-2">
            <Button onClick={handleToggleStatus} variant="outline" className="gap-1 flex-1" type="button">
              {form.status === "active" ? <><Pause className="h-4 w-4" /> Pausar</> : <><Play className="h-4 w-4" /> Reativar</>}
            </Button>
            <Button onClick={handleDelete} variant="destructive" className="gap-1" type="button">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !form.title || !form.price || (isLegacy && !selectedProductId)}
            className="w-full btn-gold"
          >
            {isSubmitting ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
