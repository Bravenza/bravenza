import { useState } from "react";
import { Shield, QrCode, Copy, Check, RefreshCw, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthenticityCodeSectionProps {
  orderId: string;
  authenticityCode: string | null;
  verificationCount: number;
  onCodeGenerated: (code: string) => void;
}

export function AuthenticityCodeSection({ 
  orderId, 
  authenticityCode, 
  verificationCount,
  onCodeGenerated 
}: AuthenticityCodeSectionProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateCode = async () => {
    setIsGenerating(true);
    try {
      // Generate new code using database function
      const { data: codeResult, error: codeError } = await supabase
        .rpc("generate_authenticity_code");

      if (codeError) throw codeError;

      const newCode = codeResult as string;

      // Update order with the new code
      const { error: updateError } = await supabase
        .from("orders")
        .update({ authenticity_code: newCode })
        .eq("order_id", orderId);

      if (updateError) throw updateError;

      onCodeGenerated(newCode);
      toast.success("Código de autenticidade gerado com sucesso!");
    } catch (error: any) {
      console.error("Error generating code:", error);
      toast.error("Erro ao gerar código: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyCode = async () => {
    if (!authenticityCode) return;
    
    try {
      await navigator.clipboard.writeText(authenticityCode);
      setCopied(true);
      toast.success("Código copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar código");
    }
  };

  const copyVerificationLink = async () => {
    if (!authenticityCode) return;
    
    const url = `${window.location.origin}/autenticidade/${authenticityCode}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link de verificação copiado!");
    } catch {
      toast.error("Erro ao copiar link");
    }
  };

  const openVerificationPage = () => {
    if (!authenticityCode) return;
    window.open(`/autenticidade/${authenticityCode}`, "_blank");
  };

  // Generate QR Code URL using a free API
  const qrCodeUrl = authenticityCode 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        `${window.location.origin}/autenticidade/${authenticityCode}`
      )}&bgcolor=1f1f1f&color=d4af37`
    : null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5 text-primary" />
          Certificado de autenticidade
        </CardTitle>
        <CardDescription>
          QR Code e código único para verificação do produto
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!authenticityCode ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <QrCode className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Nenhum código de autenticidade gerado
            </p>
            <Button 
              onClick={generateCode} 
              disabled={isGenerating}
              className="bg-primary hover:bg-primary/90"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Gerar código de autenticidade
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* QR Code */}
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-[#1f1f1f] rounded-xl border border-primary/30">
                <img 
                  src={qrCodeUrl!} 
                  alt="QR Code de Autenticidade" 
                  className="w-40 h-40"
                />
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Código de autenticidade</p>
                <div className="flex items-center gap-2">
                  <code className="text-lg font-mono font-bold text-primary tracking-wider">
                    {authenticityCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={copyCode}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Verification Stats */}
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Verificado {verificationCount}x
              </Badge>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyVerificationLink}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openVerificationPage}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
            </div>

            {/* Regenerate Option */}
            <div className="pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={generateCode}
                disabled={isGenerating}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                Gerar novo código
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
