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
  Plus,
  Edit,
  RefreshCw,
  FileText,
  Eye,
  Trash2,
  Send,
} from "lucide-react";
import { formatDate } from "@/lib/constants";

type IntelPostType = "RADAR" | "GUIDE" | "ALERT" | "EVENT";
type IntelVisibility = "ALL" | "PRIVILEGE_PLUS" | "BLACK_ONLY";

interface IntelPost {
  id: string;
  type: IntelPostType;
  title: string;
  content: string;
  visibility: IntelVisibility | null;
  status: string | null;
  published_at: string | null;
  created_at: string | null;
}

const typeLabels: Record<IntelPostType, string> = {
  RADAR: "Radar",
  GUIDE: "Guia",
  ALERT: "Alerta",
  EVENT: "Evento",
};

const typeColors: Record<IntelPostType, string> = {
  RADAR: "bg-blue-500",
  GUIDE: "bg-purple-500",
  ALERT: "bg-red-500",
  EVENT: "bg-green-500",
};

const visibilityLabels: Record<IntelVisibility, string> = {
  ALL: "Todos",
  PRIVILEGE_PLUS: "Privilege+",
  BLACK_ONLY: "Black only",
};

const VaultIntelAdminPage = () => {
  const [posts, setPosts] = useState<IntelPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPost, setSelectedPost] = useState<IntelPost | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [form, setForm] = useState({
    type: "RADAR" as IntelPostType,
    title: "",
    content: "",
    visibility: "ALL" as IntelVisibility,
    status: "DRAFT",
    cover_image: "",
    video_url: "",
    external_link: "",
    excerpt: "",
    read_time_min: 2,
    is_featured: false,
  });

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("vault_intel_posts")
        .select("*")
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

  const handleCreate = async () => {
    if (!form.title || !form.content) {
      toast.error("Preencha título e conteúdo");
      return;
    }

    try {
      const { error } = await supabase.from("vault_intel_posts").insert({
        type: form.type,
        title: form.title,
        content: form.content,
        visibility: form.visibility,
        status: form.status,
        published_at: form.status === "PUBLISHED" ? new Date().toISOString() : null,
        cover_image: form.cover_image || null,
        video_url: form.video_url || null,
        external_link: form.external_link || null,
        excerpt: form.excerpt || null,
        read_time_min: form.read_time_min || 2,
        is_featured: form.is_featured,
      });

      if (error) throw error;

      toast.success("Drop criado com sucesso");
      setIsCreateOpen(false);
      setForm({
        type: "RADAR",
        title: "",
        content: "",
        visibility: "ALL",
        status: "DRAFT",
        cover_image: "",
        video_url: "",
        external_link: "",
        excerpt: "",
        read_time_min: 2,
        is_featured: false,
      });
      fetchPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Erro ao criar drop");
    }
  };

  const handleUpdate = async () => {
    if (!selectedPost) return;

    try {
      const { error } = await supabase
        .from("vault_intel_posts")
        .update({
          type: form.type,
          title: form.title,
          content: form.content,
          visibility: form.visibility,
          status: form.status,
          cover_image: form.cover_image || null,
          video_url: form.video_url || null,
          external_link: form.external_link || null,
          excerpt: form.excerpt || null,
          read_time_min: form.read_time_min || 2,
          is_featured: form.is_featured,
          published_at:
            form.status === "PUBLISHED" && !selectedPost.published_at
              ? new Date().toISOString()
              : selectedPost.published_at,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedPost.id);

      if (error) throw error;

      toast.success("Post atualizado");
      setIsEditOpen(false);
      fetchPosts();
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Erro ao atualizar post");
    }
  };

  const handleDelete = async (post: IntelPost) => {
    if (!confirm("Tem certeza que deseja excluir este post?")) return;

    try {
      const { error } = await supabase
        .from("vault_intel_posts")
        .delete()
        .eq("id", post.id);

      if (error) throw error;

      toast.success("Post excluído");
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Erro ao excluir post");
    }
  };

  const handlePublish = async (post: IntelPost) => {
    try {
      const { error } = await supabase
        .from("vault_intel_posts")
        .update({
          status: "PUBLISHED",
          published_at: new Date().toISOString(),
        })
        .eq("id", post.id);

      if (error) throw error;

      toast.success("Post publicado");
      fetchPosts();
    } catch (error) {
      console.error("Error publishing post:", error);
      toast.error("Erro ao publicar post");
    }
  };

  const openEdit = (post: IntelPost) => {
    setSelectedPost(post);
    setForm({
      type: post.type,
      title: post.title,
      content: post.content,
      visibility: post.visibility || "ALL",
      status: post.status || "DRAFT",
      cover_image: (post as any).cover_image || "",
      video_url: (post as any).video_url || "",
      external_link: (post as any).external_link || "",
      excerpt: (post as any).excerpt || "",
      read_time_min: (post as any).read_time_min || 2,
      is_featured: (post as any).is_featured || false,
    });
    setIsEditOpen(true);
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || post.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: posts.length,
    published: posts.filter((p) => p.status === "PUBLISHED").length,
    draft: posts.filter((p) => p.status === "DRAFT").length,
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
          <h1 className="text-2xl font-bold">Drops</h1>
          <p className="text-muted-foreground">
            Gerencie os conteúdos exclusivos do Vault Club
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchPosts} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo post
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-emerald-500" />
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
              <Edit className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats.draft}</p>
                <p className="text-xs text-muted-foreground">Rascunhos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
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
            <SelectItem value="PUBLISHED">Publicados</SelectItem>
            <SelectItem value="DRAFT">Rascunhos</SelectItem>
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
                <TableHead>Visibilidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Publicado em</TableHead>
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
                  <TableRow key={post.id}>
                    <TableCell>
                      <Badge className={typeColors[post.type]}>
                        {typeLabels[post.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{post.title}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {visibilityLabels[post.visibility || "ALL"]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          post.status === "PUBLISHED" ? "default" : "secondary"
                        }
                      >
                        {post.status === "PUBLISHED" ? "Publicado" : "Rascunho"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {post.published_at ? formatDate(post.published_at) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(post)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {post.status !== "PUBLISHED" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePublish(post)}
                            className="text-emerald-500"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(post)}
                          className="text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar drop</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    setForm({ ...form, type: value as IntelPostType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RADAR">Radar</SelectItem>
                    <SelectItem value="GUIDE">Guia</SelectItem>
                    <SelectItem value="ALERT">Alerta</SelectItem>
                    <SelectItem value="EVENT">Evento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Visibilidade</label>
                <Select
                  value={form.visibility}
                  onValueChange={(value) =>
                    setForm({ ...form, visibility: value as IntelVisibility })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os membros</SelectItem>
                    <SelectItem value="PRIVILEGE_PLUS">
                      Privilege e Black
                    </SelectItem>
                    <SelectItem value="BLACK_ONLY">Apenas Black</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Título do post"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Conteúdo (HTML)</label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Conteúdo do drop... Suporta HTML (negrito, links, imagens inline)"
                rows={8}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Resumo (exibido nos cards)</label>
              <Input
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                placeholder="Breve resumo do conteúdo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">URL da capa</label>
                <Input
                  value={form.cover_image}
                  onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                  placeholder="https://... (imagem de capa)"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL do vídeo</label>
                <Input
                  value={form.video_url}
                  onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                  placeholder="YouTube ou link direto"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Link externo</label>
                <Input
                  value={form.external_link}
                  onChange={(e) => setForm({ ...form, external_link: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tempo de leitura (min)</label>
                <Input
                  type="number"
                  value={form.read_time_min}
                  onChange={(e) => setForm({ ...form, read_time_min: parseInt(e.target.value) || 2 })}
                  min={1}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_featured_create"
                checked={form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="is_featured_create" className="text-sm font-medium">Destaque (hero card)</label>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setForm({ ...form, status: "DRAFT" });
                  handleCreate();
                }}
              >
                Salvar rascunho
              </Button>
              <Button
                onClick={() => {
                  setForm({ ...form, status: "PUBLISHED" });
                  handleCreate();
                }}
              >
                Publicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar drop</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    setForm({ ...form, type: value as IntelPostType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RADAR">Radar</SelectItem>
                    <SelectItem value="GUIDE">Guia</SelectItem>
                    <SelectItem value="ALERT">Alerta</SelectItem>
                    <SelectItem value="EVENT">Evento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Visibilidade</label>
                <Select
                  value={form.visibility}
                  onValueChange={(value) =>
                    setForm({ ...form, visibility: value as IntelVisibility })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os membros</SelectItem>
                    <SelectItem value="PRIVILEGE_PLUS">Privilege e Black</SelectItem>
                    <SelectItem value="BLACK_ONLY">Apenas Black</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Conteúdo (HTML)</label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={8}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Resumo</label>
              <Input
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                placeholder="Breve resumo do conteúdo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">URL da capa</label>
                <Input
                  value={form.cover_image}
                  onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL do vídeo</label>
                <Input
                  value={form.video_url}
                  onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                  placeholder="YouTube ou link direto"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Link externo</label>
                <Input
                  value={form.external_link}
                  onChange={(e) => setForm({ ...form, external_link: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tempo de leitura (min)</label>
                <Input
                  type="number"
                  value={form.read_time_min}
                  onChange={(e) => setForm({ ...form, read_time_min: parseInt(e.target.value) || 2 })}
                  min={1}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_featured_edit"
                checked={form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="is_featured_edit" className="text-sm font-medium">Destaque (hero card)</label>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VaultIntelAdminPage;
