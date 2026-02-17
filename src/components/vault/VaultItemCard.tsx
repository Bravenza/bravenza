import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  QrCode,
  Download,
  Image,
  CheckCircle2,
  Clock,
  AlertCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CertificateQRCode } from "@/components/authenticity/CertificateQRCode";
import { toast } from "sonner";

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
  VERIFIED: {
    label: "Verificado",
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10 border-success/20",
  },
  PENDING: {
    label: "Pendente",
    icon: Clock,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
  },
  REVOKED: {
    label: "Revogado",
    icon: AlertCircle,
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/20",
  },
};

export function VaultItemCard({ item, index }: VaultItemCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showQRDialog, setShowQRDialog] = useState(false);

  const status = statusConfig[item.verified_status];
  const StatusIcon = status.icon;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const verificationUrl =
    item.qr_private_url || `${window.location.origin}/autenticidade/${item.vault_id}`;

  const handleOpenCertificate = () => {
    const certUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vault-certificate`;
    window.open(`${certUrl}?vault_item_id=${item.id}`, "_blank");
  };

  const handleShare = async () => {
    const shareData = {
      title: `${item.brand} ${item.model}`,
      text: `Confira meu ${item.brand} ${item.model} autenticado na BRAVENZA — ${item.vault_id}`,
      url: verificationUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(verificationUrl);
        toast.success("Link copiado!");
      }
    } catch {
      /* cancelled */
    }
  };

  const photos = item.inspection_photos || [];
  const hasPhotos = photos.length > 0;

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % photos.length);
  };
  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
    >
      <Dialog>
        <DialogTrigger asChild>
          <button className="w-full text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-2xl">
            <div className="relative rounded-2xl overflow-hidden bg-card border border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-md">
              {/* Image */}
              <div className="relative aspect-square bg-secondary/30 overflow-hidden">
                {hasPhotos ? (
                  <img
                    src={photos[0]}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                )}

                {/* Gradient overlay bottom */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />

                {/* Status badge */}
                {item.verified_status === "VERIFIED" && (
                  <div className="absolute top-2.5 left-2.5">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/90 backdrop-blur-sm">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                      <span className="text-[10px] font-semibold text-white">Verificado</span>
                    </div>
                  </div>
                )}
                {item.verified_status === "PENDING" && (
                  <div className="absolute top-2.5 left-2.5">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/90 backdrop-blur-sm">
                      <Clock className="h-3 w-3 text-primary-foreground" />
                      <span className="text-[10px] font-semibold text-primary-foreground">Pendente</span>
                    </div>
                  </div>
                )}

                {/* Size pill on image */}
                <div className="absolute bottom-2.5 right-2.5">
                  <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold">
                    {item.size}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 space-y-0.5">
                <p className="text-xs font-bold text-foreground line-clamp-1 uppercase tracking-wide">
                  {item.brand}
                </p>
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {item.model || item.title}
                </p>
              </div>
            </div>
          </button>
        </DialogTrigger>

        {/* ─── Detail Dialog ─── */}
        <DialogContent className="bg-card border-border max-w-lg p-0 overflow-hidden">
          {/* Header strip */}
          <div className="px-6 pt-6 pb-4 border-b border-border/50">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base font-bold">{item.vault_id}</DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Certificado de Autenticidade</p>
                </div>
                <Badge
                  variant="outline"
                  className={`ml-auto shrink-0 border ${status.bg} ${status.color} text-[10px] font-semibold`}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
            </DialogHeader>
          </div>

          <div className="px-6 pb-6 pt-4 space-y-5">
            {/* Photo carousel */}
            {hasPhotos && (
              <div className="relative aspect-square bg-secondary/20 rounded-xl overflow-hidden group/photos">
                <img
                  src={photos[photoIndex]}
                  alt={`Foto ${photoIndex + 1}`}
                  className="w-full h-full object-contain"
                />
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 flex items-center justify-center opacity-0 group-hover/photos:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={nextPhoto}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 flex items-center justify-center opacity-0 group-hover/photos:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {photos.map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotoIndex(i);
                          }}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            i === photoIndex
                              ? "bg-primary w-4"
                              : "bg-muted-foreground/40 hover:bg-muted-foreground/60"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4">
              <DetailCell label="Produto" value={item.title} />
              <DetailCell label="Marca" value={item.brand} />
              <DetailCell label="Tamanho" value={item.size} />
              <DetailCell label="Cor" value={item.colorway || "—"} />
              <DetailCell label="Valor" value={formatCurrency(item.purchase_value)} highlight />
              <DetailCell label="Adquirido em" value={formatDate(item.purchase_date)} />
            </div>

            {/* QR Code */}
            {item.verified_status === "VERIFIED" && (
              <CertificateQRCode code={item.vault_id} verificationUrl={verificationUrl} />
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="default"
                size="sm"
                className="flex-1 rounded-xl h-10"
                onClick={handleOpenCertificate}
              >
                <Download className="h-4 w-4 mr-2" />
                Certificado PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-10 border-border/50"
                onClick={() => setShowQRDialog(true)}
              >
                <QrCode className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-10 border-border/50"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
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
          <CertificateQRCode code={item.vault_id} verificationUrl={verificationUrl} />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function DetailCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-medium ${highlight ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}
