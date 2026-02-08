import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface TermsStepProps {
  fullName: string;
  cpfCnpj: string;
  derivedAccountType: string;
  bankName: string;
  pixKeyType: string;
  pixBeneficiary: string;
  termsAccepted: boolean;
  setTermsAccepted: (v: boolean) => void;
}

export function TermsStep({ fullName, cpfCnpj, derivedAccountType, bankName, pixKeyType, pixBeneficiary, termsAccepted, setTermsAccepted }: TermsStepProps) {
  return (
    <div className="space-y-4">
      <Card className="card-premium">
        <CardContent className="p-4 space-y-3 text-sm">
          <h4 className="font-semibold">Termos do Vendedor Bravenza</h4>
          <div className="max-h-48 overflow-y-auto space-y-2 text-xs text-muted-foreground pr-2">
            <p><strong>1. Responsabilidade:</strong> O vendedor garante a autenticidade e veracidade das informações dos produtos anunciados.</p>
            <p><strong>2. Prazos de envio:</strong> Após a confirmação de pagamento, o vendedor tem até 3 dias úteis para enviar o produto. O não cumprimento pode resultar em cancelamento e penalidades.</p>
            <p><strong>3. Taxas:</strong> A Bravenza cobra uma taxa de serviço sobre cada venda, variando de 8% a 14% conforme o nível do vendedor.</p>
            <p><strong>4. Repasses:</strong> Os valores são repassados via PIX após a confirmação de entrega e encerramento da janela de proteção (48h a 10 dias, conforme tier).</p>
            <p><strong>5. Disputas:</strong> Em caso de disputa, a Bravenza atuará como mediadora. O vendedor deve fornecer evidências solicitadas em até 48h.</p>
            <p><strong>6. PRO Hub:</strong> Itens enviados via PRO Hub passam por inspeção física. Reprovações resultam em devolução ao vendedor, sem custos para o comprador.</p>
            <p><strong>7. Penalidades:</strong> Cancelamentos recorrentes, atrasos no envio ou anúncios falsos podem resultar em rebaixamento de tier ou suspensão.</p>
            <p><strong>8. Dados bancários:</strong> O vendedor é responsável por manter seus dados de repasse atualizados.</p>
            <p><strong>9. Verificação de identidade:</strong> O vendedor deve enviar documentos de identificação válidos. A aprovação é necessária antes de criar anúncios.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-2">
        <Checkbox
          id="terms"
          checked={termsAccepted}
          onCheckedChange={(v) => setTermsAccepted(!!v)}
        />
        <label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
          Li e aceito os <strong>Termos do Vendedor Bravenza</strong> e me comprometo a seguir as regras da plataforma.
        </label>
      </div>

      <div className="p-3 bg-muted/50 rounded-lg">
        <h5 className="text-xs font-semibold mb-1.5">Resumo do seu cadastro:</h5>
        <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
          <span>Nome: <strong className="text-foreground">{fullName}</strong></span>
          <span>CPF/CNPJ: <strong className="text-foreground">{cpfCnpj}</strong></span>
          <span>Tipo conta: <strong className="text-foreground">{derivedAccountType === "pj" ? "PJ" : "PF"}</strong></span>
          <span>Banco: <strong className="text-foreground">{bankName}</strong></span>
          <span>PIX: <strong className="text-foreground">{pixKeyType.toUpperCase()}</strong></span>
          <span>Beneficiário: <strong className="text-foreground">{pixBeneficiary}</strong></span>
        </div>
      </div>
    </div>
  );
}
