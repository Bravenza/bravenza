import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Image as ImageIcon, Save, Loader2 } from "lucide-react";

export default function CatalogDetailPage() {
  const { sku } = useParams<{ sku: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newImageUrl, setNewImageUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: sneaker, isLoading } = useQuery({
    queryKey: ["catalog-detail", sku],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sneaker_models")
        .select("*, brand:brands!inner(name), silhouette:silhouettes(name)")
        .eq("sku", sku!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!sku,
  });

  const { data: images } = useQuery({
    queryKey: ["catalog-images", sneaker?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("sneaker_images")
        .select("*")
        .eq("sneaker_id", sneaker!.id)
        .order("is_primary", { ascending: false });
      return data || [];
    },
    enabled: !!sneaker?.id,
  });

  const primaryImage = images?.find((i: any) => i.is_primary);

  const handleReplaceImage = async () => {
    if (!newImageUrl || !sneaker) return;
    setSaving(true);
    try {
      // Set all existing as non-primary
      await supabase.from("sneaker_images").update({ is_primary: false }).eq("sneaker_id", sneaker.id);
      // Insert new official image
      await supabase.from("sneaker_images").insert({
        sneaker_id: sneaker.id,
        image_url: newImageUrl,
        source: "official",
        is_primary: true,
      });
      // Update model
      await supabase.from("sneaker_models").update({
        image_status: "replaced",
        needs_official_image: false,
      }).eq("id", sneaker.id);

      toast({ title: "Imagem substituída com sucesso!" });
      setNewImageUrl("");
      qc.invalidateQueries({ queryKey: ["catalog-detail", sku] });
      qc.invalidateQueries({ queryKey: ["catalog-images", sneaker.id] });
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro desconhecido", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!sneaker) {
    return <div className="text-center py-20 text-muted-foreground">Modelo não encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/admin/catalog")} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao catálogo
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image Column */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" /> Imagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              {primaryImage ? (
                <img src={primaryImage.image_url} alt={sneaker.model_name_pt || sneaker.sku} className="h-full w-full object-contain" />
              ) : (
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <div className="flex gap-2">
              <Badge variant={sneaker.image_status === "replaced" ? "default" : "secondary"}>
                {sneaker.image_status === "replaced" ? "Oficial" : sneaker.image_status === "tsdb" ? "TSDB" : "Placeholder"}
              </Badge>
              {sneaker.needs_official_image && <Badge variant="outline">Precisa imagem oficial</Badge>}
            </div>

            {/* Image history */}
            {images && images.length > 1 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Histórico de imagens</p>
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img: any) => (
                    <div key={img.id} className={`aspect-square rounded border overflow-hidden ${img.is_primary ? "ring-2 ring-primary" : ""}`}>
                      <img src={img.image_url} alt="" className="h-full w-full object-contain" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Replace image */}
            <div className="space-y-2 pt-2 border-t">
              <Label>Substituir por imagem oficial</Label>
              <Input
                placeholder="https://... (URL da imagem)"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
              />
              <Button onClick={handleReplaceImage} disabled={!newImageUrl || saving} className="w-full" size="sm">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar imagem oficial
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* PT-BR */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🇧🇷 Português (PT-BR)
                {sneaker.translation_status === "translated" && <Badge>Traduzido</Badge>}
                {sneaker.translation_status === "pending" && <Badge variant="secondary">Pendente</Badge>}
                {sneaker.translation_status === "error" && <Badge variant="destructive">Erro</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <DataRow label="Nome" value={sneaker.model_name_pt || "—"} />
                <DataRow label="Descrição" value={sneaker.description_pt || "—"} />
              </dl>
              {sneaker.translation_error && (
                <p className="mt-2 text-xs text-destructive">{sneaker.translation_error}</p>
              )}
            </CardContent>
          </Card>

          {/* EN */}
          <Card>
            <CardHeader><CardTitle>🇺🇸 English (Original)</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <DataRow label="Name" value={sneaker.model_name_en || "—"} />
                <DataRow label="Description" value={sneaker.description_en || "—"} />
              </dl>
            </CardContent>
          </Card>

          {/* Specs */}
          <Card>
            <CardHeader><CardTitle>Ficha Técnica</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-3">
                <DataRow label="SKU" value={sneaker.sku} />
                <DataRow label="Marca" value={(sneaker as any).brand?.name} />
                <DataRow label="Silhueta" value={(sneaker as any).silhouette?.name || "—"} />
                <DataRow label="Colorway" value={sneaker.colorway || "—"} />
                <DataRow label="Data lançamento" value={sneaker.release_date || "—"} />
                <DataRow label="MSRP (BRL)" value={sneaker.msrp ? `R$ ${Number(sneaker.msrp).toFixed(2)}` : "—"} />
                <DataRow label="MSRP (USD)" value={(sneaker as any).msrp_usd ? `US$ ${Number((sneaker as any).msrp_usd).toFixed(2)}` : "—"} />
                <DataRow label="Fonte" value={sneaker.source_primary} />
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value ?? "—"}</dd>
    </div>
  );
}
