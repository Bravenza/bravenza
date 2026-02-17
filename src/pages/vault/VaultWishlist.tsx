import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Search, Plus, ListFilter, ArrowRight, Clock, CheckCircle2, 
  AlertCircle, Play, Pause, MessageSquare, ChevronRight, Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "@/hooks/useClientAuth";

interface WishlistItem {
  id: string;
  title: string;
  product_brand: string;
  product_model: string;
  product_size: string;
  product_color: string;
  condition_pref: string;
  urgency_level: string;
  priority: number;
  min_price: number | null;
  max_price: number | null;
  notes: string;
  created_at: string;
}

interface SearchItem {
  search_id: string;
  wishlist_title: string;
  status: string;
  is_active: boolean;
  started_at: string;
  last_update_at: string;
  has_match_room: boolean;
  match_room_id: string | null;
  decision_status: string | null;
}

interface VaultMember {
  id: string;
  max_wishlist_items: number;
  max_active_hunts: number;
  active_hunts: number;
  flags_review_mode_until: string | null;
}

const searchStatusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  RECEIVED: { label: "Recebida", color: "text-blue-400", bgColor: "bg-blue-500/10" },
  IN_CURATION: { label: "Em curadoria", color: "text-amber-400", bgColor: "bg-amber-500/10" },
  OPTIONS_IDENTIFIED: { label: "Opções encontradas", color: "text-purple-400", bgColor: "bg-purple-500/10" },
  VALIDATING: { label: "Validando", color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
  MATCH_SENT: { label: "Match enviado", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
  AWAITING_DECISION: { label: "Aguardando decisão", color: "text-orange-400", bgColor: "bg-orange-500/10" },
  CLOSED_APPROVED: { label: "Aprovada", color: "text-green-400", bgColor: "bg-green-500/10" },
  CLOSED_NOT_FOUND: { label: "Não encontrado", color: "text-zinc-400", bgColor: "bg-zinc-500/10" },
  CLOSED_CANCELLED: { label: "Cancelada", color: "text-red-400", bgColor: "bg-red-500/10" },
};

export default function VaultWishlist() {
  const { session } = useClientAuth();
  const context = useOutletContext<{ member: VaultMember | null }>();
  const { toast } = useToast();
  
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [searches, setSearches] = useState<SearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const [newItem, setNewItem] = useState({
    title: "",
    brand: "",
    model: "",
    size: "",
    color: "",
    condition: "DS",
    urgency: "FLEXIBLE",
    priority: 3,
    min_price: "",
    max_price: "",
    notes: "",
  });

  useEffect(() => {
    if (session?.cpf) {
      fetchData();
    }
  }, [session?.cpf]);

  const fetchData = async () => {
    if (!session?.cpf) return;
    
    setIsLoading(true);
    try {
      // Fetch wishlist items using RPC
      const { data: wishlists, error: wishlistError } = await supabase
        .rpc("get_vault_member_wishlists", { p_cpf: session.cpf });
      
      if (!wishlistError && wishlists) {
        setWishlistItems(wishlists.map((w: any) => ({
          id: w.id,
          title: w.title,
          product_brand: w.product_brand,
          product_model: w.product_model,
          product_size: w.product_size,
          product_color: w.product_color,
          condition_pref: w.condition_pref || "DS",
          urgency_level: w.urgency_level || "FLEXIBLE",
          priority: w.priority || 3,
          min_price: w.min_price,
          max_price: w.max_price,
          notes: w.notes,
          created_at: w.created_at,
        })));
      }

      // Fetch searches
      const { data: searchData } = await supabase
        .rpc("get_vault_member_searches", { p_cpf: session.cpf });
      
      if (searchData) {
        setSearches(searchData as unknown as SearchItem[]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.title || !newItem.size) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha pelo menos o nome e tamanho",
        variant: "destructive",
      });
      return;
    }

    setIsAddingItem(true);
    
    try {
      const { error } = await supabase.rpc("create_vault_wishlist_item", {
        p_cpf: session?.cpf,
        p_title: newItem.title,
        p_brand: newItem.brand || null,
        p_model: newItem.model || null,
        p_size: newItem.size,
        p_color: newItem.color || null,
        p_condition: newItem.condition,
        p_urgency: newItem.urgency,
        p_priority: newItem.priority,
        p_min_price: newItem.min_price ? parseFloat(newItem.min_price) : null,
        p_max_price: newItem.max_price ? parseFloat(newItem.max_price) : null,
        p_notes: newItem.notes || null,
      });

      if (error) throw error;

      toast({
        title: "Item adicionado!",
        description: "O item foi adicionado à sua wishlist",
      });

      setShowAddDialog(false);
      setNewItem({
        title: "", brand: "", model: "", size: "", color: "",
        condition: "DS", urgency: "FLEXIBLE", priority: 3,
        min_price: "", max_price: "", notes: "",
      });
      fetchData();
    } catch (error: any) {
      console.error("Error adding item:", error);
      toast({
        title: "Erro ao adicionar",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsAddingItem(false);
    }
  };

  const startSearch = async (wishlistId: string) => {
    if (!session?.cpf) return;

    try {
      const { error } = await supabase.rpc("start_vault_search", {
        p_cpf: session.cpf,
        p_wishlist_id: wishlistId,
      });

      if (error) throw error;

      toast({
        title: "Busca iniciada!",
        description: "Nossa equipe começará a curadoria em breve",
      });

      fetchData();
    } catch (error: any) {
      console.error("Error starting search:", error);
      toast({
        title: "Erro ao iniciar busca",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const activeSearches = searches.filter(s => s.is_active);
  const closedSearches = searches.filter(s => !s.is_active);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Wishlist e buscas</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie seus itens desejados e acompanhe buscas ativas
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4" />
              Adicionar item
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar à wishlist</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>Nome do sneaker *</Label>
                <Input
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="Ex: Air Jordan 1 High OG 'Chicago'"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Input
                    value={newItem.brand}
                    onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })}
                    placeholder="Nike, adidas..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tamanho *</Label>
                  <Input
                    value={newItem.size}
                    onChange={(e) => setNewItem({ ...newItem, size: e.target.value })}
                    placeholder="42, 10 US..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Condição</Label>
                  <Select 
                    value={newItem.condition} 
                    onValueChange={(v) => setNewItem({ ...newItem, condition: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DS">DS (Deadstock)</SelectItem>
                      <SelectItem value="VNDS">VNDS (Very Near DS)</SelectItem>
                      <SelectItem value="USED_OK">Usado OK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Urgência</Label>
                  <Select 
                    value={newItem.urgency} 
                    onValueChange={(v) => setNewItem({ ...newItem, urgency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOW">Urgente</SelectItem>
                      <SelectItem value="FLEXIBLE">Flexível</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço mínimo (R$)</Label>
                  <Input
                    type="number"
                    value={newItem.min_price}
                    onChange={(e) => setNewItem({ ...newItem, min_price: e.target.value })}
                    placeholder="500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço máximo (R$)</Label>
                  <Input
                    type="number"
                    value={newItem.max_price}
                    onChange={(e) => setNewItem({ ...newItem, max_price: e.target.value })}
                    placeholder="2000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  placeholder="Detalhes adicionais..."
                />
              </div>

              <Button
                onClick={handleAddItem}
                disabled={isAddingItem}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isAddingItem ? "Adicionando..." : "Adicionar à wishlist"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="wishlist" className="space-y-6">
        <TabsList>
          <TabsTrigger value="wishlist">
            Wishlist ({wishlistItems.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Buscas ativas ({activeSearches.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Histórico ({closedSearches.length})
          </TabsTrigger>
        </TabsList>

        {/* Wishlist Tab */}
        <TabsContent value="wishlist" className="space-y-4">
          {wishlistItems.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">Sua wishlist está vazia</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Adicione itens para começar uma busca</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {wishlistItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-card border-border hover:border-border/80 transition">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{item.title}</h3>
                            {item.urgency_level === "NOW" && (
                              <Badge className="bg-destructive/10 text-destructive border-0">Urgente</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {[item.product_brand, `Tam. ${item.product_size}`, item.condition_pref]
                              .filter(Boolean)
                              .join(" • ")}
                          </p>
                          {(item.min_price || item.max_price) && (
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              Faixa: {item.min_price ? `R$ ${item.min_price}` : "?"} - {item.max_price ? `R$ ${item.max_price}` : "?"}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => startSearch(item.id)}
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
                        >
                          <Play className="h-4 w-4" />
                          Iniciar busca
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Active Searches Tab */}
        <TabsContent value="active" className="space-y-4">
          {activeSearches.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma busca ativa</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Inicie uma busca a partir da sua wishlist</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeSearches.map((search, index) => {
                const statusInfo = searchStatusConfig[search.status] || searchStatusConfig.RECEIVED;
                
                return (
                  <motion.div
                    key={search.search_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={`/vault/app/search/${search.search_id}`}>
                      <Card className="bg-card border-border hover:border-primary/50 transition cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold truncate">{search.wishlist_title}</h3>
                                <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-0`}>
                                  {statusInfo.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Última atualização: {new Date(search.last_update_at).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {search.has_match_room && search.decision_status === "PENDING" && (
                                <Badge className="bg-success/10 text-success border-0">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  Match disponível
                                </Badge>
                              )}
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {closedSearches.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma busca finalizada</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {closedSearches.map((search, index) => {
                const statusInfo = searchStatusConfig[search.status] || searchStatusConfig.CLOSED_CANCELLED;
                
                return (
                  <motion.div
                    key={search.search_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium truncate text-foreground/80">{search.wishlist_title}</h3>
                              <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-0`}>
                                {statusInfo.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(search.started_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}