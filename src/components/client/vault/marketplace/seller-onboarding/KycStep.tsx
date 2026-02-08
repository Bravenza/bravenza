import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface KycStepProps {
  fullName: string;
  setFullName: (v: string) => void;
  cpfCnpj: string;
  setCpfCnpj: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  sellerCep: string;
  setSellerCep: (v: string) => void;
}

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 11) {
    return digits.replace(/(\d{3})(\d{3})?(\d{3})?(\d{2})?/, (_, a, b, c, d) =>
      [a, b, c].filter(Boolean).join(".") + (d ? `-${d}` : "")
    );
  }
  return digits.replace(/(\d{2})(\d{3})?(\d{3})?(\d{4})?(\d{2})?/, (_, a, b, c, d, e) =>
    [a, b, c].filter(Boolean).join(".") + (d ? `/${d}` : "") + (e ? `-${e}` : "")
  );
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})?(\d{4})?/, (_, a, b, c) =>
      `(${a})${b ? ` ${b}` : ""}${c ? `-${c}` : ""}`
    );
  }
  return digits.replace(/(\d{2})(\d{5})?(\d{4})?/, (_, a, b, c) =>
    `(${a})${b ? ` ${b}` : ""}${c ? `-${c}` : ""}`
  );
}

function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{5})(\d{3})?/, (_, a, b) => (b ? `${a}-${b}` : a));
}

export function KycStep({ fullName, setFullName, cpfCnpj, setCpfCnpj, phone, setPhone, sellerCep, setSellerCep }: KycStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Precisamos de algumas informações para validar seu perfil de vendedor.
      </p>
      <div className="space-y-3">
        <div>
          <Label htmlFor="fullName">Nome completo *</Label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome completo" />
        </div>
        <div>
          <Label htmlFor="cpfCnpj">CPF ou CNPJ *</Label>
          <Input id="cpfCnpj" value={cpfCnpj} onChange={(e) => setCpfCnpj(formatCPF(e.target.value))} placeholder="000.000.000-00" />
        </div>
        <div>
          <Label htmlFor="phone">Telefone *</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="(51) 99999-9999" />
        </div>
        <div>
          <Label htmlFor="cep">CEP de envio *</Label>
          <Input id="cep" value={sellerCep} onChange={(e) => setSellerCep(formatCEP(e.target.value))} placeholder="00000-000" />
        </div>
      </div>
    </div>
  );
}
