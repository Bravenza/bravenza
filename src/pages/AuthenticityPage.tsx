import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Shield, CheckCircle, XCircle, Camera, Calendar, Hash, User, Package, Loader2, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

interface CertificateData {
  order_id: string;
  product: {
    name: string;
    brand: string | null;
    model: string | null;
    size: string | null;
    color: string | null;
  };
  client_name: string;
  inspection_photos: string[];
  purchase_date: string;
  verification_count: number;
  verified_at: string;
}

export default function AuthenticityPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [inputCode, setInputCode] = useState(code || "");
  const [isLoading, setIsLoading] = useState(false);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    if (code) {
      verifyCertificate(code);
    }
  }, [code]);

  const verifyCertificate = async (verificationCode: string) => {
    setIsLoading(true);
    setError(null);
    setCertificate(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("verify-authenticity", {
        body: { code: verificationCode }
      });

      if (fnError) throw fnError;

      if (!data.success || !data.is_valid) {
        setError(data.error || "Código não encontrado");
        return;
      }

      setCertificate(data.certificate);
    } catch (err: any) {
      console.error("Verification error:", err);
      setError("Erro ao verificar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      navigate(`/autenticidade/${inputCode.trim()}`);
      verifyCertificate(inputCode.trim());
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo className="h-6" />
            <div className="flex items-center gap-2 text-primary">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">Verificação de autenticidade</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Search Form */}
        {!certificate && (
          <div className="max-w-md mx-auto mb-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Verifique a autenticidade
              </h1>
              <p className="text-muted-foreground">
                Digite o código de autenticidade presente no seu cartão ou escaneie o QR Code
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Ex: BRV-XXXXXXXXXXXX"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  className="text-center text-lg tracking-wider h-14 font-mono"
                  maxLength={16}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-primary hover:bg-primary/90"
                disabled={isLoading || !inputCode.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Verificar autenticidade
                  </>
                )}
              </Button>
            </form>

            {error && (
              <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-3">
                  <XCircle className="h-6 w-6 text-destructive flex-shrink-0" />
                  <div>
                    <p className="font-medium text-destructive">Produto não verificado</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Certificate Display */}
        {certificate && (
          <div className="max-w-2xl mx-auto">
            {/* Success Badge */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 border-4 border-green-500/20 mb-4">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-green-500 mb-2">
                Produto autêntico
              </h1>
              <p className="text-muted-foreground">
                Este produto foi verificado e é 100% autêntico
              </p>
            </div>

            {/* Certificate Card */}
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden">
              {/* Gold Header */}
              <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 px-6 py-4 border-b border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">Certificado de autenticidade</h2>
                      <p className="text-sm text-muted-foreground">Bravenza Authentic</p>
                    </div>
                  </div>
                  <Logo className="h-5 opacity-60" />
                </div>
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Product Info */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Produto</p>
                      <p className="font-semibold text-lg">{certificate.product.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {certificate.product.brand && (
                          <span className="text-xs px-2 py-1 rounded-full bg-muted">
                            {certificate.product.brand}
                          </span>
                        )}
                        {certificate.product.model && (
                          <span className="text-xs px-2 py-1 rounded-full bg-muted">
                            {certificate.product.model}
                          </span>
                        )}
                        {certificate.product.size && (
                          <span className="text-xs px-2 py-1 rounded-full bg-muted">
                            Tam: {certificate.product.size}
                          </span>
                        )}
                        {certificate.product.color && (
                          <span className="text-xs px-2 py-1 rounded-full bg-muted">
                            {certificate.product.color}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Proprietário</p>
                        <p className="font-medium">{certificate.client_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Data da compra</p>
                        <p className="font-medium">{formatDate(certificate.purchase_date)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Hash className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Código de autenticidade</p>
                      <p className="font-mono font-bold text-primary">{code}</p>
                    </div>
                  </div>
                </div>

                {/* Inspection Photos */}
                {certificate.inspection_photos && certificate.inspection_photos.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Camera className="h-5 w-5 text-primary" />
                      <p className="font-medium">Fotos de inspeção</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {certificate.inspection_photos.map((photo, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setCurrentPhotoIndex(index);
                            setLightboxOpen(true);
                          }}
                          className="aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
                        >
                          <img
                            src={photo}
                            alt={`Inspeção ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verification Info */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Verificado {certificate.verification_count}x</span>
                    </div>
                    <span className="text-muted-foreground">
                      Última verificação: {new Date(certificate.verified_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>
              </CardContent>

              {/* Footer Seal */}
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 px-6 py-3 border-t border-primary/20">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Autenticidade garantida por Bravenza</span>
                </div>
              </div>
            </Card>

            {/* New Search Button */}
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setCertificate(null);
                  setInputCode("");
                  navigate("/autenticidade");
                }}
              >
                Verificar outro produto
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Lightbox for Photos */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
          <VisuallyHidden>
            <DialogTitle>Foto de inspeção</DialogTitle>
          </VisuallyHidden>
          {certificate?.inspection_photos && (
            <div className="relative">
              <div className="flex items-center justify-center min-h-[60vh] p-8">
                <img
                  src={certificate.inspection_photos[currentPhotoIndex]}
                  alt={`Inspeção ${currentPhotoIndex + 1}`}
                  className="max-w-full max-h-[80vh] object-contain"
                />
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                {currentPhotoIndex + 1} / {certificate.inspection_photos.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
