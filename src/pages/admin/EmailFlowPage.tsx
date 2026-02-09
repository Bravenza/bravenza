import { EmailSettingsTab } from "@/components/admin/settings/EmailSettingsTab";
import { Mail } from "lucide-react";

export default function EmailFlowPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Mail className="h-8 w-8" />
          Fluxo de Emails
        </h1>
        <p className="text-muted-foreground mt-2">
          Visualize e gerencie todos os emails automáticos do sistema: pedidos, marketplace, comunidade e automáticos.
        </p>
      </div>
      <EmailSettingsTab />
    </div>
  );
}
