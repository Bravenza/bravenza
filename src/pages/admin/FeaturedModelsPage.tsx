import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, GripVertical, Image, Pencil, Upload, Loader2, Link, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { SNEAKER_BRANDS } from "@/lib/sneaker-data";

interface FeaturedModel {
  id: string;
  name: string;
  brand: string;
  image_url: string;
  is_active: boolean;
  order_index: number;
}

const FeaturedModelsPage = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<FeaturedModel | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    image_url: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [imageInputMode, setImageInputMode] = useState<"upload" | "url">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedItem, setDraggedItem] = useState<FeaturedModel | null>(null);

  const { data: models, isLoading } = useQuery({
    queryKey: ["admin-featured-models"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("featured_models")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as FeaturedModel[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; brand: string; image_url: string }) => {
      const maxOrder = models?.reduce((max, m) => Math.max(max, m.order_index), 0) ?? 0;
      const { error } = await supabase.from("featured_models").insert({
        ...data,
        order_index: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-featured-models"] });
      setIsDialogOpen(false);
      resetForm();
      toast.success("Modelo adicionado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao adicionar modelo");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; brand: string; image_url: string }) => {
      const { error } = await supabase.from("featured_models").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-featured-models"] });
      setEditingModel(null);
      resetForm();
      toast.success("Modelo atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar modelo");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("featured_models").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-featured-models"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("featured_models").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-featured-models"] });
      toast.success("Modelo removido!");
    },
    onError: () => {
      toast.error("Erro ao remover modelo");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; order_index: number }[]) => {
      // Execute all updates in parallel for better performance
      const promises = updates.map((update) =>
        supabase
          .from("featured_models")
          .update({ order_index: update.order_index })
          .eq("id", update.id)
      );
      const results = await Promise.all(promises);
      const error = results.find((r) => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-featured-models"] });
    },
    onError: () => {
      toast.error("Erro ao reordenar modelos");
    },
  });

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    if (!models || fromIndex === toIndex) return;
    
    const newModels = [...models];
    const [movedItem] = newModels.splice(fromIndex, 1);
    newModels.splice(toIndex, 0, movedItem);
    
    const updates = newModels.map((model, index) => ({
      id: model.id,
      order_index: index + 1,
    }));
    
    reorderMutation.mutate(updates);
    toast.success("Ordem atualizada!");
  }, [models, reorderMutation]);

  const handleDragStart = (e: React.DragEvent, model: FeaturedModel) => {
    setDraggedItem(model);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetModel: FeaturedModel) => {
    e.preventDefault();
    if (!draggedItem || !models) return;
    
    const fromIndex = models.findIndex(m => m.id === draggedItem.id);
    const toIndex = models.findIndex(m => m.id === targetModel.id);
    
    if (fromIndex !== toIndex) {
      moveItem(fromIndex, toIndex);
    }
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const resetForm = () => {
    setFormData({ name: "", brand: "", image_url: "" });
    setImageInputMode("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Arquivo inválido. Selecione uma imagem.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("featured-models")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from("featured-models")
        .getPublicUrl(data.path);

      setFormData({ ...formData, image_url: publicUrl.publicUrl });
      toast.success("Imagem enviada!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar imagem");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.brand || !formData.image_url) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (editingModel) {
      updateMutation.mutate({ id: editingModel.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const startEdit = (model: FeaturedModel) => {
    setEditingModel(model);
    setFormData({
      name: model.name,
      brand: model.brand,
      image_url: model.image_url,
    });
    setIsDialogOpen(true);
  };

  const brands = SNEAKER_BRANDS.filter(b => b.value !== "other");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Image className="h-6 w-6" />
            Modelos em Destaque
          </h1>
          <p className="text-muted-foreground">
            Gerencie os modelos exibidos na página inicial
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingModel(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Modelo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingModel ? "Editar Modelo" : "Adicionar Modelo"}</DialogTitle>
              <DialogDescription>
                {editingModel ? "Atualize as informações do modelo" : "Adicione um novo modelo para exibir na home"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <select
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Selecione uma marca</option>
                  {brands.map((brand) => (
                    <option key={brand.value} value={brand.label}>
                      {brand.label}
                    </option>
                  ))}
                  <option value="Outro">Outra marca</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome do Modelo</Label>
                <Input
                  id="name"
                  placeholder="Ex: Air Jordan 1 Retro High OG"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Imagem</Label>
                <Tabs value={imageInputMode} onValueChange={(v) => setImageInputMode(v as "upload" | "url")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload
                    </TabsTrigger>
                    <TabsTrigger value="url" className="flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      URL
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full border-dashed"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Selecionar Imagem
                        </>
                      )}
                    </Button>
                  </TabsContent>
                  <TabsContent value="url" className="space-y-3">
                    <Input
                      placeholder="https://..."
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    />
                  </TabsContent>
                </Tabs>
                
                {formData.image_url && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-border aspect-square w-32">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingModel ? "Salvar" : "Adicionar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modelos Cadastrados</CardTitle>
          <CardDescription>
            {models?.length ?? 0} modelo(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-secondary animate-pulse rounded-lg" />
              ))}
            </div>
          ) : models && models.length > 0 ? (
            <div className="space-y-3">
              {models.map((model, index) => (
                <div
                  key={model.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, model)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, model)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-4 p-3 bg-secondary/30 rounded-lg border transition-all select-none ${
                    draggedItem?.id === model.id 
                      ? "border-primary opacity-50" 
                      : "border-border/50 hover:border-border"
                  }`}
                >
                  <div 
                    className="cursor-grab active:cursor-grabbing p-1"
                    onMouseDown={(e) => e.currentTarget.parentElement?.setAttribute('draggable', 'true')}
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      disabled={index === 0 || reorderMutation.isPending}
                      onClick={() => moveItem(index, index - 1)}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      disabled={index === models.length - 1 || reorderMutation.isPending}
                      onClick={() => moveItem(index, index + 1)}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0 pointer-events-none">
                    <img
                      src={model.image_url}
                      alt={model.name}
                      className="w-full h-full object-cover"
                      draggable={false}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-primary font-medium uppercase">{model.brand}</p>
                    <h4 className="font-semibold text-foreground truncate">{model.name}</h4>
                    <p className="text-xs text-muted-foreground">Posição: {index + 1}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={model.is_active}
                      onCheckedChange={(checked) =>
                        toggleActiveMutation.mutate({ id: model.id, is_active: checked })
                      }
                    />
                    <span className="text-xs text-muted-foreground w-12">
                      {model.is_active ? "Ativo" : "Oculto"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(model)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Remover este modelo?")) {
                          deleteMutation.mutate(model.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Image className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum modelo cadastrado</p>
              <p className="text-sm">Adicione modelos para exibi-los na página inicial</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FeaturedModelsPage;
