import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  ShoppingBag, Users, Package, CreditCard, Wallet, ShieldCheck, Truck,
  BarChart3, Scale, Ban, FileText, Crown, Star, MessageSquare, BookOpen,
  Heart, Headphones, UserPlus, UserX, Lock, RefreshCw, AlertTriangle
} from "lucide-react";
import {
  PolicyPageLayout, PolicySection, PolicyPartHeader, PolicyBulletList,
  PolicyProhibitedList, PolicyAlert, PolicyNotice
} from "@/components/policy/PolicyPageLayout";

const MarketplaceRulesPage = () => {
  return (
    <>
      <Helmet>
        <title>Regras do Marketplace e Club Vault | BRAVENZA</title>
        <meta name="description" content="Regras de funcionamento do Marketplace BRAVENZA e do Club Vault. Direitos, deveres e padrões de conduta para compradores e vendedores." />
      </Helmet>

      <PolicyPageLayout
        icon={ShoppingBag}
        title="Regras do Marketplace e Club Vault"
        description={
          <>
            Estas regras estabelecem o funcionamento do Marketplace BRAVENZA e do Club Vault, definindo direitos, deveres, limites operacionais e padrões de conduta para todos os usuários. Elas complementam os{" "}
            <Link to="/termos" className="text-primary hover:underline">Termos de Uso</Link>,{" "}
            <Link to="/diretrizes-anuncio" className="text-primary hover:underline">Diretrizes de Anúncios</Link>,{" "}
            <Link to="/trocas-devolucoes" className="text-primary hover:underline">Política de Trocas e Devoluções</Link> e demais políticas da BRAVENZA.
          </>
        }
        subtitle="O uso da plataforma implica ciência e aceite integral destas regras."
      >
        {/* PARTE I */}
        <PolicyPartHeader title="PARTE I — MARKETPLACE BRAVENZA" subtitle="Regras de compra, venda e operação no Marketplace" />

        <PolicySection icon={ShoppingBag} number="1" title="Natureza do Marketplace">
          <p className="text-muted-foreground mb-3">O Marketplace BRAVENZA é um ambiente digital de intermediação onde:</p>
          <PolicyBulletList items={["Compradores podem adquirir produtos anunciados;", "Vendedores aprovados podem anunciar e vender produtos próprios."]} />
          <p className="text-muted-foreground mt-3">A BRAVENZA atua como plataforma tecnológica de intermediação, não sendo parte integrante da compra e venda entre usuários, salvo quando o anúncio indicar expressamente venda direta pela própria BRAVENZA.</p>
        </PolicySection>

        <PolicySection icon={Users} number="2" title="Tipos de Usuário no Marketplace">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card/50">
              <h3 className="font-semibold text-foreground mb-2 text-sm">2.1 Comprador</h3>
              <PolicyBulletList items={["Pode comprar produtos;", "Não pode anunciar ou vender;", "Deve cumprir regras de pagamento, devolução e disputa."]} />
            </div>
            <div className="p-4 rounded-xl border border-border bg-card/50">
              <h3 className="font-semibold text-foreground mb-2 text-sm">2.2 Vendedor Aprovado</h3>
              <PolicyBulletList items={["Pode anunciar e vender produtos;", "Está sujeito a auditorias, métricas de desempenho e conformidade;", "Pode perder o direito de venda a qualquer momento."]} />
            </div>
          </div>
        </PolicySection>

        <PolicySection icon={Package} number="3" title="Modalidades de Venda">
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card/50">
              <h3 className="font-semibold text-foreground mb-2 text-sm">3.1 Pronta Entrega</h3>
              <PolicyBulletList items={["Produto em posse física do vendedor;", "Postagem obrigatória em até 3 dias úteis após confirmação do pagamento."]} />
            </div>
            <div className="p-4 rounded-xl border border-border bg-card/50">
              <h3 className="font-semibold text-foreground mb-2 text-sm">3.2 Sob Encomenda</h3>
              <PolicyBulletList items={["Produto sem estoque imediato;", "Exige controle real da aquisição;", "Prazo deve estar explícito no anúncio."]} />
            </div>
            <PolicyAlert variant="destructive">
              <p className="text-sm text-foreground font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                Dropshipping é proibido, salvo autorização formal da BRAVENZA.
              </p>
            </PolicyAlert>
          </div>
        </PolicySection>

        <PolicySection icon={CreditCard} number="4" title="Pagamentos e Split de Valores">
          <PolicyBulletList items={[
            "Todo pagamento ocorre dentro da BRAVENZA;",
            "Pode existir split automático: parte do valor → vendedor; taxas/serviços → BRAVENZA.",
            "A BRAVENZA pode utilizar gateways e adquirentes terceiros, não se responsabilizando por falhas exclusivas desses serviços."
          ]} />
        </PolicySection>

        <PolicySection icon={Wallet} number="5" title="Saldo do Vendedor">
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card/50">
              <h3 className="font-semibold text-foreground mb-2 text-sm">5.1 Status do saldo</h3>
              <PolicyBulletList items={["Saldo a Liberar: período de proteção após entrega;", "Saldo Disponível: liberado para saque."]} />
            </div>
            <div className="p-4 rounded-xl border border-border bg-card/50">
              <h3 className="font-semibold text-foreground mb-2 text-sm">5.2 Prazo Padrão</h3>
              <p className="text-sm text-muted-foreground">O saldo se torna disponível em até <strong className="text-foreground">8 dias</strong> após confirmação de recebimento.</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card/50">
              <h3 className="font-semibold text-foreground mb-2 text-sm">5.3 Retenção Preventiva</h3>
              <p className="text-sm text-muted-foreground mb-2">A BRAVENZA pode reter valores em casos de:</p>
              <PolicyBulletList items={["Disputas;", "Chargebacks;", "Suspeita de fraude;", "Divergências de produto;", "Exigências legais."]} />
            </div>
          </div>
        </PolicySection>

        <PolicySection icon={ShieldCheck} number="6" title="Verificação BRAVENZA">
          <PolicyBulletList items={["Obrigatória para itens acima de R$ 2.000,00;", "Opcional abaixo desse valor."]} />
          <p className="text-muted-foreground mt-2">A verificação é opinativa e não constitui certificação oficial de marcas.</p>
        </PolicySection>

        <PolicySection icon={Truck} number="7" title="Postagem e Logística">
          <PolicyBulletList items={["Prazo máximo de envio: 3 dias úteis;", "Embalagem adequada é responsabilidade do vendedor;", "Danos por embalagem inadequada podem gerar responsabilização."]} />
        </PolicySection>

        <PolicySection icon={BarChart3} number="8" title="Métricas de Qualidade do Vendedor">
          <p className="text-muted-foreground mb-2">A BRAVENZA pode monitorar:</p>
          <PolicyBulletList items={["Taxa de cancelamento;", "Atrasos;", "Disputas;", "Chargebacks;", "Avaliações;", "Conformidade documental."]} />
          <p className="text-foreground text-sm font-medium mt-4 mb-2">Consequências possíveis:</p>
          <PolicyBulletList items={["Limite de anúncios;", "Verificação obrigatória;", "Suspensão de vendas;", "Banimento."]} />
        </PolicySection>

        <PolicySection icon={Scale} number="9" title="Disputas">
          <p className="text-muted-foreground mb-2">Quando não há acordo entre comprador e vendedor:</p>
          <PolicyBulletList items={["A BRAVENZA pode abrir disputa;", "O valor permanece bloqueado;", "As partes apresentam provas;", "A decisão final é baseada em políticas internas e legislação."]} />
        </PolicySection>

        <PolicySection icon={Ban} number="10" title="Condutas Proibidas no Marketplace">
          <PolicyProhibitedList items={["Direcionar vendas para fora da plataforma;", "Manipular avaliações;", "Simular vendas;", "Comercializar itens falsificados;", "Usar bots ou automações indevidas;", "Anunciar itens sem procedência;", "Enviar item diferente do anunciado."]} />
        </PolicySection>

        <PolicySection icon={FileText} number="11" title="Responsabilidades Fiscais">
          <p className="text-muted-foreground">A BRAVENZA não é responsável pela emissão de nota fiscal de produtos vendidos por terceiros. O vendedor é responsável por tributos e documentação fiscal quando exigível.</p>
        </PolicySection>

        {/* PARTE II */}
        <PolicyPartHeader title="PARTE II — CLUB VAULT BRAVENZA" subtitle="Regras do ambiente exclusivo para membros aprovados" />

        <PolicySection icon={Crown} number="12" title="Natureza do Club Vault">
          <p className="text-muted-foreground mb-2">O Club Vault é um ambiente fechado e premium, voltado a membros aprovados, combinando:</p>
          <PolicyBulletList items={["Permissão de venda no marketplace;", "Comunidade privada;", "Conteúdos exclusivos;", "Wishlist ativa com busca personalizada;", "Atendimento prioritário;", "Sistema de convites e indicações."]} />
          <PolicyAlert>
            <p className="text-sm text-foreground font-medium">A permanência no Club Vault não é direito adquirido.</p>
          </PolicyAlert>
        </PolicySection>

        <PolicySection icon={Star} number="13" title="Benefícios Operacionais">
          <p className="text-muted-foreground mb-2">Membros do Club Vault podem ter acesso a:</p>
          <PolicyBulletList items={["Maior visibilidade de anúncios;", "Destaque em listagens;", "Limites ampliados de anúncios;", "Convites para campanhas e drops;", "Recursos avançados de métricas."]} />
          <p className="text-muted-foreground mt-2 italic text-sm">Benefícios podem ser alterados ou removidos a qualquer momento.</p>
        </PolicySection>

        <PolicySection icon={MessageSquare} number="14" title="Comunidade Privada">
          <p className="text-muted-foreground mb-2">Os membros podem:</p>
          <PolicyBulletList items={["Criar tópicos;", "Participar de discussões;", "Compartilhar experiências e informações."]} />
          <p className="text-foreground text-sm font-medium mt-4 mb-2">Condutas proibidas na comunidade:</p>
          <PolicyProhibitedList items={["Ofensas, discurso de ódio ou discriminação;", "Divulgação de dados pessoais;", "Venda fora da plataforma;", "Spam ou autopromoção abusiva;", "Conteúdo ilegal ou pirata."]} />
        </PolicySection>

        <PolicySection icon={BookOpen} number="15" title="Conteúdos Exclusivos">
          <p className="text-muted-foreground mb-2">O Club Vault pode disponibilizar:</p>
          <PolicyBulletList items={["Guias de autenticidade;", "Tendências de mercado;", "Materiais educativos;", "Curadoria especializada."]} />
          <p className="text-muted-foreground mt-2 italic text-sm">Esses conteúdos são protegidos por direitos autorais e não podem ser reproduzidos externamente.</p>
        </PolicySection>

        <PolicySection icon={Heart} number="16" title="Wishlist Ativa">
          <p className="text-muted-foreground mb-2">Membros podem cadastrar produtos desejados para que a BRAVENZA:</p>
          <PolicyBulletList items={["Realize buscas ativas;", "Apresente oportunidades;", "Faça curadoria personalizada."]} />
          <p className="text-muted-foreground mt-2 italic text-sm">Não constitui garantia de disponibilidade.</p>
        </PolicySection>

        <PolicySection icon={Headphones} number="17" title="Atendimento Prioritário">
          <PolicyBulletList items={["Fila de suporte diferenciada;", "Tempo de resposta reduzido;", "Canais prioritários quando disponíveis."]} />
        </PolicySection>

        <PolicySection icon={UserPlus} number="18" title="Convites e Indicações">
          <p className="text-muted-foreground mb-2">A BRAVENZA pode permitir que membros:</p>
          <PolicyBulletList items={["Convidem novos usuários;", "Participem de programas de indicação."]} />
          <p className="text-muted-foreground mt-2 italic text-sm">Convites podem ser limitados ou suspensos.</p>
        </PolicySection>

        <PolicySection icon={UserX} number="19" title="Perda de Status ou Exclusão">
          <p className="text-muted-foreground mb-2">Pode ocorrer em casos de:</p>
          <PolicyBulletList items={["Fraude;", "Conduta inadequada;", "Alta taxa de disputas;", "Violação de políticas;", "Risco jurídico ou operacional."]} />
        </PolicySection>

        <PolicySection icon={Lock} number="20" title="Propriedade Intelectual e Sigilo">
          <p className="text-muted-foreground">Conteúdos e discussões internas são protegidos por direitos autorais. O compartilhamento externo sem autorização pode gerar sanções.</p>
        </PolicySection>

        <PolicySection icon={RefreshCw} number="21" title="Atualizações das Regras">
          <p className="text-muted-foreground">A BRAVENZA pode alterar regras e benefícios a qualquer momento. O uso contínuo representa aceite das versões atualizadas.</p>
        </PolicySection>

        <PolicyNotice
          icon={ShoppingBag}
          title="Marketplace e Club Vault BRAVENZA"
          description="Transparência, segurança e confiança em cada transação."
        />

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Dúvidas sobre as regras?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="mailto:contato@bravenza.com.br" className="text-sm text-primary hover:underline">contato@bravenza.com.br</a>
            <a href="https://wa.me/5551981055425" className="text-sm text-primary hover:underline">WhatsApp: 51 98105.5425</a>
          </div>
        </div>
      </PolicyPageLayout>
    </>
  );
};

export default MarketplaceRulesPage;
