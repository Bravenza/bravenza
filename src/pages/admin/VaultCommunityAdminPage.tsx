import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search,
  RefreshCw,
  MessageSquare,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { formatDate } from "@/lib/constants";

type CommunityPostStatus = "PUBLISHED" | "PENDING_REVIEW" | "REMOVED";
type CommunityPostType = "SHOWCASE" | "DISCUSSION" | "POLL" | "ISO_WTB";

interface CommunityPost {
  id: string;
  user_id: string;
  type: CommunityPostType;
  title: string;
  content: string | null;
  attachments: string[] | null;
  status: CommunityPostStatus | null;
  created_at: string | null;
  moderation_notes: string | null;
  vault_members?: {
    client_name: string;
    tier: string;
  };
}

const typeLabels: Record<CommunityPostType, string> = {
  SHOWCASE: "Showcase",
  DISCUSSION: "Discussão",
  POLL: "Enquete",
  ISO_WTB: "ISO/WTB",
};

const statusLabels: Record<CommunityPostStatus, string> = {
  PUBLISHED: "Publicado",
  PENDING_REVIEW: "Aguardando revisão",
  REMOVED: "Removido",
};

const statusColors: Record<CommunityPostStatus, string> = {
  PUBLISHED: "bg-emerald-600",
  PENDING_REVIEW: "bg-amber-500",
  REMOVED: "bg-red-500",
};

const VaultCommunityAdminPage = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("PENDING_REVIEW");
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [moderationNotes, setModerationNotes] = useState("");

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("vault_community_posts")
        .select(`
          *,
          vault_members (
            client_name,
            tier
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Erro ao carregar posts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleApprove = async (post: CommunityPost) => {
    try {
      const { error } = await supabase
        .from("vault_community_posts")
        .update({
          status: "PUBLISHED",
          moderation_notes: moderationNotes || null,
        })
        .eq("id", post.id);

      if (error) throw error;

      toast.success("Post aprovado");
      setIsDetailOpen(false);
      setModerationNotes("");
      fetchPosts();
    } catch (error) {
      console.error("Error approving post:", error);
      toast.error("Erro ao aprovar post");
    }
  };

  const handleReject = async (post: CommunityPost) => {
    if (!moderationNotes) {
      toast.error("Informe o motivo da remoção");
      return;
    }

    try {
      const { error } = await supabase
        .from("vault_community_posts")
        .update({
          status: "REMOVED",
          moderation_notes: moderationNotes,
        })
        .eq("id", post.id);

      if (error) throw error;

      toast.success("Post removido");
      setIsDetailOpen(false);
      setModerationNotes("");
      fetchPosts();
    } catch (error) {
      console.error("Error rejecting post:", error);
      toast.error("Erro ao remover post");
    }
  };

  const openDetail = (post: CommunityPost) => {
    setSelectedPost(post);
    setModerationNotes(post.moderation_notes || "");
    setIsDetailOpen(true);
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.vault_members?.client_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || post.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: posts.length,
    pending: posts.filter((p) => p.status === "PENDING_REVIEW").length,
    published: posts.filter((p) => p.status === "PUBLISHED").length,
    removed: posts.filter((p) => p.status === "REMOVED").length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Moderação da comunidade</h1>
          <p className="text-muted-foreground">
            Aprove ou remova posts da comunidade
          </p>
        </div>
        <Button onClick={fetchPosts} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.pending > 0 ? "border-amber-500" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className={`h-5 w-5 ${stats.pending > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
              <div>
                <p className={`text-2xl font-bold ${stats.pending > 0 ? "text-amber-500" : ""}`}>
                  {stats.pending}
                </p>
                <p className="text-xs text-muted-foreground">Aguardando</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{stats.published}</p>
                <p className="text-xs text-muted-foreground">Publicados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.removed}</p>
                <p className="text-xs text-muted-foreground">Removidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert for pending posts */}
      {stats.pending > 0 && (
        <Card className="border-amber-500 bg-amber-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <p className="font-medium">
                {stats.pending} post(s) aguardando moderação
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou autor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="PENDING_REVIEW">Aguardando revisão</SelectItem>
            <SelectItem value="PUBLISHED">Publicados</SelectItem>
            <SelectItem value="REMOVED">Removidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nenhum post encontrado
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPosts.map((post) => (
                  <TableRow
                    key={post.id}
                    className={
                      post.status === "PENDING_REVIEW" ? "bg-amber-500/5" : ""
                    }
                  >
                    <TableCell>
                      <Badge variant="outline">{typeLabels[post.type]}</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{post.title}</p>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {post.vault_members?.client_name || "Desconhecido"}
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {post.vault_members?.tier === "elite"
                            ? "Black"
                            : post.vault_members?.tier === "collector"
                            ? "Privilege"
                            : "Access"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={statusColors[post.status || "PENDING_REVIEW"]}
                      >
                        {statusLabels[post.status || "PENDING_REVIEW"]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {post.created_at ? formatDate(post.created_at) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDetail(post)}
                        >
                          <Eye className="h-4 w-4" />
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

      {/* Detail/Moderation Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Moderar post</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Autor</p>
                  <p className="font-medium">
                    {selectedPost.vault_members?.client_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <Badge variant="outline">{typeLabels[selectedPost.type]}</Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Título</p>
                <p className="font-medium">{selectedPost.title}</p>
              </div>

              {selectedPost.content && (
                <div>
                  <p className="text-sm text-muted-foreground">Conteúdo</p>
                  <div className="p-3 bg-secondary rounded-lg mt-1 max-h-48 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedPost.content}
                    </p>
                  </div>
                </div>
              )}

              {selectedPost.attachments &&
                selectedPost.attachments.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Anexos ({selectedPost.attachments.length})
                    </p>
                    <div className="flex gap-2 mt-1">
                      {selectedPost.attachments.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary underline"
                        >
                          Anexo {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Notas de moderação</label>
                <Textarea
                  value={moderationNotes}
                  onChange={(e) => setModerationNotes(e.target.value)}
                  placeholder="Motivo da aprovação/remoção (obrigatório para remoção)"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Cancelar
                </Button>
                {selectedPost.status === "PENDING_REVIEW" && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(selectedPost)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                    <Button onClick={() => handleApprove(selectedPost)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                  </>
                )}
                {selectedPost.status === "PUBLISHED" && (
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(selectedPost)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Remover
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VaultCommunityAdminPage;
