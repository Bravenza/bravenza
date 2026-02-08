import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PayoutStepProps {
  isCnpj: boolean;
  pixKeyType: string;
  setPixKeyType: (v: string) => void;
  pixKey: string;
  setPixKey: (v: string) => void;
  pixBeneficiary: string;
  setPixBeneficiary: (v: string) => void;
  bankName: string;
  setBankName: (v: string) => void;
}

export function PayoutStep({ isCnpj, pixKeyType, setPixKeyType, pixKey, setPixKey, pixBeneficiary, setPixBeneficiary, bankName, setBankName }: PayoutStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Configure como deseja receber os repasses das suas vendas.
      </p>

      {isCnpj && (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="p-3 text-xs text-destructive flex items-center gap-2">
            <Badge variant="outline" className="border-destructive/50 text-destructive">PJ</Badge>
            CNPJ detectado — a conta bancária deve ser Pessoa Jurídica.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <div>
          <Label>Tipo de chave PIX *</Label>
          <Select value={pixKeyType} onValueChange={setPixKeyType}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cpf">CPF</SelectItem>
              <SelectItem value="cnpj">CNPJ</SelectItem>
              <SelectItem value="email">E-mail</SelectItem>
              <SelectItem value="phone">Telefone</SelectItem>
              <SelectItem value="random">Chave aleatória</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="pixKey">Chave PIX *</Label>
          <Input id="pixKey" value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="Sua chave PIX" />
        </div>
        <div>
          <Label htmlFor="pixBeneficiary">Beneficiário da conta *</Label>
          <Input id="pixBeneficiary" value={pixBeneficiary} onChange={(e) => setPixBeneficiary(e.target.value)} placeholder="Nome do titular da conta" />
          <p className="text-[11px] text-muted-foreground mt-1">
            ⚠️ O beneficiário deve ser o mesmo titular do cadastro ({isCnpj ? "razão social do CNPJ" : "nome do CPF"}).
          </p>
        </div>
        <div>
          <Label htmlFor="bankName">Banco *</Label>
          <Input id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ex: Nubank, Itaú, Bradesco..." />
        </div>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">Segurança:</strong> Seus dados bancários são criptografados e utilizados exclusivamente para repasses de vendas.
        </CardContent>
      </Card>
    </div>
  );
}
