import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, GripVertical, Image, Eye, EyeOff, Pencil, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

  const resetForm = () => {
    setFormData({ name: "", brand: "", image_url: "" });
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
                <Label htmlFor="image_url">URL da Imagem</Label>
                <Input
                  id="image_url"
                  placeholder="https://..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
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
              {models.map((model) => (
                <div
                  key={model.id}
                  className="flex items-center gap-4 p-3 bg-secondary/30 rounded-lg border border-border/50"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                    <img
                      src={model.image_url}
                      alt={model.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-primary font-medium uppercase">{model.brand}</p>
                    <h4 className="font-semibold text-foreground truncate">{model.name}</h4>
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
