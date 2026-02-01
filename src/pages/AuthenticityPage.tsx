import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, CheckCircle, XCircle, Camera, Calendar, Hash, User, Package, 
  Loader2, Search, BadgeCheck, Sparkles, Award, Eye, Fingerprint,
  ShieldCheck, Star, Crown, Lock, Gem
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { HolographicSeal } from "@/components/authenticity/HolographicSeal";
import { CertificateQRCode } from "@/components/authenticity/CertificateQRCode";

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

const AUTHENTICITY_CHECKS = [
  {
    icon: Eye,
    title: "Inspeção visual completa",
    description: "Análise detalhada de costuras, acabamentos e materiais"
  },
  {
    icon: Fingerprint,
    title: "Verificação de código de barras",
    description: "Confirmação do código de barras original do fabricante"
  },
  {
    icon: Package,
    title: "Análise de embalagem",
    description: "Verificação da caixa, etiquetas e acessórios originais"
  },
  {
    icon: ShieldCheck,
    title: "Autenticação de materiais",
    description: "Teste de qualidade dos materiais utilizados"
  },
  {
    icon: Award,
    title: "Conformidade com padrões",
    description: "Comparação com especificações oficiais da marca"
  },
  {
    icon: Lock,
    title: "Rastreabilidade garantida",
    description: "Origem verificada através de fornecedores autorizados"
  }
];

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

  const maskName = (name: string) => {
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0][0] + "***";
    return parts[0] + " " + parts.slice(1).map(p => p[0] + "***").join(" ");
  };

  const getVerificationUrl = () => {
    return `${window.location.origin}/autenticidade/${code}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a]">
      {/* Premium Header */}
      <header className="border-b border-primary/20 bg-black/40 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <Logo className="h-6" />
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-primary/90 tracking-wide">
                Centro de verificação
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 md:py-16">
        <AnimatePresence mode="wait">
          {/* Search Form */}
          {!certificate && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-lg mx-auto"
            >
              {/* Hero Section */}
              <div className="text-center mb-10">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="relative inline-flex items-center justify-center mb-6"
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 blur-2xl scale-150" />
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 via-primary/20 to-transparent border border-primary/30 flex items-center justify-center">
                    <Crown className="h-12 w-12 text-primary" />
                  </div>
                </motion.div>
                
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-white via-primary/90 to-white bg-clip-text text-transparent"
                >
                  Certificado de autenticidade
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-muted-foreground max-w-md mx-auto"
                >
                  Verifique a autenticidade do seu produto através do código único presente no cartão de certificação
                </motion.p>
              </div>

              {/* Search Form */}
              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-xl" />
                  <div className="relative bg-black/60 rounded-xl border border-primary/30 p-1">
                    <Input
                      type="text"
                      placeholder="Digite o código: BRV-XXXXXXXXXXXX"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                      className="text-center text-lg tracking-[0.2em] h-16 font-mono bg-transparent border-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
                      maxLength={16}
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-14 bg-gradient-to-r from-primary via-primary/90 to-primary hover:from-primary/90 hover:to-primary/80 text-primary-foreground font-semibold text-base tracking-wide rounded-xl transition-all duration-300 shadow-lg shadow-primary/20"
                  disabled={isLoading || !inputCode.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                      Verificando autenticidade...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-3" />
                      Verificar produto
                    </>
                  )}
                </Button>
              </motion.form>

              {/* Error State */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-8 p-5 rounded-xl bg-destructive/10 border border-destructive/30"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                      <XCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <p className="font-semibold text-destructive text-lg">Produto não verificado</p>
                      <p className="text-sm text-muted-foreground mt-1">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Trust Badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-12 flex items-center justify-center gap-6 text-muted-foreground/60"
              >
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span className="text-xs">Verificação segura</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs">100% confiável</span>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Certificate Display */}
          {certificate && (
            <motion.div
              key="certificate"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto"
            >
              {/* Success Header with Holographic Seal */}
              <div className="text-center mb-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="inline-flex items-center justify-center mb-6"
                >
                  <HolographicSeal />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 mb-4">
                    <Sparkles className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-500">Autenticidade confirmada</span>
                  </div>
                  
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    Produto 100% autêntico
                  </h1>
                  <p className="text-muted-foreground">
                    Este produto passou por rigorosa verificação de autenticidade
                  </p>
                </motion.div>
              </div>

              {/* Main Certificate Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-[#151515] via-[#1a1a1a] to-[#151515] shadow-2xl shadow-primary/10">
                  {/* Premium Header with Gold Gradient */}
                  <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30" />
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZDcwMDEwIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
                    
                    <div className="relative px-6 py-6 md:px-8 md:py-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/40 to-primary/20 border border-primary/40 flex items-center justify-center shadow-lg shadow-primary/20">
                            <Gem className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <h2 className="font-bold text-xl text-white">Certificado de autenticidade</h2>
                            <p className="text-primary/80 text-sm font-medium">Bravenza Authentic™</p>
                          </div>
                        </div>
                        <Logo className="h-5 opacity-70 hidden md:block" />
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6 md:p-8 space-y-8">
                    {/* Product Info Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg">Produto certificado</h3>
                      </div>
                      
                      <div className="bg-black/30 rounded-2xl p-5 border border-border/50">
                        <p className="font-bold text-xl md:text-2xl text-white mb-3">
                          {certificate.product.name}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {certificate.product.brand && (
                            <span className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
                              {certificate.product.brand}
                            </span>
                          )}
                          {certificate.product.model && (
                            <span className="px-3 py-1.5 rounded-full bg-muted/50 text-sm">
                              {certificate.product.model}
                            </span>
                          )}
                          {certificate.product.size && (
                            <span className="px-3 py-1.5 rounded-full bg-muted/50 text-sm">
                              Tamanho {certificate.product.size}
                            </span>
                          )}
                          {certificate.product.color && (
                            <span className="px-3 py-1.5 rounded-full bg-muted/50 text-sm">
                              {certificate.product.color}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Owner & Date */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-black/20 rounded-xl p-4 border border-border/30">
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-primary/70" />
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Proprietário</p>
                              <p className="font-semibold text-white">{maskName(certificate.client_name)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-black/20 rounded-xl p-4 border border-border/30">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-primary/70" />
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Data de aquisição</p>
                              <p className="font-semibold text-white">{formatDate(certificate.purchase_date)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Certificate Code */}
                      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
                        <div className="flex items-center gap-3">
                          <Hash className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Código de certificação</p>
                            <p className="font-mono font-bold text-lg text-primary tracking-wider">{code}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-border/30" />

                    {/* Authenticity Checks Section */}
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                          <ShieldCheck className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">Verificações realizadas</h3>
                          <p className="text-sm text-muted-foreground">Todos os critérios foram aprovados</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {AUTHENTICITY_CHECKS.map((check, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            className="flex items-start gap-3 p-4 rounded-xl bg-black/20 border border-green-500/10 hover:border-green-500/30 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-white">{check.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{check.description}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Inspection Photos */}
                    {certificate.inspection_photos && certificate.inspection_photos.length > 0 && (
                      <>
                        <Separator className="bg-border/30" />
                        
                        <div className="space-y-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Camera className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">Registro fotográfico da inspeção</h3>
                              <p className="text-sm text-muted-foreground">Fotos capturadas durante a verificação</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {certificate.inspection_photos.map((photo, index) => (
                              <motion.button
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.8 + index * 0.1 }}
                                onClick={() => {
                                  setCurrentPhotoIndex(index);
                                  setLightboxOpen(true);
                                }}
                                className="group aspect-square rounded-xl overflow-hidden border-2 border-border/50 hover:border-primary/50 transition-all duration-300 relative"
                              >
                                <img
                                  src={photo}
                                  alt={`Inspeção ${index + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Eye className="h-6 w-6 text-white" />
                                </div>
                                <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/60 text-xs text-white">
                                  {index + 1}/{certificate.inspection_photos.length}
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <Separator className="bg-border/30" />

                    {/* QR Code Section */}
                    <CertificateQRCode 
                      code={code || ""} 
                      verificationUrl={getVerificationUrl()} 
                    />
                  </CardContent>

                  {/* Premium Footer */}
                  <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20" />
                    <div className="relative px-6 py-5 md:px-8">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Star className="h-5 w-5 text-primary" />
                          </div>
                          <div className="text-center md:text-left">
                            <p className="text-sm font-medium text-white">Garantia Bravenza</p>
                            <p className="text-xs text-muted-foreground">Autenticidade certificada e rastreável</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Verificado {certificate.verification_count}x</span>
                          <span className="h-3 w-px bg-border" />
                          <span>Última: {new Date(certificate.verified_at).toLocaleString("pt-BR")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* New Search Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-8 text-center"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="border-primary/30 hover:bg-primary/10"
                  onClick={() => {
                    setCertificate(null);
                    setInputCode("");
                    navigate("/autenticidade");
                  }}
                >
                  Verificar outro produto
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/20 py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Bravenza. Todos os direitos reservados.</p>
          <p className="mt-1">Sistema de verificação de autenticidade protegido</p>
        </div>
      </footer>

      {/* Lightbox for Photos */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl p-0 bg-black/98 border-primary/20">
          <VisuallyHidden>
            <DialogTitle>Foto de inspeção</DialogTitle>
          </VisuallyHidden>
          {certificate?.inspection_photos && (
            <div className="relative">
              <div className="flex items-center justify-center min-h-[70vh] p-6">
                <img
                  src={certificate.inspection_photos[currentPhotoIndex]}
                  alt={`Inspeção ${currentPhotoIndex + 1}`}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
              </div>
              
              {/* Navigation */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/80 border border-primary/30">
                  {certificate.inspection_photos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPhotoIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentPhotoIndex 
                          ? "bg-primary w-6" 
                          : "bg-white/30 hover:bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Counter */}
              <div className="absolute top-6 right-6 px-4 py-2 rounded-full bg-black/80 border border-primary/30 text-sm font-medium">
                {currentPhotoIndex + 1} / {certificate.inspection_photos.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
