import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2, CheckCircle2, XCircle, AlertTriangle, Eye, Sparkles,
  ChevronLeft, ChevronRight, Search, SkipForward, Save, Check, Trash2
} from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type TranslationStatus = "pending" | "review" | "done" | "error" | "skipped" | "translated" | "enriched";

interface SneakerModel {
  id: string;
  sku: string;
  model_name_pt: string;
  description_pt: string;
  translation_status: TranslationStatus;
  translation_error: string | null;
  placeholder_image_url: string;
}

const STATUS_LABELS: Record<TranslationStatus, { label: string; icon: React.ElementType }> = {
  pending:    { label: "Pendente", icon: AlertTriangle },
  translated: { label: "Traduzido", icon: AlertTriangle },
  enriched:  { label: "Enriquecido", icon: Sparkles },
  review:    { label: "Aguard. revisão", icon: Eye },
  done:      { label: "Aprovado", icon: CheckCircle2 },
  error:     { label: "Erro", icon: XCircle },
  skipped:   { label: "Ignorado", icon: SkipForward },
};

const PAGE_SIZE = 20;

export default function DescriptionReviewPanel() {
  const [products, setProducts] = useState<SneakerModel[]>([]);
  const [selected, setSelected] = useState<SneakerModel | null>(null);
  const [filterStatus, setFilterStatus] = useState<TranslationStatus | "all">("review");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState<{ current: number; total: number; errors: number } | null>(null);
  const [cancelEnrich, setCancelEnrich] = useState(false);
  const [approvingAll, setApprovingAll] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [deletingSkipped, setDeletingSkipped] = useState(false);
  const [showDeleteSkippedDialog, setShowDeleteSkippedDialog] = useState(false);
  const [editPt, setEditPt] = useState("");
  const [editName, setEditName] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── Contadores por status ───────────────────────────────────────────────────
  const loadCounts = useCallback(async () => {
    const statuses: TranslationStatus[] = ["pending", "translated", "enriched", "review", "done", "error", "skipped"];
    const newCounts: Record<string, number> = {};
    for (const s of statuses) {
      const { count } = await supabase
        .from("sneaker_models")
        .select("id", { count: "exact", head: true })
        .eq("translation_status", s);
      newCounts[s] = count || 0;
    }
    setCounts(newCounts);
  }, []);

  // ─── Lista de produtos ──────────────────────────────────────────────────────
  const loadProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("sneaker_models")
      .select("id, sku, model_name_pt, description_pt, translation_status, translation_error, placeholder_image_url", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filterStatus !== "all") query = query.eq("translation_status", filterStatus);
    if (search.trim()) query = query.or(`sku.ilike.%${search}%,model_name_pt.ilike.%${search}%`);

    const { data, count, error } = await query;
    if (error) { showToast(error.message, "error"); setLoading(false); return; }
    setProducts((data || []) as SneakerModel[]);
    setTotal(count || 0);
    setLoading(false);
  }, [filterStatus, search, page]);

  useEffect(() => { loadCounts(); }, [loadCounts]);
  useEffect(() => { loadProducts(); }, [loadProducts]);

  // ─── Selecionar produto ─────────────────────────────────────────────────────
  const selectProduct = (p: SneakerModel) => {
    setSelected(p);
    setEditPt(p.description_pt || "");
    setEditName(p.model_name_pt || "");
  };

  // ─── Salvar edição (mantém em review) ───────────────────────────────────────
  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase
      .from("sneaker_models")
      .update({ description_pt: editPt, model_name_pt: editName })
      .eq("id", selected.id);
    setSaving(false);
    if (error) { showToast(error.message, "error"); return; }
    showToast("Rascunho salvo");
    loadProducts();
    loadCounts();
  };

  // ─── Aprovar → done ─────────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase
      .from("sneaker_models")
      .update({ description_pt: editPt, model_name_pt: editName, translation_status: "done" })
      .eq("id", selected.id);
    setSaving(false);
    if (error) { showToast(error.message, "error"); return; }
    showToast("Aprovado ✓");
    setSelected(null);
    loadProducts();
    loadCounts();
  };

  // ─── Ignorar → skipped ─────────────────────────────────────────────────────
  const handleSkip = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase
      .from("sneaker_models")
      .update({ translation_status: "skipped" })
      .eq("id", selected.id);
    setSaving(false);
    if (error) { showToast(error.message, "error"); return; }
    showToast("Marcado como ignorado");
    setSelected(null);
    loadProducts();
    loadCounts();
  };

  // ─── Reescrever em batches ──────────────────────────────────────────────────
  const callEnrichOnce = async (token: string) => {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-descriptions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({}),
      }
    );
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "Erro ao enriquecer");
    return data;
  };

  const cancelRef = useRef(false);

  const handleEnrich = async (mode: "10" | "100" | "all") => {
    setEnriching(true);
    setCancelEnrich(false);
    cancelRef.current = false;
    setEnrichProgress({ current: 0, total: 0, errors: 0 });

    const maxRounds = mode === "10" ? 1 : mode === "100" ? 10 : 999;
    let totalSuccess = 0;
    let totalErrors = 0;
    let round = 0;

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error("Sessão expirada");

      while (round < maxRounds && !cancelRef.current) {
        round++;
        const data = await callEnrichOnce(token);
        totalSuccess += data.success || 0;
        totalErrors += data.failed || 0;
        setEnrichProgress({
          current: totalSuccess,
          total: mode === "all" ? totalSuccess + (data.remaining || 0) : (mode === "100" ? 100 : 10),
          errors: totalErrors,
        });

        if (!data.has_more || data.success === 0) break;

        // Delay entre batches para evitar rate limit
        await new Promise((r) => setTimeout(r, 1500));
      }

      showToast(`${totalSuccess} descrições reescritas${totalErrors > 0 ? `, ${totalErrors} falhas` : ""}`);
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setEnriching(false);
      loadProducts();
      loadCounts();
    }
  };

  const handleCancelEnrich = () => {
    cancelRef.current = true;
    setCancelEnrich(true);
  };

  // ─── Aprovar todos em review ────────────────────────────────────────────────
  const handleApproveAll = async () => {
    const reviewCount = counts["review"] || 0;
    if (reviewCount === 0) { showToast("Nenhum produto em revisão", "error"); return; }
    setShowApproveDialog(true);
  };

  const confirmApproveAll = async () => {
    setShowApproveDialog(false);
    const reviewCount = counts["review"] || 0;

    setApprovingAll(true);
    try {
      const { error, count: updated } = await supabase
        .from("sneaker_models")
        .update({ translation_status: "done" }, { count: "exact" })
        .eq("translation_status", "review");
      if (error) throw error;
      showToast(`${updated ?? reviewCount} descrições aprovadas ✓`);
      setSelected(null);
      await loadCounts();
      await loadProducts();
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setApprovingAll(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          Revisão de Descrições
        </CardTitle>
        <CardDescription>
          Revise e aprove as descrições reescritas pela IA. Fluxo: pending → review → done
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toast */}
        {toast && (
          <div className={`p-3 rounded-lg text-sm font-medium border ${
            toast.type === "success"
              ? "bg-emerald-950/50 border-emerald-800 text-emerald-300"
              : "bg-red-950/50 border-red-800 text-red-300"
          }`}>
            {toast.msg}
          </div>
        )}

        {/* Status counters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setFilterStatus("all"); setPage(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filterStatus === "all"
                ? "bg-primary/20 border-primary/50 text-primary"
                : "bg-secondary/50 border-border/50 text-muted-foreground hover:bg-secondary"
            }`}
          >
            Todos
          </button>
          {(Object.entries(STATUS_LABELS) as [TranslationStatus, typeof STATUS_LABELS[TranslationStatus]][]).map(
            ([key, { label, icon: Icon }]) => (
              <button
                key={key}
                onClick={() => { setFilterStatus(key); setPage(0); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                  filterStatus === key
                    ? "bg-primary/20 border-primary/50 text-primary"
                    : "bg-secondary/50 border-border/50 text-muted-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{counts[key] ?? "…"}</Badge>
              </button>
            )
          )}
        </div>

        {/* Actions bar */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por SKU ou nome..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-9 h-9"
            />
          </div>
          {/* Reescrever — só aparece em pending/all/error */}
          {(filterStatus === "pending" || filterStatus === "all" || filterStatus === "error" || filterStatus === "skipped" || filterStatus === "translated") && (
            <>
              <LoadingButton loading={enriching} loadingText="Reescrevendo..." onClick={() => handleEnrich("10")} size="sm" variant="outline" disabled={enriching}>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />Próximos 10
              </LoadingButton>
              <LoadingButton loading={enriching} loadingText="Reescrevendo..." onClick={() => handleEnrich("100")} size="sm" variant="outline" disabled={enriching}>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />Próximos 100
              </LoadingButton>
              <LoadingButton loading={enriching} loadingText="Reescrevendo..." onClick={() => handleEnrich("all")} size="sm" disabled={enriching}>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />Reescrever todos
              </LoadingButton>
              {enriching && (
                <Button onClick={handleCancelEnrich} variant="destructive" size="sm">
                  <XCircle className="h-3.5 w-3.5 mr-1" />Cancelar
                </Button>
              )}
            </>
          )}
          {/* Aprovar todos — só aparece em review/all */}
          {(filterStatus === "review" || filterStatus === "all") && (counts["review"] ?? 0) > 0 && (
            <LoadingButton loading={approvingAll} loadingText="Aprovando..." onClick={handleApproveAll} size="sm" variant="outline" disabled={enriching || approvingAll}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Aprovar todos ({counts["review"] ?? 0})
            </LoadingButton>
          )}
          {/* Excluir ignorados — só aparece em skipped */}
          {filterStatus === "skipped" && (counts["skipped"] ?? 0) > 0 && (
            <LoadingButton loading={deletingSkipped} loadingText="Excluindo..." onClick={() => setShowDeleteSkippedDialog(true)} size="sm" variant="destructive" disabled={enriching || deletingSkipped}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />Excluir ignorados ({counts["skipped"] ?? 0})
            </LoadingButton>
          )}
        </div>

        {/* Progress bar */}
        {enriching && enrichProgress && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{enrichProgress.current} reescritas{enrichProgress.errors > 0 ? ` · ${enrichProgress.errors} erros` : ""}</span>
              {enrichProgress.total > 0 && (
                <span>{Math.round((enrichProgress.current / enrichProgress.total) * 100)}%</span>
              )}
            </div>
            <div className="w-full h-2 rounded-full bg-secondary/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: enrichProgress.total > 0 ? `${Math.min(100, (enrichProgress.current / enrichProgress.total) * 100)}%` : "0%" }}
              />
            </div>
          </div>
        )}

        {/* Content: list + editor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Product list */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{total} produtos · Pág {page + 1}/{totalPages || 1}</p>
            <ScrollArea className="h-[420px] pr-2">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : products.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum produto encontrado.</p>
              ) : (
                <div className="space-y-1.5">
                  {products.map((p) => {
                    const statusInfo = STATUS_LABELS[p.translation_status] || STATUS_LABELS.pending;
                    const StatusIcon = statusInfo.icon;
                    return (
                      <button
                        key={p.id}
                        onClick={() => selectProduct(p)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selected?.id === p.id
                            ? "bg-primary/10 border-primary/40"
                            : "bg-secondary/30 border-border/30 hover:bg-secondary/60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground truncate">{p.model_name_pt || p.sku}</span>
                          <StatusIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{p.sku}</p>
                        {p.description_pt && (
                          <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">{p.description_pt}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
            {/* Pagination */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground">{page + 1} / {totalPages || 1}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Editor */}
          <div className="space-y-3">
            {selected ? (
              <>
                <div className="flex items-center gap-3">
                  {selected.placeholder_image_url && (
                    <img
                      src={selected.placeholder_image_url}
                      alt={selected.model_name_pt}
                      className="w-16 h-16 object-contain rounded-lg bg-secondary/50 border border-border/30"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{selected.sku}</p>
                    <Badge variant="secondary" className="text-[10px] mt-1">
                      {STATUS_LABELS[selected.translation_status]?.label || selected.translation_status}
                    </Badge>
                  </div>
                </div>

                {selected.translation_error && (
                  <div className="p-2 rounded-lg bg-red-950/30 border border-red-800/50 text-xs text-red-300">
                    Erro: {selected.translation_error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Nome PT</label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Descrição PT</label>
                  <Textarea
                    value={editPt}
                    onChange={(e) => setEditPt(e.target.value)}
                    rows={8}
                    className="text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  {/* Ações contextuais conforme status */}
                  {selected.translation_status === "done" ? (
                    <>
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        size="sm"
                        className="flex-1"
                      >
                        <Save className="h-3.5 w-3.5 mr-1" />
                        Salvar alterações
                      </Button>
                      <Button
                        onClick={async () => {
                          if (!selected) return;
                          setSaving(true);
                          const { error } = await supabase
                            .from("sneaker_models")
                            .update({ translation_status: "pending" })
                            .eq("id", selected.id);
                          setSaving(false);
                          if (error) { showToast(error.message, "error"); return; }
                          showToast("Enviado para reescrita");
                          setSelected(null);
                          loadProducts();
                          loadCounts();
                        }}
                        disabled={saving}
                        variant="outline"
                        size="sm"
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                        Reescrever
                      </Button>
                    </>
                  ) : selected.translation_status === "skipped" ? (
                    <>
                      <LoadingButton
                        loading={saving}
                        onClick={async () => {
                          if (!selected) return;
                          setSaving(true);
                          const { error } = await supabase
                            .from("sneaker_models")
                            .update({ translation_status: "pending" })
                            .eq("id", selected.id);
                          setSaving(false);
                          if (error) { showToast(error.message, "error"); return; }
                          showToast("Enviado para reescrita");
                          setSelected(null);
                          loadProducts();
                          loadCounts();
                        }}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                        Reprocessar
                      </LoadingButton>
                    </>
                  ) : (
                    <>
                      <LoadingButton
                        loading={saving}
                        onClick={handleApprove}
                        size="sm"
                        className="flex-1"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Aprovar
                      </LoadingButton>
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Save className="h-3.5 w-3.5 mr-1" />
                        Salvar rascunho
                      </Button>
                      <Button
                        onClick={handleSkip}
                        disabled={saving}
                        variant="ghost"
                        size="sm"
                      >
                        <SkipForward className="h-3.5 w-3.5 mr-1" />
                        Ignorar
                      </Button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                Selecione um produto para editar
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>

    <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Aprovar todas as descrições?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação vai marcar <strong>{counts["review"] ?? 0} descrições</strong> em revisão como aprovadas.
            Essa ação não pode ser desfeita facilmente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirmApproveAll}>
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Aprovar todas
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={showDeleteSkippedDialog} onOpenChange={setShowDeleteSkippedDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir todos os ignorados?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação vai <strong>remover permanentemente {counts["skipped"] ?? 0} produtos</strong> marcados como ignorados do catálogo.
            Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              setShowDeleteSkippedDialog(false);
              setDeletingSkipped(true);
              try {
                const { error, count: deleted } = await supabase
                  .from("sneaker_models")
                  .delete({ count: "exact" })
                  .eq("translation_status", "skipped");
                if (error) throw error;
                showToast(`${deleted ?? 0} produtos excluídos`);
                setSelected(null);
                await loadCounts();
                await loadProducts();
              } catch (e: any) {
                showToast(e.message, "error");
              } finally {
                setDeletingSkipped(false);
              }
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Excluir todos
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
