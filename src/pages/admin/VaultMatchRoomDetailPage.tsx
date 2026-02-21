import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/constants";
import { toast } from "sonner";

type DecisionStatus = "PENDING" | "APPROVED" | "DECLINED" | "EXPIRED";

const statusLabels: Record<DecisionStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  DECLINED: "Recusada",
  EXPIRED: "Expirada",
};

const statusColors: Record<DecisionStatus, string> = {
  PENDING: "bg-amber-500",
  APPROVED: "bg-emerald-600",
  DECLINED: "bg-red-500",
  EXPIRED: "bg-zinc-500",
};

interface MatchOption {
  id: string;
  match_room_id: string;
  option_title: string;
  region: string | null;
  condition: string | null;
  price_estimate: number | null;
  currency: string | null;
  pros: string | null;
  risks: string | null;
}

export default function VaultMatchRoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<any>(null);
  const [options, setOptions] = useState<MatchOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddOption, setShowAddOption] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [optionForm, setOptionForm] = useState({
    option_title: "",
    region: "",
    condition: "DS",
    price_estimate: "",
    currency: "BRL",
    pros: "",
    risks: "",
  });

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("vault_match_rooms")
        .select(`*, vault_members (client_name, client_email, tier), vault_searches!vault_match_rooms_search_id_fkey (status, vault_wishlists (title, product_name))`)
        .eq("id", id)
        .single();

      if (error) {
        navigate("/admin/vault/buscas");
        return;
      }
      setRoom(data);

      const { data: opts } = await supabase
        .from("vault_match_options")
        .select("*")
        .eq("match_room_id", id!);
      setOptions(opts || []);
      setIsLoading(false);
    })();
  }, [id]);

  const handleAddOption = async () => {
    if (!optionForm.option_title) {
      toast.error("Preencha o título da opção");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("vault_match_options").insert({
        match_room_id: id!,
        option_title: optionForm.option_title,
        region: optionForm.region || null,
        condition: optionForm.condition,
        price_estimate: optionForm.price_estimate ? parseFloat(optionForm.price_estimate) : null,
        currency: optionForm.currency,
        pros: optionForm.pros || null,
        risks: optionForm.risks || null,
      });

      if (error) throw error;

      toast.success("Opção adicionada");
      setShowAddOption(false);
      setOptionForm({ option_title: "", region: "", condition: "DS", price_estimate: "", currency: "BRL", pros: "", risks: "" });

      const { data: opts } = await supabase.from("vault_match_options").select("*").eq("match_room_id", id!);
      setOptions(opts || []);
    } catch (error) {
      console.error("Error adding option:", error);
      toast.error("Erro ao adicionar opção");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!room) return null;

  const status = (room.decision_status || "PENDING") as DecisionStatus;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/vault/buscas">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Detalhes da Match Room</h1>
          <p className="text-muted-foreground">
            {room.vault_searches?.vault_wishlists?.title || room.vault_searches?.vault_wishlists?.product_name || "Produto"}
          </p>
        </div>
      </div>

      {/* Room Info */}
      <Card className="card-premium">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Membro</p>
              <p className="font-medium">{room.vault_members?.client_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={statusColors[status]}>{statusLabels[status]}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Deadline</p>
              <p className="font-medium">{room.decision_deadline_at ? formatDate(room.decision_deadline_at) : "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tier</p>
              <Badge variant="outline">
                {room.vault_members?.tier === "elite" ? "Black" : room.vault_members?.tier === "collector" ? "Privilege" : "Access"}
              </Badge>
            </div>
          </div>
          {room.decision_notes_from_customer && (
            <div className="mt-4 p-3 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Notas do cliente</p>
              <p className="text-sm">{room.decision_notes_from_customer}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Options */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Opções ({options.length})</h2>
        <Button size="sm" onClick={() => setShowAddOption(!showAddOption)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar opção
        </Button>
      </div>

      {showAddOption && (
        <Card className="card-premium border-primary/30">
          <CardHeader>
            <CardTitle>Nova Opção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={optionForm.option_title} onChange={(e) => setOptionForm({ ...optionForm, option_title: e.target.value })} placeholder="Ex: StockX - Nova York" className="bg-secondary/50" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Região</Label>
                <Input value={optionForm.region} onChange={(e) => setOptionForm({ ...optionForm, region: e.target.value })} placeholder="Ex: EUA" className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <Label>Condição</Label>
                <Select value={optionForm.condition} onValueChange={(value) => setOptionForm({ ...optionForm, condition: value })}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DS">Deadstock (DS)</SelectItem>
                    <SelectItem value="VNDS">Very Near DS (VNDS)</SelectItem>
                    <SelectItem value="USED">Usado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço estimado</Label>
                <Input type="number" value={optionForm.price_estimate} onChange={(e) => setOptionForm({ ...optionForm, price_estimate: e.target.value })} placeholder="0.00" className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <Label>Moeda</Label>
                <Select value={optionForm.currency} onValueChange={(value) => setOptionForm({ ...optionForm, currency: value })}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">BRL</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prós</Label>
                <Textarea value={optionForm.pros} onChange={(e) => setOptionForm({ ...optionForm, pros: e.target.value })} placeholder="Vantagens..." className="bg-secondary/50" rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Riscos</Label>
                <Textarea value={optionForm.risks} onChange={(e) => setOptionForm({ ...optionForm, risks: e.target.value })} placeholder="Possíveis riscos..." className="bg-secondary/50" rows={2} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddOption(false)}>Cancelar</Button>
              <Button onClick={handleAddOption} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {options.length === 0 ? (
        <Card className="card-premium">
          <CardContent className="p-8 text-center text-muted-foreground">
            Nenhuma opção adicionada ainda
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {options.map((option) => (
            <Card key={option.id} className="card-premium">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{option.option_title}</p>
                    <div className="flex gap-2 mt-1">
                      {option.region && <Badge variant="outline">{option.region}</Badge>}
                      {option.condition && <Badge variant="outline">{option.condition}</Badge>}
                    </div>
                  </div>
                  <p className="font-bold whitespace-nowrap">
                    {option.price_estimate
                      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: option.currency || "BRL" }).format(option.price_estimate)
                      : "-"}
                  </p>
                </div>
                {(option.pros || option.risks) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 text-sm">
                    {option.pros && (
                      <div>
                        <p className="text-emerald-500 font-medium">Prós</p>
                        <p className="text-muted-foreground">{option.pros}</p>
                      </div>
                    )}
                    {option.risks && (
                      <div>
                        <p className="text-destructive font-medium">Riscos</p>
                        <p className="text-muted-foreground">{option.risks}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Link to="/admin/vault/buscas">
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>
    </div>
  );
}
