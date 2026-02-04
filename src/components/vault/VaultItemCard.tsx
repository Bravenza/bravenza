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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="card-premium overflow-hidden">
        {/* Image - compact size */}
        <div className="relative aspect-[4/3] bg-background">
          {item.inspection_photos && item.inspection_photos.length > 0 ? (
            <img
              src={item.inspection_photos[0]}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image className="h-8 w-8 text-muted-foreground/30" />
            </div>
          )}
          <Badge 
            className={`absolute top-2 right-2 ${status.bgColor} ${status.color} border-0 text-[10px] px-1.5 py-0.5`}
          >
            <status.icon className="h-2.5 w-2.5 mr-0.5" />
            {status.label}
          </Badge>
        </div>

        <CardContent className="p-3">
          {/* Vault ID */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <Shield className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-mono text-primary">{item.vault_id}</span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-sm mb-0.5 line-clamp-1">{item.title}</h3>
          <p className="text-xs text-muted-foreground mb-2">
            {item.brand} • Tam. {item.size}
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            {/* View Details Dialog */}
            <Dialog>
              <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 border-border/50 hover:border-border"
              >
                <Image className="h-4 w-4" />
                Ver
              </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-2xl">
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
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Produto</p>
                      <p className="font-medium">{item.title}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tamanho</p>
                      <p className="font-medium">{item.size}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Valor</p>
                      <p className="font-medium">{formatCurrency(item.purchase_value)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Data</p>
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
                      className="flex-1 border-border/50 hover:border-border"
                      onClick={handleOpenCertificate}
                    >
                      <Download className="h-4 w-4" />
                      Certificado
                    </Button>
                    {item.qr_private_url && (
                      <Button asChild variant="outline" className="flex-1 border-border/50 hover:border-border">
                        <a href={item.qr_private_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          Verificar online
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Quick QR Access */}
            <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="border-border/50 hover:border-border"
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-md">
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
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
