import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { FileText, type LucideIcon } from "lucide-react";
import { PublicLayout } from "@/components/layouts/PublicLayout";

interface PolicyPageLayoutProps {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  subtitle?: string;
  children: ReactNode;
  relatedPolicies?: { label: string; to: string }[];
}

const ALL_POLICIES = [
  { label: "Termos de Uso", to: "/termos" },
  { label: "Política de Privacidade", to: "/politicas" },
  { label: "Trocas e Devoluções", to: "/trocas-devolucoes" },
  { label: "Diretrizes de Anúncios", to: "/diretrizes-anuncio" },
  { label: "Regras do Marketplace e Club Vault", to: "/regras-marketplace" },
  { label: "Verificação / Autenticação", to: "/verificacao-autenticidade" },
];

export function PolicyPageLayout({
  icon: Icon,
  title,
  description,
  subtitle,
  children,
  relatedPolicies,
}: PolicyPageLayoutProps) {
  const links = relatedPolicies ?? ALL_POLICIES;

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-6">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {title}
          </h1>
          <div className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {description}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-4">{subtitle}</p>
          )}
        </div>

        {/* Content */}
        <div className="space-y-12">
          {children}
        </div>

        {/* Related links */}
        <div className="mt-16 pt-8 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">Políticas relacionadas</h3>
          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

/* Section title with icon badge */
export function PolicySection({
  icon: Icon,
  number,
  title,
  children,
}: {
  icon: LucideIcon;
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground leading-none">
          {number}. {title}
        </h2>
      </div>
      <div className="ml-[3.25rem] space-y-4">{children}</div>
    </section>
  );
}

/* Part divider header for long docs */
export function PolicyPartHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
      <h2 className="text-2xl font-bold text-foreground mb-1">{title}</h2>
      <p className="text-muted-foreground text-sm">{subtitle}</p>
    </div>
  );
}

/* Bullet list with primary dots */
export function PolicyBulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* Prohibited items list with red icon */
export function PolicyProhibitedList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* Numbered paragraphs */
export function PolicyParagraphs({ items }: { items: { num: string; text: ReactNode }[] }) {
  return (
    <div className="space-y-4 text-muted-foreground">
      {items.map((item, i) => (
        <p key={i}>
          <strong className="text-foreground">{item.num}</strong> {item.text}
        </p>
      ))}
    </div>
  );
}

/* Alert / highlight box */
export function PolicyAlert({
  children,
  variant = "primary",
}: {
  children: ReactNode;
  variant?: "primary" | "destructive";
}) {
  const colors =
    variant === "destructive"
      ? "bg-destructive/10 border-destructive/30"
      : "bg-primary/5 border-primary/20";
  return (
    <div className={`p-4 rounded-xl border ${colors}`}>
      {children}
    </div>
  );
}

/* Final notice / CTA box */
export function PolicyNotice({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-2xl border border-primary/30 bg-primary/5 text-center">
      <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
      <p className="text-foreground font-semibold text-lg mb-1">{title}</p>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
