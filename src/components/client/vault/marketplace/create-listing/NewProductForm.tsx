import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewProductFormProps {
  onBack: () => void;
  onCreated: (product: any) => void;
  createProduct: (data: any) => Promise<any>;
  initialBrand?: string;
  initialModel?: string;
}

export function NewProductForm({ onBack, onCreated, createProduct, initialBrand, initialModel }: NewProductFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    brand: initialBrand || "",
    model: initialModel || "",
    colorway: "",
    sku: "",
    category: "sneakers",
    description: "",
    images: [] as string[],
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const newImages = [...form.images];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `catalog/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("marketplace").upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) { toast({ title: "Erro no upload", description: error.message, variant: "destructive" }); continue; }
      const { data: urlData } = supabase.storage.from("marketplace").getPublicUrl(path);
      newImages.push(urlData.publicUrl);
    }
    setForm((prev) => ({ ...prev, images: newImages }));
    setUploading(false);
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async () => {
    if (!form.brand || !form.model) {
      toast({ title: "Preencha marca e modelo", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const product = await createProduct(form);
      if (product) {
        onCreated(product);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Voltar à busca
      </button>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Marca *</Label>
          <Input value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))} placeholder="Nike" className="mt-1" />
        </div>
        <div>
          <Label>Modelo *</Label>
          <Input value={form.model} onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))} placeholder="Air Jordan 1" className="mt-1" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Colorway</Label>
          <Input value={form.colorway} onChange={(e) => setForm((p) => ({ ...p, colorway: e.target.value }))} placeholder="Chicago" className="mt-1" />
        </div>
        <div>
          <Label>SKU</Label>
          <Input value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} placeholder="555088-101" className="mt-1" />
        </div>
      </div>

      <div>
        <Label>Descrição</Label>
        <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Detalhes sobre o produto..." className="mt-1" rows={2} />
      </div>

      {/* Images */}
      <div>
        <Label>Fotos do produto</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {form.images.map((img, i) => (
            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
              <img src={img} alt="" className="w-full h-full object-cover" />
              <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 p-0.5 bg-background/80 rounded-full">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <label className="w-16 h-16 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <Upload className="h-4 w-4" />
            <span className="text-[9px] mt-0.5">{uploading ? "..." : "Upload"}</span>
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={isSubmitting || !form.brand || !form.model} className="w-full btn-gold">
        {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Criando...</> : "Criar produto e continuar"}
      </Button>
    </div>
  );
}
