import { ShieldCheck, Repeat, ThumbsUp } from "lucide-react";

export function TrustBadges() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <TrustCard
        icon={<ShieldCheck className="h-5 w-5 text-primary" />}
        title="Autenticidade"
        description="Verificamos os anúncios utilizando diversos fatores que garantem que seu item seja 100% original e autêntico."
      />
      <TrustCard
        icon={<Repeat className="h-5 w-5 text-primary" />}
        title="Compre e venda"
        description="A Bravenza é uma plataforma de curadoria e intermediação de tênis exclusivos, proporcionando negociações seguras com total comodidade."
      />
      <TrustCard
        icon={<ThumbsUp className="h-5 w-5 text-primary" />}
        title="Compra garantida"
        description="Garantimos sua satisfação ou seu dinheiro de volta. Cada intermediação passa por verificação técnica antes da entrega."
      />
    </div>
  );
}

function TrustCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-4 rounded-xl border border-border/30 bg-muted/10 space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
