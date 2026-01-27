import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Edit2,
  Trash2,
  HelpCircle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

const CATEGORIES = [
  { value: "importacao", label: "Importação" },
  { value: "pagamento", label: "Pagamento" },
  { value: "garantia", label: "Garantia" },
  { value: "envio", label: "Envio" },
  { value: "geral", label: "Geral" },
];

const emptyFAQ: Partial<FAQ> = {
  category: "geral",
  question: "",
  answer: "",
  order_index: 0,
  is_active: true,
};

export function FAQSettingsTab() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<Partial<FAQ> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("category")
        .order("order_index");

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as FAQs.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (faq?: FAQ) => {
    if (faq) {
      setEditingFAQ(faq);
    } else {
      const maxOrder = Math.max(...faqs.map((f) => f.order_index), -1);
      setEditingFAQ({ ...emptyFAQ, order_index: maxOrder + 1 });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingFAQ?.question || !editingFAQ?.answer) {
      toast({
        title: "Campos obrigatórios",
        description: "Pergunta e resposta são obrigatórias.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingFAQ.id) {
        const { error } = await supabase
          .from("faqs")
          .update({
            category: editingFAQ.category,
            question: editingFAQ.question,
            answer: editingFAQ.answer,
            order_index: editingFAQ.order_index,
            is_active: editingFAQ.is_active,
          })
          .eq("id", editingFAQ.id);

        if (error) throw error;
        toast({ title: "FAQ atualizada com sucesso!" });
      } else {
        const { error } = await supabase
          .from("faqs")
          .insert([{
            category: editingFAQ.category || "geral",
            question: editingFAQ.question!,
            answer: editingFAQ.answer!,
            order_index: editingFAQ.order_index ?? 0,
            is_active: editingFAQ.is_active ?? true,
          }]);

        if (error) throw error;
        toast({ title: "FAQ criada com sucesso!" });
      }

      setIsDialogOpen(false);
      fetchFAQs();
    } catch (error) {
      console.error("Error saving FAQ:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a FAQ.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta FAQ?")) return;

    try {
      const { error } = await supabase
        .from("faqs")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "FAQ excluída com sucesso!" });
      fetchFAQs();
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a FAQ.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("faqs")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;
      fetchFAQs();
    } catch (error) {
      console.error("Error toggling FAQ:", error);
    }
  };

  const handleMoveOrder = async (id: string, direction: "up" | "down") => {
    const currentFAQ = faqs.find((f) => f.id === id);
    if (!currentFAQ) return;

    const sameCategoryFAQs = faqs
      .filter((f) => f.category === currentFAQ.category)
      .sort((a, b) => a.order_index - b.order_index);

    const currentIndex = sameCategoryFAQs.findIndex((f) => f.id === id);
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (swapIndex < 0 || swapIndex >= sameCategoryFAQs.length) return;

    const swapFAQ = sameCategoryFAQs[swapIndex];

    try {
      await supabase
        .from("faqs")
        .update({ order_index: swapFAQ.order_index })
        .eq("id", currentFAQ.id);

      await supabase
        .from("faqs")
        .update({ order_index: currentFAQ.order_index })
        .eq("id", swapFAQ.id);

      fetchFAQs();
    } catch (error) {
      console.error("Error reordering FAQs:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find((c) => c.value === value)?.label || value;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Gerenciar FAQ</h2>
          <p className="text-sm text-muted-foreground">
            Perguntas frequentes exibidas na homepage
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="btn-gold">
          <Plus className="mr-2 h-4 w-4" />
          Nova Pergunta
        </Button>
      </div>

      <Card className="card-premium">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Pergunta</TableHead>
                <TableHead>Resposta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faqs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Nenhuma FAQ cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                faqs.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveOrder(faq.id, "up")}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveOrder(faq.id, "down")}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryLabel(faq.category)}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate font-medium">{faq.question}</p>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-muted-foreground">{faq.answer}</p>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={faq.is_active}
                        onCheckedChange={() => handleToggleActive(faq.id, faq.is_active)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(faq)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(faq.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingFAQ?.id ? "Editar FAQ" : "Nova FAQ"}
            </DialogTitle>
            <DialogDescription>
              Preencha a pergunta e resposta
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={editingFAQ?.category || "geral"}
                onValueChange={(value) => setEditingFAQ({ ...editingFAQ, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="question">Pergunta *</Label>
              <Input
                id="question"
                value={editingFAQ?.question || ""}
                onChange={(e) => setEditingFAQ({ ...editingFAQ, question: e.target.value })}
                placeholder="Como funciona a importação?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">Resposta *</Label>
              <Textarea
                id="answer"
                value={editingFAQ?.answer || ""}
                onChange={(e) => setEditingFAQ({ ...editingFAQ, answer: e.target.value })}
                placeholder="Explique detalhadamente a resposta..."
                rows={5}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={editingFAQ?.is_active ?? true}
                onCheckedChange={(checked) => setEditingFAQ({ ...editingFAQ, is_active: checked })}
              />
              <Label htmlFor="is_active">FAQ ativa (visível na homepage)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="btn-gold">
              {editingFAQ?.id ? "Salvar Alterações" : "Criar FAQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
