import { ShieldCheck, Repeat, ThumbsUp } from "lucide-react";

export function TrustBadges() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <TrustCard
        icon={<ShieldCheck className="h-5 w-5 text-primary" />}
        title="Autenticidade"
        description="Verificamos utilizando critérios técnicos rigorosos para classificar cada item."
      />
      <TrustCard
        icon={<Repeat className="h-5 w-5 text-primary" />}
        title="Compre e venda"
        description="Plataforma de curadoria e intermediação com negociações seguras."
      />
      <TrustCard
        icon={<ThumbsUp className="h-5 w-5 text-primary" />}
        title="Compra garantida"
        description="Satisfação garantida ou seu dinheiro de volta com verificação técnica."
      />
    </div>
  );
}

function TrustCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl border border-border/20 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 flex-shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{description}</p>
      </div>
    </div>
  );
}
