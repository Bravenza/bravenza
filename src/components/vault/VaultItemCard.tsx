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
  VERIFIED: { label: "Verificado", icon: CheckCircle2, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  PENDING: { label: "Pendente", icon: Clock, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  REVOKED: { label: "Revogado", icon: AlertCircle, color: "text-red-500", bgColor: "bg-red-500/10" },
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
      <Card className="bg-zinc-900 border-zinc-800 overflow-hidden hover:border-zinc-700 transition">
        {/* Image */}
        <div className="relative aspect-square bg-zinc-950">
          {item.inspection_photos && item.inspection_photos.length > 0 ? (
            <img
              src={item.inspection_photos[0]}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image className="h-12 w-12 text-zinc-700" />
            </div>
          )}
          <Badge 
            className={`absolute top-3 right-3 ${status.bgColor} ${status.color} border-0`}
          >
            <status.icon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>

        <CardContent className="pt-4">
          {/* Vault ID */}
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-mono text-amber-500">{item.vault_id}</span>
          </div>

          {/* Title */}
          <h3 className="font-semibold mb-1 line-clamp-1">{item.title}</h3>
          <p className="text-sm text-zinc-400 mb-3">
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
                  className="flex-1 border-zinc-700"
                >
                  <Image className="h-4 w-4 mr-1" />
                  Ver
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-amber-500" />
                    {item.vault_id}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Photo carousel */}
                  {item.inspection_photos && item.inspection_photos.length > 0 && (
                    <div className="relative aspect-square bg-zinc-950 rounded-lg overflow-hidden">
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
                                i === photoIndex ? "bg-amber-500" : "bg-zinc-600"
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
                      <p className="text-zinc-500">Produto</p>
                      <p className="font-medium">{item.title}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Tamanho</p>
                      <p className="font-medium">{item.size}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Valor</p>
                      <p className="font-medium">{formatCurrency(item.purchase_value)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Data</p>
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
                      className="flex-1 border-zinc-700"
                      onClick={handleOpenCertificate}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Certificado
                    </Button>
                    {item.qr_private_url && (
                      <Button asChild variant="outline" className="flex-1 border-zinc-700">
                        <a href={item.qr_private_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
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
                  className="border-zinc-700"
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-amber-500" />
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
