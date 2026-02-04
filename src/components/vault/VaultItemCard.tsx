import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, QrCode, Download, Image, CheckCircle2, Clock, AlertCircle, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CertificateQRCode } from "@/components/authenticity/CertificateQRCode";

interface VaultItem {
  id: string;
  vault_id: string;
  title: string;
  brand: string;
  model: string;
  colorway: string;
  size: string;
  verified_status: "VERIFIED" | "PENDING" | "REVOKED";
  inspection_photos: string[];
  certificate_pdf_url: string | null;
  qr_private_url: string | null;
  purchase_value: number;
  purchase_date: string;
}

interface VaultItemCardProps {
  item: VaultItem;
  index: number;
}

const statusConfig = {
  VERIFIED: { label: "Verificado", icon: CheckCircle2, color: "text-success", bgColor: "bg-success/10" },
  PENDING: { label: "Pendente", icon: Clock, color: "text-primary", bgColor: "bg-primary/10" },
  REVOKED: { label: "Revogado", icon: AlertCircle, color: "text-destructive", bgColor: "bg-destructive/10" },
};

export function VaultItemCard({ item, index }: VaultItemCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showQRDialog, setShowQRDialog] = useState(false);
  
  const status = statusConfig[item.verified_status];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const verificationUrl = item.qr_private_url || `${window.location.origin}/autenticidade/${item.vault_id}`;

  const handleOpenCertificate = () => {
    // Open certificate in new tab
    const certUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vault-certificate`;
    window.open(`${certUrl}?vault_item_id=${item.id}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
    >
      <Dialog>
        <DialogTrigger asChild>
          <Card className="card-premium overflow-hidden cursor-pointer hover:border-primary/30 transition-colors group">
            {/* Image - compact square */}
            <div className="relative aspect-square bg-background">
              {item.inspection_photos && item.inspection_photos.length > 0 ? (
                <img
                  src={item.inspection_photos[0]}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="h-6 w-6 text-muted-foreground/30" />
                </div>
              )}
              {item.verified_status === "VERIFIED" && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-success/90 flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            <CardContent className="p-2">
              <p className="text-[11px] font-medium line-clamp-1">{item.brand || item.title}</p>
              <p className="text-[10px] text-muted-foreground">Tam. {item.size}</p>
            </CardContent>
          </Card>
        </DialogTrigger>
        
        {/* Full Details Dialog */}
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {item.vault_id}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Photo carousel */}
            {item.inspection_photos && item.inspection_photos.length > 0 && (
              <div className="relative aspect-square bg-background rounded-lg overflow-hidden">
                <img
                  src={item.inspection_photos[photoIndex]}
                  alt={`Foto ${photoIndex + 1}`}
                  className="w-full h-full object-contain"
                />
                {item.inspection_photos.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {item.inspection_photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoIndex(i)}
                        className={`w-2 h-2 rounded-full transition ${
                          i === photoIndex ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Produto</p>
                <p className="font-medium">{item.title}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Tamanho</p>
                <p className="font-medium">{item.size}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Valor</p>
                <p className="font-medium">{formatCurrency(item.purchase_value)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Data</p>
                <p className="font-medium">{formatDate(item.purchase_date)}</p>
              </div>
            </div>

            {/* QR Code Section */}
            {item.verified_status === "VERIFIED" && (
              <CertificateQRCode 
                code={item.vault_id} 
                verificationUrl={verificationUrl}
              />
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 border-border/50 hover:border-border"
                onClick={handleOpenCertificate}
              >
                <Download className="h-4 w-4" />
                Certificado
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="border-border/50 hover:border-border"
                onClick={() => setShowQRDialog(true)}
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {item.vault_id}
            </DialogTitle>
          </DialogHeader>
          <CertificateQRCode 
            code={item.vault_id} 
            verificationUrl={verificationUrl}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
