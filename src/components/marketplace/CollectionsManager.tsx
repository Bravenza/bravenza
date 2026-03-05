import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, GripVertical, Image, Loader2, Layout } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { marketplaceRequest } from "@/hooks/marketplace/api";
import type { MarketplaceListing } from "@/hooks/marketplace/types";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  listing_ids: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

interface CollectionsManagerProps {
  clientCpf: string;
  myListings: MarketplaceListing[];
}

export function CollectionsManager({ clientCpf, myListings }: CollectionsManagerProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [form, setForm] = useState({ name: "", description: "", listing_ids: [] as string[] });
  const [isSaving, setIsSaving] = useState(false);

  const fetchCollections = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await marketplaceRequest(clientCpf, "my-collections");
      setCollections(data.collections || []);
    } catch (err) {
      console.error("Fetch collections error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [clientCpf]);

  useEffect(() => { fetchCollections(); }, [fetchCollections]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", listing_ids: [] });
    setDialogOpen(true);
  };

  const openEdit = (col: Collection) => {
    setEditing(col);
    setForm({ name: col.name, description: col.description || "", listing_ids: col.listing_ids || [] });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    setIsSaving(true);
    try {
      if (editing) {
        await marketplaceRequest(clientCpf, "update-collection", "PUT", {
          id: editing.id, ...form, is_active: editing.is_active,
        });
        toast.success("Coleção atualizada!");
      } else {
        await marketplaceRequest(clientCpf, "create-collection", "POST", form);
        toast.success("Coleção criada!");
      }
      setDialogOpen(false);
      fetchCollections();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await marketplaceRequest(clientCpf, "delete-collection", "DELETE", undefined, { id });
      toast.success("Coleção removida");
      fetchCollections();
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover");
    }
  };

  const handleToggleActive = async (col: Collection) => {
    try {
      await marketplaceRequest(clientCpf, "update-collection", "PUT", {
        id: col.id, name: col.name, description: col.description,
        listing_ids: col.listing_ids, is_active: !col.is_active,
      });
      fetchCollections();
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar");
    }
  };

  const toggleListing = (listingId: string) => {
    setForm(prev => ({
      ...prev,
      listing_ids: prev.listing_ids.includes(listingId)
        ? prev.listing_ids.filter(id => id !== listingId)
        : [...prev.listing_ids, listingId],
    }));
  };

  const activeListings = myListings.filter(l => l.status === "active");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">Vitrine & Coleções</h3>
          <p className="text-sm text-muted-foreground">
            Organize seus anúncios em coleções temáticas visíveis no seu perfil público.
          </p>
        </div>
        <Button className="btn-gold gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nova coleção
        </Button>
      </div>

      {/* Collections list */}
      {collections.length === 0 ? (
        <Card className="border-border/20">
          <CardContent className="py-16 text-center">
            <Layout className="h-14 w-14 mx-auto text-muted-foreground/20 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Nenhuma coleção criada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie coleções como "Dunks", "Jordan Retro" ou "Raros" para organizar seus anúncios.
            </p>
            <Button className="btn-gold gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Criar primeira coleção
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {collections.map((col) => {
              const listingCount = (col.listing_ids || []).length;
              const previewListings = activeListings.filter(l => col.listing_ids?.includes(l.id)).slice(0, 4);

              return (
                <motion.div
                  key={col.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="border-border/20 hover:border-primary/20 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Drag handle */}
                        <div className="mt-1">
                          <GripVertical className="h-4 w-4 text-muted-foreground/30" />
                        </div>

                        {/* Cover image or placeholder */}
                        <div className="w-16 h-16 rounded-xl bg-muted/30 flex items-center justify-center shrink-0 overflow-hidden">
                          {col.cover_image ? (
                            <img src={col.cover_image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Layout className="h-6 w-6 text-muted-foreground/30" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-sm truncate">{col.name}</h4>
                            <Badge variant={col.is_active ? "success" : "outline"} className="text-[10px]">
                              {col.is_active ? "Ativa" : "Oculta"}
                            </Badge>
                          </div>
                          {col.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{col.description}</p>
                          )}
                          <div className="flex items-center gap-1">
                            {previewListings.map(l => (
                              <div key={l.id} className="w-8 h-8 rounded-md bg-muted/50 overflow-hidden">
                                {l.photos?.[0] ? (
                                  <img src={l.photos[0]} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xs flex items-center justify-center h-full">👟</span>
                                )}
                              </div>
                            ))}
                            {listingCount > 4 && (
                              <span className="text-[10px] text-muted-foreground ml-1">+{listingCount - 4}</span>
                            )}
                            {listingCount === 0 && (
                              <span className="text-[10px] text-muted-foreground">Nenhum anúncio</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={col.is_active}
                            onCheckedChange={() => handleToggleActive(col)}
                            className="scale-75"
                          />
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(col)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(col.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar coleção" : "Nova coleção"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <Label>Nome da coleção</Label>
              <Input
                placeholder="Ex: Dunks Essenciais"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea
                placeholder="Uma breve descrição da coleção..."
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1"
                rows={2}
              />
            </div>

            {/* Select listings */}
            <div>
              <Label className="mb-2 block">
                Anúncios na coleção ({form.listing_ids.length})
              </Label>
              {activeListings.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum anúncio ativo disponível.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
                  {activeListings.map(listing => {
                    const selected = form.listing_ids.includes(listing.id);
                    return (
                      <button
                        key={listing.id}
                        type="button"
                        onClick={() => toggleListing(listing.id)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                          selected ? "border-primary ring-1 ring-primary/30" : "border-border/20 hover:border-border/50"
                        }`}
                      >
                        <div className="aspect-square bg-muted/30">
                          {listing.photos?.[0] ? (
                            <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="flex items-center justify-center h-full text-2xl opacity-20">👟</span>
                          )}
                        </div>
                        <div className="p-1.5">
                          <p className="text-[10px] font-medium line-clamp-1">{listing.title}</p>
                          <p className="text-[9px] text-muted-foreground">R$ {listing.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        {selected && (
                          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground text-[10px]">✓</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <Button className="w-full btn-gold gap-2" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editing ? "Salvar alterações" : "Criar coleção"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
