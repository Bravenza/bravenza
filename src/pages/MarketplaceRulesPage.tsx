import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import PublicLayout from "@/components/layouts/PublicLayout";
import { 
  ShoppingBag, Users, Package, CreditCard, Wallet, ShieldCheck, Truck, 
  BarChart3, Scale, Ban, FileText, Crown, Star, MessageSquare, BookOpen, 
  Heart, Headphones, UserPlus, UserX, Lock, RefreshCw,
  AlertTriangle, CheckCircle2
} from "lucide-react";

const SectionTitle = ({ icon: Icon, number, title }: { icon: React.ElementType; number: string; title: string }) => (
  <div className="flex items-center gap-3 mb-4 mt-10 first:mt-0">
    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <h2 className="text-xl font-bold text-foreground">{number}. {title}</h2>
  </div>
);

const PartHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="mt-14 mb-8 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
    <h2 className="text-2xl font-bold text-foreground mb-1">{title}</h2>
    <p className="text-muted-foreground text-sm">{subtitle}</p>
  </div>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 ml-1">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-2 text-muted-foreground text-sm leading-relaxed">
        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const ProhibitedList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 ml-1">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-2 text-muted-foreground text-sm leading-relaxed">
        <Ban className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const MarketplaceRulesPage = () => {
  return (
    <PublicLayout>
      <Helmet>
        <title>Regras do Marketplace e Club Vault | BRAVENZA</title>
        <meta name="description" content="Regras de funcionamento do Marketplace BRAVENZA e do Club Vault. Direitos, deveres e padrões de conduta para compradores e vendedores." />
      </Helmet>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Regras do Marketplace e Club Vault
          </h1>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Estas regras estabelecem o funcionamento do Marketplace BRAVENZA e do Club Vault, definindo direitos, deveres, limites operacionais e padrões de conduta para todos os usuários. Elas complementam os{" "}
            <Link to="/termos" className="text-primary hover:underline">Termos de Uso</Link>,{" "}
            <Link to="/diretrizes-anuncio" className="text-primary hover:underline">Diretrizes de Anúncios</Link>,{" "}
            <Link to="/trocas-devolucoes" className="text-primary hover:underline">Política de Trocas e Devoluções</Link>{" "}
            e demais políticas da BRAVENZA.
          </p>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-sm text-foreground font-medium">
              O uso da plataforma implica ciência e aceite integral destas regras.
            </p>
          </div>
        </div>

        {/* PARTE I */}
        <PartHeader title="PARTE I — MARKETPLACE BRAVENZA" subtitle="Regras de compra, venda e operação no Marketplace" />

        <div className="space-y-6">
          <SectionTitle icon={ShoppingBag} number="1" title="Natureza do Marketplace" />
          <p className="text-muted-foreground text-sm leading-relaxed">
            O Marketplace BRAVENZA é um ambiente digital de intermediação onde:
          </p>
          <BulletList items={[
            "Compradores podem adquirir produtos anunciados;",
            "Vendedores aprovados podem anunciar e vender produtos próprios."
          ]} />
          <p className="text-muted-foreground text-sm leading-relaxed mt-3">
            A BRAVENZA atua como plataforma tecnológica de intermediação, não sendo parte integrante da compra e venda entre usuários, salvo quando o anúncio indicar expressamente venda direta pela própria BRAVENZA.
          </p>

          <SectionTitle icon={Users} number="2" title="Tipos de Usuário no Marketplace" />
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-card border border-border/60">
              <h3 className="font-semibold text-foreground mb-2 text-sm">2.1 Comprador</h3>
              <BulletList items={[
                "Pode comprar produtos;",
                "Não pode anunciar ou vender;",
                "Deve cumprir regras de pagamento, devolução e disputa."
              ]} />
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/60">
              <h3 className="font-semibold text-foreground mb-2 text-sm">2.2 Vendedor Aprovado</h3>
              <BulletList items={[
                "Pode anunciar e vender produtos;",
                "Está sujeito a auditorias, métricas de desempenho e conformidade;",
                "Pode perder o direito de venda a qualquer momento."
              ]} />
            </div>
          </div>

          <SectionTitle icon={Package} number="3" title="Modalidades de Venda" />
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-card border border-border/60">
              <h3 className="font-semibold text-foreground mb-2 text-sm">3.1 Pronta Entrega</h3>
              <BulletList items={[
                "Produto em posse física do vendedor;",
                "Postagem obrigatória em até 3 dias úteis após confirmação do pagamento."
              ]} />
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/60">
              <h3 className="font-semibold text-foreground mb-2 text-sm">3.2 Sob Encomenda</h3>
              <BulletList items={[
                "Produto sem estoque imediato;",
                "Exige controle real da aquisição;",
                "Prazo deve estar explícito no anúncio."
              ]} />
            </div>
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-foreground font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                Dropshipping é proibido, salvo autorização formal da BRAVENZA.
              </p>
            </div>
          </div>

          <SectionTitle icon={CreditCard} number="4" title="Pagamentos e Split de Valores" />
          <BulletList items={[
            "Todo pagamento ocorre dentro da BRAVENZA;",
            "Pode existir split automático: parte do valor → vendedor; taxas/serviços → BRAVENZA.",
            "A BRAVENZA pode utilizar gateways e adquirentes terceiros, não se responsabilizando por falhas exclusivas desses serviços."
          ]} />

          <SectionTitle icon={Wallet} number="5" title="Saldo do Vendedor" />
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-card border border-border/60">
              <h3 className="font-semibold text-foreground mb-2 text-sm">5.1 Status do saldo</h3>
              <BulletList items={[
                "Saldo a Liberar: período de proteção após entrega;",
                "Saldo Disponível: liberado para saque."
              ]} />
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/60">
              <h3 className="font-semibold text-foreground mb-2 text-sm">5.2 Prazo Padrão</h3>
              <p className="text-sm text-muted-foreground">O saldo se torna disponível em até <strong className="text-foreground">8 dias</strong> após confirmação de recebimento.</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/60">
              <h3 className="font-semibold text-foreground mb-2 text-sm">5.3 Retenção Preventiva</h3>
              <p className="text-sm text-muted-foreground mb-2">A BRAVENZA pode reter valores em casos de:</p>
              <BulletList items={["Disputas;", "Chargebacks;", "Suspeita de fraude;", "Divergências de produto;", "Exigências legais."]} />
            </div>
          </div>

          <SectionTitle icon={ShieldCheck} number="6" title="Verificação BRAVENZA" />
          <BulletList items={[
            "Obrigatória para itens acima de R$ 2.000,00;",
            "Opcional abaixo desse valor."
          ]} />
          <p className="text-muted-foreground text-sm mt-2">A verificação é opinativa e não constitui certificação oficial de marcas.</p>

          <SectionTitle icon={Truck} number="7" title="Postagem e Logística" />
          <BulletList items={[
            "Prazo máximo de envio: 3 dias úteis;",
            "Embalagem adequada é responsabilidade do vendedor;",
            "Danos por embalagem inadequada podem gerar responsabilização."
          ]} />

          <SectionTitle icon={BarChart3} number="8" title="Métricas de Qualidade do Vendedor" />
          <p className="text-muted-foreground text-sm mb-2">A BRAVENZA pode monitorar:</p>
          <BulletList items={[
            "Taxa de cancelamento;",
            "Atrasos;",
            "Disputas;",
            "Chargebacks;",
            "Avaliações;",
            "Conformidade documental."
          ]} />
          <p className="text-muted-foreground text-sm mt-4 mb-2 font-medium text-foreground">Consequências possíveis:</p>
          <BulletList items={[
            "Limite de anúncios;",
            "Verificação obrigatória;",
            "Suspensão de vendas;",
            "Banimento."
          ]} />

          <SectionTitle icon={Scale} number="9" title="Disputas" />
          <p className="text-muted-foreground text-sm mb-2">Quando não há acordo entre comprador e vendedor:</p>
          <BulletList items={[
            "A BRAVENZA pode abrir disputa;",
            "O valor permanece bloqueado;",
            "As partes apresentam provas;",
            "A decisão final é baseada em políticas internas e legislação."
          ]} />

          <SectionTitle icon={Ban} number="10" title="Condutas Proibidas no Marketplace" />
          <ProhibitedList items={[
            "Direcionar vendas para fora da plataforma;",
            "Manipular avaliações;",
            "Simular vendas;",
            "Comercializar itens falsificados;",
            "Usar bots ou automações indevidas;",
            "Anunciar itens sem procedência;",
            "Enviar item diferente do anunciado."
          ]} />

          <SectionTitle icon={FileText} number="11" title="Responsabilidades Fiscais" />
          <p className="text-muted-foreground text-sm leading-relaxed">
            A BRAVENZA não é responsável pela emissão de nota fiscal de produtos vendidos por terceiros. O vendedor é responsável por tributos e documentação fiscal quando exigível.
          </p>
        </div>

        {/* PARTE II */}
        <PartHeader title="PARTE II — CLUB VAULT BRAVENZA" subtitle="Regras do ambiente exclusivo para membros aprovados" />

        <div className="space-y-6">
          <SectionTitle icon={Crown} number="12" title="Natureza do Club Vault" />
          <p className="text-muted-foreground text-sm mb-2">
            O Club Vault é um ambiente fechado e premium, voltado a membros aprovados, combinando:
          </p>
          <BulletList items={[
            "Permissão de venda no marketplace;",
            "Comunidade privada;",
            "Conteúdos exclusivos;",
            "Wishlist ativa com busca personalizada;",
            "Atendimento prioritário;",
            "Sistema de convites e indicações."
          ]} />
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mt-3">
            <p className="text-sm text-foreground font-medium">A permanência no Club Vault não é direito adquirido.</p>
          </div>

          <SectionTitle icon={Star} number="13" title="Benefícios Operacionais" />
          <p className="text-muted-foreground text-sm mb-2">Membros do Club Vault podem ter acesso a:</p>
          <BulletList items={[
            "Maior visibilidade de anúncios;",
            "Destaque em listagens;",
            "Limites ampliados de anúncios;",
            "Convites para campanhas e drops;",
            "Recursos avançados de métricas."
          ]} />
          <p className="text-muted-foreground text-sm mt-2 italic">Benefícios podem ser alterados ou removidos a qualquer momento.</p>

          <SectionTitle icon={MessageSquare} number="14" title="Comunidade Privada" />
          <p className="text-muted-foreground text-sm mb-2">Os membros podem:</p>
          <BulletList items={[
            "Criar tópicos;",
            "Participar de discussões;",
            "Compartilhar experiências e informações."
          ]} />
          <p className="text-foreground text-sm font-medium mt-4 mb-2">Condutas proibidas na comunidade:</p>
          <ProhibitedList items={[
            "Ofensas, discurso de ódio ou discriminação;",
            "Divulgação de dados pessoais;",
            "Venda fora da plataforma;",
            "Spam ou autopromoção abusiva;",
            "Conteúdo ilegal ou pirata."
          ]} />

          <SectionTitle icon={BookOpen} number="15" title="Conteúdos Exclusivos" />
          <p className="text-muted-foreground text-sm mb-2">O Club Vault pode disponibilizar:</p>
          <BulletList items={[
            "Guias de autenticidade;",
            "Tendências de mercado;",
            "Materiais educativos;",
            "Curadoria especializada."
          ]} />
          <p className="text-muted-foreground text-sm mt-2 italic">Esses conteúdos são protegidos por direitos autorais e não podem ser reproduzidos externamente.</p>

          <SectionTitle icon={Heart} number="16" title="Wishlist Ativa" />
          <p className="text-muted-foreground text-sm mb-2">Membros podem cadastrar produtos desejados para que a BRAVENZA:</p>
          <BulletList items={[
            "Realize buscas ativas;",
            "Apresente oportunidades;",
            "Faça curadoria personalizada."
          ]} />
          <p className="text-muted-foreground text-sm mt-2 italic">Não constitui garantia de disponibilidade.</p>

          <SectionTitle icon={Headphones} number="17" title="Atendimento Prioritário" />
          <BulletList items={[
            "Fila de suporte diferenciada;",
            "Tempo de resposta reduzido;",
            "Canais prioritários quando disponíveis."
          ]} />

          <SectionTitle icon={UserPlus} number="18" title="Convites e Indicações" />
          <p className="text-muted-foreground text-sm mb-2">A BRAVENZA pode permitir que membros:</p>
          <BulletList items={[
            "Convidem novos usuários;",
            "Participem de programas de indicação."
          ]} />
          <p className="text-muted-foreground text-sm mt-2 italic">Convites podem ser limitados ou suspensos.</p>

          <SectionTitle icon={UserX} number="19" title="Perda de Status ou Exclusão" />
          <p className="text-muted-foreground text-sm mb-2">Pode ocorrer em casos de:</p>
          <BulletList items={[
            "Fraude;",
            "Conduta inadequada;",
            "Alta taxa de disputas;",
            "Violação de políticas;",
            "Risco jurídico ou operacional."
          ]} />

          <SectionTitle icon={Lock} number="20" title="Propriedade Intelectual e Sigilo" />
          <p className="text-muted-foreground text-sm leading-relaxed">
            Conteúdos e discussões internas são protegidos por direitos autorais. O compartilhamento externo sem autorização pode gerar sanções.
          </p>

          <SectionTitle icon={RefreshCw} number="21" title="Atualizações das Regras" />
          <p className="text-muted-foreground text-sm leading-relaxed">
            A BRAVENZA pode alterar regras e benefícios a qualquer momento. O uso contínuo representa aceite das versões atualizadas.
          </p>
        </div>

        {/* Footer links */}
        <div className="mt-14 pt-8 border-t border-border/50">
          <h3 className="font-semibold text-foreground mb-4">Políticas Relacionadas</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: "Termos de Uso", to: "/termos" },
              { label: "Política de Trocas e Devoluções", to: "/trocas-devolucoes" },
              { label: "Diretrizes de Anúncios", to: "/diretrizes-anuncio" },
              { label: "Política de Privacidade", to: "/politicas" },
              { label: "Verificação / Autenticação", to: "/sobre-autenticidade" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border/60 hover:border-primary/40 transition-colors text-sm text-foreground hover:text-primary"
              >
                <FileText className="h-4 w-4 text-primary shrink-0" />
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-8 p-4 rounded-xl bg-muted/30 border border-border/40 text-center">
            <p className="text-sm text-muted-foreground mb-2">Dúvidas sobre as regras?</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="mailto:contato@bravenza.com.br"
                className="text-sm text-primary hover:underline"
              >
                contato@bravenza.com.br
              </a>
              <a
                href="https://wa.me/5551981055425"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                WhatsApp (51) 98105-5425
              </a>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default MarketplaceRulesPage;
