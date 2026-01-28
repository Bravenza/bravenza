import { Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShippingSection } from "@/components/admin/ShippingSection";
import { InspectionPhotosUpload } from "@/components/admin/InspectionPhotosUpload";
import { formatDate } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Order } from "./types";

interface LogisticsTabProps {
  order: Order;
  editData: Partial<Order>;
  setEditData: React.Dispatch<React.SetStateAction<Partial<Order>>>;
  setOrder: React.Dispatch<React.SetStateAction<Order | null>>;
  isEditing: boolean;
}

export const LogisticsTab = ({
  order,
  editData,
  setEditData,
  setOrder,
  isEditing,
}: LogisticsTabProps) => {
  const { toast } = useToast();

  const showInspectionPhotos = [
    "PRODUCT_INSPECTED",
    "BALANCE_PENDING",
    "FULLY_PAID",
    "SHIPPED_TO_CLIENT",
    "DELIVERED",
  ].includes(order.current_status);

  return (
    <div className="space-y-6">
      {/* Rastreamento */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Rastreamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rastreio Internacional</Label>
                <Input
                  value={editData.international_tracking || ""}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      international_tracking: e.target.value,
                    }))
                  }
                  placeholder="Código de rastreio..."
                  className="bg-secondary/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Transportadora Internacional</Label>
                <Input
                  value={editData.international_carrier || ""}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      international_carrier: e.target.value,
                    }))
                  }
                  placeholder="DHL, FedEx..."
                  className="bg-secondary/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Rastreio Nacional</Label>
                <Input
                  value={editData.national_tracking || ""}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      national_tracking: e.target.value,
                    }))
                  }
                  placeholder="Código de rastreio..."
                  className="bg-secondary/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Transportadora Nacional</Label>
                <Input
                  value={editData.national_carrier || ""}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      national_carrier: e.target.value,
                    }))
                  }
                  placeholder="Correios, Jadlog..."
                  className="bg-secondary/50"
                />
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Rastreio Internacional</p>
                <p className="font-medium">{order.international_tracking || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transportadora Internacional</p>
                <p className="font-medium">{order.international_carrier || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rastreio Nacional</p>
                <p className="font-medium">{order.national_tracking || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transportadora Nacional</p>
                <p className="font-medium">{order.national_carrier || "-"}</p>
              </div>
              {order.sla_vault_due_date && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Prazo VAULT 30</p>
                  <p className="font-medium text-primary">
                    {formatDate(order.sla_vault_due_date)}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SuperFrete Integration */}
      {!isEditing && (
        <ShippingSection
          orderId={order.order_id}
          clientName={order.client_name}
          clientCpf={order.client_cpf}
          clientPhone={order.client_phone}
          clientEmail={order.client_email}
          clientAddress={order.client_address}
          productName={order.product_name}
          productPrice={order.product_price}
          nationalTracking={order.national_tracking}
          nationalCarrier={order.national_carrier}
          onTrackingUpdate={async (tracking, carrier) => {
            try {
              await supabase
                .from("orders")
                .update({
                  national_tracking: tracking,
                  national_carrier: carrier,
                })
                .eq("order_id", order.order_id);
              
              setOrder(prev => prev ? {
                ...prev,
                national_tracking: tracking,
                national_carrier: carrier,
              } : null);
              
              toast({
                title: "Rastreio atualizado",
                description: `Código: ${tracking}`,
              });
            } catch (error) {
              console.error("Error updating tracking:", error);
            }
          }}
          onShippingCostAdded={(cost) => {
            setOrder(prev => prev ? {
              ...prev,
              shipping_cost: cost,
            } : null);
            setEditData(prev => ({ ...prev, shipping_cost: cost }));
          }}
        />
      )}

      {/* Fotos de Inspeção */}
      {showInspectionPhotos && (
        <InspectionPhotosUpload
          orderId={order.order_id}
          existingPhotos={order.inspection_photos || []}
          onPhotosChange={(photos) =>
            setEditData((prev) => ({ ...prev, inspection_photos: photos }))
          }
          isEditing={isEditing}
        />
      )}

      {/* Observações Internas */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle>Observações Internas</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editData.internal_notes || ""}
              onChange={(e) =>
                setEditData((prev) => ({
                  ...prev,
                  internal_notes: e.target.value,
                }))
              }
              placeholder="Observações internas..."
              className="bg-secondary/50"
              rows={3}
            />
          ) : (
            <p className="text-muted-foreground">
              {order.internal_notes || "Nenhuma observação."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
