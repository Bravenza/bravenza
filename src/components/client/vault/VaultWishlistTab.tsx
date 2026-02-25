import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Search, Plus, Play, Clock, CheckCircle2, 
  AlertCircle, ChevronRight, MessageSquare, ArrowLeft
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
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
import { MatchRoomView } from "./MatchRoomView";
import { CurationProgressTracker } from "@/components/tracking/CurationProgressTracker";

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
  progress_message?: string | null;
  progress_percentage?: number | null;
}

interface VaultWishlistTabProps {
  clientCpf: string;
}

const searchStatusConfig: Record<string, { label: string; color: string }> = {
  RECEIVED: { label: "Recebida", color: "bg-blue-500/10 text-blue-500" },
  IN_CURATION: { label: "Em curadoria", color: "bg-amber-500/10 text-amber-500" },
  OPTIONS_IDENTIFIED: { label: "Opções encontradas", color: "bg-purple-500/10 text-purple-500" },
  VALIDATING: { label: "Validando", color: "bg-cyan-500/10 text-cyan-500" },
  MATCH_SENT: { label: "Match enviado", color: "bg-emerald-500/10 text-emerald-500" },
  AWAITING_DECISION: { label: "Aguardando decisão", color: "bg-orange-500/10 text-orange-500" },
  CLOSED_APPROVED: { label: "Aprovada", color: "bg-green-500/10 text-green-500" },
  CLOSED_NOT_FOUND: { label: "Não encontrado", color: "bg-muted text-muted-foreground" },
  CLOSED_CANCELLED: { label: "Cancelada", color: "bg-red-500/10 text-red-500" },
};

export function VaultWishlistTab({ clientCpf }: VaultWishlistTabProps) {
  const { toast } = useToast();
  
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [searches, setSearches] = useState<SearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedMatchRoom, setSelectedMatchRoom] = useState<{ id: string; title: string } | null>(null);
  
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
    fetchData();
  }, [clientCpf]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: wishlists, error: wishlistError } = await supabase
        .rpc("get_vault_member_wishlists", { p_cpf: clientCpf });
      
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

      const { data: searchData } = await supabase
        .rpc("get_vault_member_searches", { p_cpf: clientCpf });
      
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
        p_cpf: clientCpf,
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
    try {
      const { error } = await supabase.rpc("start_vault_search", {
        p_cpf: clientCpf,
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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const pendingMatches = activeSearches.filter(
    s => s.has_match_room && s.match_room_id && 
    (s.status === "AWAITING_DECISION" || s.status === "MATCH_SENT")
  );

  return (
    <div className="space-y-4">
      {/* Pending Match Rooms Banner */}
      {pendingMatches.length > 0 && !selectedMatchRoom && (
        <div className="space-y-3">
          {pendingMatches.map((match) => (
            <motion.div
              key={match.search_id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-primary/30 bg-primary/5 cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => setSelectedMatchRoom({ id: match.match_room_id!, title: match.wishlist_title })}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <AlertCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">Match encontrado!</p>
                      <p className="text-xs text-muted-foreground truncate">{match.wishlist_title}</p>
                    </div>
                    <Badge className="bg-primary/20 text-primary animate-pulse">
                      Decidir
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Gerencie seus itens desejados e acompanhe buscas
        </p>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
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
                className="w-full"
              >
                {isAddingItem ? "Adicionando..." : "Adicionar à wishlist"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="wishlist" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
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
        <TabsContent value="wishlist" className="space-y-3">
          {wishlistItems.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Sua wishlist está vazia</p>
                <p className="text-xs text-muted-foreground mt-1">Adicione itens para começar uma busca</p>
              </CardContent>
            </Card>
          ) : (
            wishlistItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{item.title}</h3>
                          {item.urgency_level === "NOW" && (
                            <Badge variant="destructive" className="text-xs">Urgente</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {[item.product_brand, `Tam. ${item.product_size}`, item.condition_pref]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                        {(item.min_price || item.max_price) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Faixa: {item.min_price ? `R$ ${item.min_price}` : "?"} - {item.max_price ? `R$ ${item.max_price}` : "?"}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => startSearch(item.id)}
                        size="sm"
                        className="flex-shrink-0"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Iniciar busca
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        {/* Active Searches Tab */}
        <TabsContent value="active" className="space-y-3">
          {/* Match Room View */}
          {selectedMatchRoom && (
            <div className="space-y-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedMatchRoom(null)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar às buscas
              </Button>
              <MatchRoomView
                clientCpf={clientCpf}
                matchRoomId={selectedMatchRoom.id}
                onDecisionMade={() => {
                  setSelectedMatchRoom(null);
                  fetchData();
                }}
              />
            </div>
          )}

          {/* Searches List */}
          {!selectedMatchRoom && (
            <>
              {activeSearches.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Nenhuma busca ativa</p>
                    <p className="text-xs text-muted-foreground mt-1">Inicie uma busca a partir da sua wishlist</p>
                  </CardContent>
                </Card>
              ) : (
                activeSearches.map((search, index) => {
                  const statusInfo = searchStatusConfig[search.status] || searchStatusConfig.RECEIVED;
                  const hasMatchRoom = search.has_match_room && search.match_room_id;
                  
                  return (
                    <motion.div
                      key={search.search_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Collapsible>
                        <Card 
                          className={hasMatchRoom ? "cursor-pointer hover:border-primary/50 transition" : ""}
                        >
                          <CardContent className="p-4">
                            <CollapsibleTrigger asChild>
                              <div 
                                className="flex items-center justify-between gap-4 cursor-pointer"
                                onClick={(e) => {
                                  if (hasMatchRoom) {
                                    e.stopPropagation();
                                    setSelectedMatchRoom({ 
                                      id: search.match_room_id!, 
                                      title: search.wishlist_title 
                                    });
                                  }
                                }}
                              >
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium truncate">{search.wishlist_title}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                                    {hasMatchRoom && (
                                      <Badge variant="outline" className="border-primary text-primary animate-pulse">
                                        <MessageSquare className="h-3 w-3 mr-1" />
                                        Ver opções
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {hasMatchRoom ? (
                                  <Button size="sm" variant="ghost">
                                    <ChevronRight className="h-5 w-5" />
                                  </Button>
                                ) : (
                                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-90" />
                                )}
                              </div>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <div className="mt-4 pt-4 border-t border-border/20">
                                <CurationProgressTracker
                                  searchId={search.search_id}
                                  initialStatus={search.status as any}
                                  initialProgressMessage={search.progress_message}
                                  initialProgressPercentage={search.progress_percentage}
                                />
                              </div>
                            </CollapsibleContent>
                          </CardContent>
                        </Card>
                      </Collapsible>
                    </motion.div>
                  );
                })
              )}
            </>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-3">
          {closedSearches.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nenhuma busca finalizada</p>
              </CardContent>
            </Card>
          ) : (
            closedSearches.map((search, index) => {
              const statusInfo = searchStatusConfig[search.status] || searchStatusConfig.CLOSED_CANCELLED;
              
              return (
                <motion.div
                  key={search.search_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="opacity-75">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{search.wishlist_title}</h3>
                          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
