import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Star,
  MessageSquare,
  Check,
  X,
  Trash2,
  Reply,
  Award,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface Review {
  id: string;
  order_id: string;
  client_cpf: string;
  client_name: string;
  rating: number;
  comment: string | null;
  product_quality: number | null;
  delivery_speed: number | null;
  customer_service: number | null;
  would_recommend: boolean;
  is_approved: boolean;
  is_featured: boolean;
  admin_response: string | null;
  admin_response_at: string | null;
  created_at: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const fetchReviews = async () => {
    try {
      let query = supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter === "pending") {
        query = query.eq("is_approved", false);
      } else if (statusFilter === "approved") {
        query = query.eq("is_approved", true);
      } else if (statusFilter === "featured") {
        query = query.eq("is_featured", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as avaliações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string, approve: boolean) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ is_approved: approve })
        .eq("id", id);

      if (error) throw error;
      toast({ title: approve ? "Avaliação aprovada!" : "Avaliação reprovada!" });
      fetchReviews();
    } catch (error) {
      console.error("Error updating review:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a avaliação.",
        variant: "destructive",
      });
    }
  };

  const handleToggleFeatured = async (id: string, isFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ is_featured: !isFeatured })
        .eq("id", id);

      if (error) throw error;
      fetchReviews();
    } catch (error) {
      console.error("Error toggling featured:", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast({ title: "Avaliação excluída com sucesso!" });
      fetchReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a avaliação.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleOpenReplyDialog = (review: Review) => {
    setSelectedReview(review);
    setReplyText(review.admin_response || "");
    setReplyDialogOpen(true);
  };

  const handleSaveReply = async () => {
    if (!selectedReview) return;

    try {
      const { error } = await supabase
        .from("reviews")
        .update({
          admin_response: replyText || null,
          admin_response_at: replyText ? new Date().toISOString() : null,
        })
        .eq("id", selectedReview.id);

      if (error) throw error;
      toast({ title: "Resposta salva com sucesso!" });
      setReplyDialogOpen(false);
      fetchReviews();
    } catch (error) {
      console.error("Error saving reply:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a resposta.",
        variant: "destructive",
      });
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      review.client_name.toLowerCase().includes(search) ||
      review.order_id.toLowerCase().includes(search) ||
      review.comment?.toLowerCase().includes(search)
    );
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-500 text-yellow-500"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Avaliações</h1>
          <p className="text-muted-foreground">
            Gerencie as avaliações dos clientes
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{reviews.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {reviews.filter((r) => !r.is_approved).length}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aprovadas</p>
                <p className="text-2xl font-bold text-green-500">
                  {reviews.filter((r) => r.is_approved).length}
                </p>
              </div>
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Média</p>
                <p className="text-2xl font-bold text-primary">
                  {reviews.length > 0
                    ? (
                        reviews.reduce((acc, r) => acc + r.rating, 0) /
                        reviews.length
                      ).toFixed(1)
                    : "-"}
                </p>
              </div>
              <Award className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-premium">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, pedido ou comentário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="approved">Aprovadas</SelectItem>
                <SelectItem value="featured">Destacadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card className="card-premium">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead>Comentário</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Nenhuma avaliação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{review.client_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {review.would_recommend ? "✓ Recomendaria" : "✗ Não recomendaria"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-secondary px-2 py-1 rounded">
                        {review.order_id}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {renderStars(review.rating)}
                        {review.product_quality && (
                          <p className="text-xs text-muted-foreground">
                            Produto: {review.product_quality}/5
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate">{review.comment || "-"}</p>
                      {review.admin_response && (
                        <p className="text-xs text-primary mt-1">
                          ↪ Respondido
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {format(new Date(review.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant={review.is_approved ? "default" : "secondary"}
                          className={review.is_approved ? "bg-green-500/20 text-green-400" : ""}
                        >
                          {review.is_approved ? "Aprovada" : "Pendente"}
                        </Badge>
                        {review.is_featured && (
                          <Badge className="bg-primary/20 text-primary">
                            <Award className="h-3 w-3 mr-1" />
                            Destaque
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {!review.is_approved ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleApprove(review.id, true)}
                            title="Aprovar"
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleApprove(review.id, false)}
                            title="Reprovar"
                          >
                            <X className="h-4 w-4 text-yellow-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleFeatured(review.id, review.is_featured)}
                          title={review.is_featured ? "Remover destaque" : "Destacar"}
                        >
                          <Award
                            className={`h-4 w-4 ${
                              review.is_featured ? "fill-primary text-primary" : ""
                            }`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenReplyDialog(review)}
                          title="Responder"
                        >
                          <Reply className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(review.id)}
                          title="Excluir"
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

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder Avaliação</DialogTitle>
            <DialogDescription>
              Sua resposta será exibida publicamente junto à avaliação
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedReview && (
              <div className="p-4 bg-secondary/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{selectedReview.client_name}</p>
                  {renderStars(selectedReview.rating)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedReview.comment || "Sem comentário"}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reply">Sua Resposta</Label>
              <Textarea
                id="reply"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Obrigado pela sua avaliação! Ficamos felizes em saber que..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveReply} className="btn-gold">
              Salvar Resposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir avaliação?"
        description="Esta ação não pode ser desfeita. A avaliação será removida permanentemente."
        confirmText="Excluir"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
