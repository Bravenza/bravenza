import { useState, useEffect } from "react";
import { Pencil, X, Upload, Pause, Play, Trash2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { MarketplaceListing } from "@/hooks/useMarketplace";

interface EditListingDialogProps {
  listing: MarketplaceListing;
  onUpdate: (data: any) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onRefresh: () => void;
}

const conditions = [
  { value: "novo", label: "Novo (nunca usado)" },
  { value: "usado_excelente", label: "Usado - Excelente" },
  { value: "usado_bom", label: "Usado - Bom" },
  { value: "usado_regular", label: "Usado - Regular" },
];

export function EditListingDialog({ listing, onUpdate, onDelete, onRefresh }: EditListingDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
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
    }
  }, [open, listing]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    const newPhotos = [...form.photos];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `listings/${listing.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage.from("marketplace").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (error) {
        toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
        continue;
      }

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
      const success = await onUpdate({
        id: listing.id,
        title: form.title,
        description: form.description,
        condition: form.condition,
        price: parseFloat(form.price),
        shipping_mode: form.shipping_mode,
        shipping_cost_estimate: form.shipping_cost_estimate ? parseFloat(form.shipping_cost_estimate) : 0,
        photos: form.photos,
        status: form.status,
      });
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
              <Input type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Frete estimado (R$)</Label>
              <Input type="number" value={form.shipping_cost_estimate} onChange={(e) => setForm((p) => ({ ...p, shipping_cost_estimate: e.target.value }))} className="mt-1" />
            </div>
          </div>

          <div>
            <Label>Envio</Label>
            <Select value={form.shipping_mode} onValueChange={(v) => setForm((p) => ({ ...p, shipping_mode: v }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="direct">Envio direto</SelectItem>
                <SelectItem value="bravenza">Via Bravenza</SelectItem>
              </SelectContent>
            </Select>
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

          <Button onClick={handleSubmit} disabled={isSubmitting || !form.title || !form.price} className="w-full btn-gold">
            {isSubmitting ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
