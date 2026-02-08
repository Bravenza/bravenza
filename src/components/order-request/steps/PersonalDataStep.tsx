import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";

interface PersonalDataStepProps {
  formData: {
    client_name: string;
    client_cpf: string;
    client_email: string;
    client_phone: string;
  };
  updateField: (field: string, value: string) => void;
  formatCpf: (value: string) => string;
  formatPhone: (value: string) => string;
}

export const PersonalDataStep = ({
  formData,
  updateField,
  formatCpf,
  formatPhone,
}: PersonalDataStepProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Dados Pessoais</h2>
          <p className="text-sm text-muted-foreground">Suas informações de contato</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="client_name">Nome Completo *</Label>
          <Input
            id="client_name"
            value={formData.client_name}
            onChange={(e) => updateField("client_name", e.target.value)}
            placeholder="Seu nome completo"
            className="h-12"
            autoFocus
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="client_cpf">CPF *</Label>
          <Input
            id="client_cpf"
            value={formData.client_cpf}
            onChange={(e) => updateField("client_cpf", formatCpf(e.target.value))}
            placeholder="000.000.000-00"
            className="h-12"
            inputMode="numeric"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="client_phone">Telefone *</Label>
          <Input
            id="client_phone"
            value={formData.client_phone}
            onChange={(e) => updateField("client_phone", formatPhone(e.target.value))}
            placeholder="(00) 00000-0000"
            className="h-12"
            inputMode="tel"
            autoComplete="tel"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="client_email">E-mail *</Label>
          <Input
            id="client_email"
            type="email"
            value={formData.client_email}
            onChange={(e) => updateField("client_email", e.target.value)}
            placeholder="seu@email.com"
            className="h-12"
            inputMode="email"
            autoComplete="email"
          />
        </div>
      </div>
    </div>
  );
};
