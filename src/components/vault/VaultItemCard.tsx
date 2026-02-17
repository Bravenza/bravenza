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
  Fingerprint,
  Calendar,
  Ruler,
  Palette,
  Tag,
  Package,
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
    label: "Autenticidade Verificada",
    shortLabel: "Verificado",
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10 border-success/20",
    dotColor: "bg-success",
  },
  PENDING: {
    label: "Verificação Pendente",
    shortLabel: "Pendente",
    icon: Clock,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
    dotColor: "bg-primary",
  },
  REVOKED: {
    label: "Certificado Revogado",
    shortLabel: "Revogado",
    icon: AlertCircle,
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/20",
    dotColor: "bg-destructive",
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
      month: "long",
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

  const goToPhoto = (dir: "next" | "prev") => (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) =>
      dir === "next" ? (prev + 1) % photos.length : (prev - 1 + photos.length) % photos.length
    );
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
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />
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
                <div className="absolute bottom-2.5 right-2.5">
                  <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold">
                    {item.size}
                  </span>
                </div>
              </div>
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

        {/* ─── Premium Detail Dialog ─── */}
        <DialogContent className="bg-card border-border/50 max-w-md p-0 overflow-hidden rounded-2xl gap-0 max-h-[90vh] overflow-y-auto">
          {/* Hero Photo Area */}
          {hasPhotos && (
            <div className="relative aspect-[4/3] bg-secondary/20 overflow-hidden">
              <img
                src={photos[photoIndex]}
                alt={`Foto ${photoIndex + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Top gradient for close button visibility */}
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent" />
              {/* Bottom gradient */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />

              {/* Photo navigation */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={goToPhoto("prev")}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/25 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 text-white" />
                  </button>
                  <button
                    onClick={goToPhoto("next")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/25 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 text-white" />
                  </button>
                  {/* Dots */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotoIndex(i);
                        }}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === photoIndex
                            ? "bg-primary w-5"
                            : "bg-white/50 w-1.5 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Thumbnails strip */}
              {photos.length > 1 && (
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {photos.slice(0, 5).map((photo, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPhotoIndex(i);
                      }}
                      className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                        i === photoIndex
                          ? "border-primary shadow-md scale-105"
                          : "border-white/30 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="px-5 pb-6 -mt-2 relative">
            {/* Vault ID Header */}
            <DialogHeader className="mb-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Fingerprint className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="text-sm font-bold tracking-wide">
                      {item.vault_id}
                    </DialogTitle>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                      <span className={`text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Product Name */}
            <div className="mb-5">
              <h3 className="text-lg font-bold leading-tight">{item.title}</h3>
              {item.colorway && (
                <p className="text-sm text-muted-foreground mt-0.5">{item.colorway}</p>
              )}
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-px bg-border/30 rounded-xl overflow-hidden mb-5">
              <SpecCell icon={Tag} label="Marca" value={item.brand} />
              <SpecCell icon={Package} label="Modelo" value={item.model || "—"} />
              <SpecCell icon={Ruler} label="Tamanho" value={item.size} />
              <SpecCell icon={Palette} label="Cor" value={item.colorway || "—"} />
              <SpecCell
                icon={Shield}
                label="Valor"
                value={formatCurrency(item.purchase_value)}
                highlight
              />
              <SpecCell icon={Calendar} label="Aquisição" value={formatDate(item.purchase_date)} />
            </div>

            {/* QR Code Section - compact */}
            {item.verified_status === "VERIFIED" && (
              <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 mb-5">
                <div className="flex items-center gap-3 mb-3">
                  <QrCode className="h-4 w-4 text-primary" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Certificado Digital
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="shrink-0 bg-white p-2 rounded-lg">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(verificationUrl)}&format=png`}
                      alt="QR Code"
                      className="w-16 h-16"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground mb-1">
                      Escaneie para verificar a autenticidade
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground/70 break-all line-clamp-2">
                      {verificationUrl}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="default"
                size="sm"
                className="rounded-xl h-11 text-xs font-semibold"
                onClick={handleOpenCertificate}
              >
                <Download className="h-4 w-4 mr-1.5" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-11 text-xs border-border/50"
                onClick={() => setShowQRDialog(true)}
              >
                <QrCode className="h-4 w-4 mr-1.5" />
                QR Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-11 text-xs border-border/50"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-1.5" />
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full QR Dialog */}
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

function SpecCell({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-card p-3.5 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-muted-foreground/60" />
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          {label}
        </p>
      </div>
      <p
        className={`text-sm font-semibold leading-tight ${
          highlight ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
