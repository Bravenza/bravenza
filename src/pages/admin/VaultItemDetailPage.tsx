import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, QrCode, Shield, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/constants";

type VerifiedStatus = "VERIFIED" | "PENDING" | "REVOKED";

const statusLabels: Record<VerifiedStatus, string> = {
  VERIFIED: "Verificado",
  PENDING: "Pendente",
  REVOKED: "Revogado",
};

const statusColors: Record<VerifiedStatus, string> = {
  VERIFIED: "bg-emerald-600",
  PENDING: "bg-amber-500",
  REVOKED: "bg-red-500",
};

export default function VaultItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("vault_items")
        .select(`*, vault_members (client_name, client_email, tier)`)
        .eq("id", id)
        .single();

      if (error) {
        navigate("/admin/vault/items");
        return;
      }
      setItem(data);
      setIsLoading(false);
    })();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!item) return null;

  const status = (item.verified_status || "PENDING") as VerifiedStatus;

  const details = [
    { label: "Título", value: item.title },
    { label: "Membro", value: item.vault_members?.client_name },
    { label: "Marca", value: item.brand },
    { label: "Modelo", value: item.model },
    { label: "Colorway", value: item.colorway },
    { label: "Tamanho", value: item.size },
    { label: "Origem", value: [item.origin_city, item.origin_country].filter(Boolean).join(", ") },
    { label: "Valor", value: item.purchase_value ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.purchase_value) : null },
    { label: "Data compra", value: item.purchase_date ? formatDate(item.purchase_date) : null },
    { label: "Verificado em", value: item.verified_at ? formatDate(item.verified_at) : null },
  ].filter(d => d.value);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/vault/items">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Detalhes do Vault Item</h1>
          <p className="text-muted-foreground">{item.vault_id}</p>
        </div>
      </div>

      <div className="text-center p-6 card-premium rounded-lg">
        <code className="text-xl font-mono font-bold">{item.vault_id}</code>
        <Badge className={`ml-3 ${statusColors[status]}`}>
          {statusLabels[status]}
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Informações do Item
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {details.map((d) => (
                <div key={d.label}>
                  <p className="text-sm text-muted-foreground">{d.label}</p>
                  <p className="font-medium">{d.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Certificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Tier do membro</p>
              <Badge variant="outline" className="mt-1">
                {item.vault_members?.tier === "elite" ? "Black" : item.vault_members?.tier === "collector" ? "Privilege" : "Access"}
              </Badge>
            </div>
            {item.qr_private_url && (
              <Button variant="outline" className="w-full" onClick={() => window.open(item.qr_private_url, "_blank")}>
                <QrCode className="mr-2 h-4 w-4" />
                Abrir QR Code
              </Button>
            )}
            {item.certificate_pdf_url && (
              <Button variant="outline" className="w-full" onClick={() => window.open(item.certificate_pdf_url, "_blank")}>
                Baixar Certificado PDF
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Link to="/admin/vault/items">
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>
    </div>
  );
}
