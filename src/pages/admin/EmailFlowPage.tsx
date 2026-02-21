import { EmailSettingsTab } from "@/components/admin/settings/EmailSettingsTab";
import { Mail } from "lucide-react";

export default function EmailFlowPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="h-6 w-6" />
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
