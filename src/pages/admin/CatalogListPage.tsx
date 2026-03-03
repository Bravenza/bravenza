import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2, Search, Languages, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";

const PAGE_SIZE = 25;

export default function CatalogListPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [translationFilter, setTranslationFilter] = useState("all");
  const [imageFilter, setImageFilter] = useState("all");
  const [translating, setTranslating] = useState(false);

  const { data: brands } = useQuery({
    queryKey: ["catalog-brands"],
    queryFn: async () => {
      const { data } = await supabase.from("brands").select("id, name").order("name");
      return data || [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["catalog-sneakers", page, search, brandFilter, translationFilter, imageFilter],
    queryFn: async () => {
      let q = supabase
        .from("sneaker_models")
        .select("*, brand:brands!inner(name), silhouette:silhouettes(name)", { count: "exact" });

      if (search) q = q.or(`sku.ilike.%${search}%,model_name_en.ilike.%${search}%,model_name_pt.ilike.%${search}%,colorway.ilike.%${search}%`);
      if (brandFilter !== "all") q = q.eq("brand_id", brandFilter);
      if (translationFilter !== "all") q = q.eq("translation_status", translationFilter);
      if (imageFilter !== "all") q = q.eq("image_status", imageFilter);

      const from = (page - 1) * PAGE_SIZE;
      q = q.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);

      const { data, count, error } = await q;
      if (error) throw error;
      return { items: data || [], total: count || 0 };
    },
  });

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  const handleTranslate = async () => {
    setTranslating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/catalog-translate-missing`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 50 }),
        }
      );
      const result = await res.json();
      toast({ title: result.ok ? `${result.translated} traduzidos!` : "Erro", variant: result.ok ? "default" : "destructive" });
      qc.invalidateQueries({ queryKey: ["catalog-sneakers"] });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setTranslating(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      translated: { label: "Traduzido", variant: "default" },
      pending: { label: "Pendente", variant: "secondary" },
      error: { label: "Erro", variant: "destructive" },
    };
    const s = map[status] || { label: status, variant: "outline" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const imageBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      tsdb: { label: "TSDB", variant: "default" },
      placeholder: { label: "Placeholder", variant: "secondary" },
      replaced: { label: "Oficial", variant: "default" },
    };
    const s = map[status] || { label: status, variant: "outline" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Catálogo Oficial</h1>
          <p className="text-muted-foreground">{data?.total || 0} modelos cadastrados</p>
        </div>
        <Button onClick={handleTranslate} disabled={translating} variant="outline">
          {translating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Languages className="h-4 w-4 mr-2" />}
          Traduzir pendentes
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar SKU, modelo..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={brandFilter} onValueChange={(v) => { setBrandFilter(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Marca" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as marcas</SelectItem>
                {(brands || []).map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={translationFilter} onValueChange={(v) => { setTranslationFilter(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Tradução" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="translated">Traduzido</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={imageFilter} onValueChange={(v) => { setImageFilter(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Imagem" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="tsdb">TSDB</SelectItem>
                <SelectItem value="placeholder">Placeholder</SelectItem>
                <SelectItem value="replaced">Oficial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">Img</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Silhueta</TableHead>
                <TableHead>Nome (PT)</TableHead>
                <TableHead>Colorway</TableHead>
                <TableHead>Tradução</TableHead>
                <TableHead>Imagem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : (data?.items || []).length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum modelo encontrado</TableCell></TableRow>
              ) : (
                (data?.items || []).map((item: any) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/admin/catalog/${item.sku}`)}
                  >
                    <TableCell>
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                        {item.image_status !== "placeholder" ? (
                          <img src={item.placeholder_image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                    <TableCell>{(item as any).brand?.name}</TableCell>
                    <TableCell>{(item as any).silhouette?.name || "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{item.model_name_pt || item.model_name_en || "—"}</TableCell>
                    <TableCell>{item.colorway || "—"}</TableCell>
                    <TableCell>{statusBadge(item.translation_status)}</TableCell>
                    <TableCell>{imageBadge(item.image_status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
